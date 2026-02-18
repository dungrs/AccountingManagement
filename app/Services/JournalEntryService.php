<?php

namespace App\Services;

use App\Repositories\AccountingAccountRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use App\Repositories\Journal\JournalEntryRepository;
use App\Services\BaseService;
use App\Services\Interfaces\JournalEntryServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class JournalEntryService extends BaseService implements JournalEntryServiceInterface
{
    protected $journalEntryRepository;
    protected $journalEntryDetailRepository;
    protected $accountingAccountRepository;

    public function __construct(
        JournalEntryRepository $journalEntryRepository,
        JournalEntryDetailRepository $journalEntryDetailRepository,
        AccountingAccountRepository $accountingAccountRepository
    ) {
        $this->journalEntryRepository = $journalEntryRepository;
        $this->journalEntryDetailRepository = $journalEntryDetailRepository;
        $this->accountingAccountRepository = $accountingAccountRepository;
    }

    /**
     * Tạo định khoản từ request data
     */
    public function createFromRequest($referenceType, $referenceId, array $journalEntries, $entryDate = null)
    {
        return DB::transaction(function () use ($referenceType, $referenceId, $journalEntries, $entryDate) {

            // Kiểm tra cân bằng debit và credit
            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($journalEntries as $entry) {
                $totalDebit += $entry['debit'] ?? 0;
                $totalCredit += $entry['credit'] ?? 0;
            }

            if (abs($totalDebit - $totalCredit) > 0.01) { // Cho phép sai số nhỏ
                throw new \Exception('Tổng debit và credit không cân bằng.');
            }

            // Tạo journal entry
            $journalEntry = $this->journalEntryRepository->create([
                'code'           => $this->generateJournalEntryCode(),
                'reference_type' => $referenceType,
                'reference_id'   => $referenceId,
                'entry_date'     => $entryDate ?? now(),
                'created_by'     => Auth::id(),
            ]);

            // Tạo chi tiết định khoản
            foreach ($journalEntries as $entry) {
                // Tìm account_id từ account_code
                $account = $this->accountingAccountRepository->findByCondition(
                    [['account_code', '=', $entry['account_code']]],
                    false
                );

                if (!$account) {
                    throw new \Exception("Tài khoản {$entry['account_code']} không tồn tại.");
                }

                $this->journalEntryDetailRepository->create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id'       => $account->id,
                    'debit'            => $entry['debit'] ?? 0,
                    'credit'           => $entry['credit'] ?? 0,
                ]);
            }

            return $journalEntry;
        });
    }

    /**
     * Cập nhật định khoản theo reference
     * Thay vì xóa và tạo lại, phương thức này sẽ cập nhật các chi tiết định khoản hiện có
     */
    public function updateJournalByReference($referenceType, $referenceId, array $journalEntries, $entryDate = null)
    {
        return DB::transaction(function () use ($referenceType, $referenceId, $journalEntries, $entryDate) {

            // Kiểm tra cân bằng debit và credit
            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($journalEntries as $entry) {
                $totalDebit += $entry['debit'] ?? 0;
                $totalCredit += $entry['credit'] ?? 0;
            }

            if (abs($totalDebit - $totalCredit) > 0.01) {
                throw new \Exception('Tổng debit và credit không cân bằng.');
            }

            // Lấy journal entry hiện tại
            $journalEntry = $this->journalEntryRepository->findByCondition(
                [
                    ['reference_type', '=', $referenceType],
                    ['reference_id', '=', $referenceId]
                ],
                false
            );

            if (!$journalEntry) {
                // Nếu không có định khoản, tạo mới
                return $this->createFromRequest($referenceType, $referenceId, $journalEntries, $entryDate);
            }

            // Cập nhật thông tin journal entry
            $updateData = [];
            if ($entryDate) {
                $updateData['entry_date'] = $entryDate;
            }

            if (!empty($updateData)) {
                $this->journalEntryRepository->update($journalEntry->id, $updateData);
            }

            // Lấy danh sách detail hiện tại
            $existingDetails = $this->journalEntryDetailRepository->findByCondition(
                [['journal_entry_id', '=', $journalEntry->id]],
                true
            )->keyBy('id');

            $processedDetailIds = [];

            // Xử lý từng entry mới
            foreach ($journalEntries as $entry) {
                // Tìm account
                $account = $this->accountingAccountRepository->findByCondition(
                    [['account_code', '=', $entry['account_code']]],
                    false
                );

                if (!$account) {
                    throw new \Exception("Tài khoản {$entry['account_code']} không tồn tại.");
                }

                // Tìm detail hiện có với account này
                $existingDetail = $existingDetails->first(function ($detail) use ($account) {
                    return $detail->account_id == $account->id;
                });

                if ($existingDetail) {
                    // Cập nhật detail hiện có
                    $this->journalEntryDetailRepository->update($existingDetail->id, [
                        'debit'  => $entry['debit'] ?? 0,
                        'credit' => $entry['credit'] ?? 0,
                    ]);
                    $processedDetailIds[] = $existingDetail->id;
                } else {
                    // Tạo detail mới
                    $newDetail = $this->journalEntryDetailRepository->create([
                        'journal_entry_id' => $journalEntry->id,
                        'account_id'       => $account->id,
                        'debit'            => $entry['debit'] ?? 0,
                        'credit'           => $entry['credit'] ?? 0,
                    ]);
                    $processedDetailIds[] = $newDetail->id;
                }
            }

            // Xóa các detail cũ không còn trong danh sách mới
            $detailsToDelete = $existingDetails->filter(function ($detail) use ($processedDetailIds) {
                return !in_array($detail->id, $processedDetailIds);
            });

            foreach ($detailsToDelete as $detail) {
                $this->journalEntryDetailRepository->delete($detail->id);
            }

            // Load lại journal entry với details mới
            return $this->journalEntryRepository->findById($journalEntry->id, ['*'], ['details.account']);
        });
    }

    /**
     * Xác nhận định khoản - KHÔNG CẦN THIẾT VÌ ĐÃ TẠO TRỰC TIẾP
     */
    public function confirmJournalByReference($referenceType, $referenceId)
    {
        // Không cần làm gì vì journal entries đã được tạo từ đầu
        return true;
    }

    /**
     * Xóa định khoản theo reference
     */
    public function deleteJournalByReference($referenceType, $referenceId)
    {
        return DB::transaction(function () use ($referenceType, $referenceId) {
            $journalEntries = $this->journalEntryRepository->findByCondition(
                [
                    ['reference_type', '=', $referenceType],
                    ['reference_id', '=', $referenceId]
                ],
                true
            );

            foreach ($journalEntries as $journalEntry) {
                // Xóa chi tiết định khoản
                $this->journalEntryDetailRepository->deleteByCondition([
                    ['journal_entry_id', '=', $journalEntry->id]
                ]);

                // Xóa định khoản
                $this->journalEntryRepository->delete($journalEntry->id);
            }

            return true;
        });
    }

    /**
     * Lấy định khoản theo reference
     */
    public function getJournalByReference($referenceType, $referenceId)
    {
        $journalEntries = $this->journalEntryRepository->findByCondition(
            [
                ['reference_type', '=', $referenceType],
                ['reference_id', '=', $referenceId]
            ],
            true,
            [], // joins
            ['id' => 'DESC'], // orderBy
            ['*'], // select
            ['details.account'] // relations
        );

        return $journalEntries->map(function ($journal) {
            return [
                'id' => $journal->id,
                'code' => $journal->code,
                'entry_date' => $journal->entry_date,
                'details' => $journal->details->map(function ($detail) {
                    return [
                        'account_code' => $detail->account?->account_code,
                        'account_name' => $detail->account?->name,
                        'debit' => $detail->debit,
                        'credit' => $detail->credit,
                    ];
                })
            ];
        });
    }

    /**
     * Tự động generate mã định khoản
     * Format: JE_001, JE_002, ...
     */
    private function generateJournalEntryCode()
    {
        $latest = $this->journalEntryRepository->findLastest();

        if (!$latest || !$latest->code) {
            return 'JE_001';
        }

        $latestCode = $latest->code;
        preg_match('/(\d+)/', $latestCode, $matches);

        $number = isset($matches[1]) ? (int)$matches[1] + 1 : 1;

        return 'JE_' . str_pad($number, 3, '0', STR_PAD_LEFT);
    }
}