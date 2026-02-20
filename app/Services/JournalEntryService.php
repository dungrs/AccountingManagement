<?php

namespace App\Services;

use App\Repositories\AccountingAccountRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use App\Repositories\Journal\JournalEntryRepository;
use App\Services\BaseService;
use App\Services\Interfaces\JournalEntryServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

            // Kiểm tra dữ liệu đầu vào
            if (empty($journalEntries) || !isset($journalEntries['entries']) || empty($journalEntries['entries'])) {
                throw new \Exception('Không có dữ liệu định khoản.');
            }

            $entries = $journalEntries['entries'];
            $note = $journalEntries['note'] ?? 'Bút toán từ ' . $referenceType;

            // Kiểm tra cân bằng debit và credit
            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($entries as $entry) {
                // Kiểm tra dữ liệu entry
                if (!isset($entry['account_code']) && !isset($entry['account_id'])) {
                    throw new \Exception('Thiếu thông tin tài khoản trong định khoản.');
                }

                $totalDebit += (float)($entry['debit'] ?? 0);
                $totalCredit += (float)($entry['credit'] ?? 0);
            }

            // Kiểm tra cân bằng (cho phép sai số nhỏ do làm tròn)
            if (abs($totalDebit - $totalCredit) > 0.01) {
                throw new \Exception('Tổng debit và credit không cân bằng. Debit: ' . $totalDebit . ', Credit: ' . $totalCredit);
            }

            // Tạo journal entry
            $journalEntry = $this->journalEntryRepository->create([
                'code'           => $this->generateJournalEntryCode(),
                'reference_type' => $referenceType,
                'reference_id'   => $referenceId,
                'entry_date'     => $entryDate ?? now(),
                'note'           => $note,
                'created_by'     => Auth::id() ?? 1,
            ]);

            // Tạo chi tiết định khoản
            foreach ($entries as $entry) {
                $accountId = null;

                // Tìm account_id từ account_code hoặc account_id
                if (isset($entry['account_code'])) {
                    $account = $this->accountingAccountRepository->findByCondition(
                        [['account_code', '=', $entry['account_code']]],
                        false
                    );

                    if (!$account) {
                        throw new \Exception("Tài khoản {$entry['account_code']} không tồn tại.");
                    }
                    $accountId = $account->id;
                } elseif (isset($entry['account_id'])) {
                    $accountId = $entry['account_id'];
                }

                if (!$accountId) {
                    throw new \Exception('Không thể xác định tài khoản kế toán.');
                }

                $this->journalEntryDetailRepository->create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id'       => $accountId,
                    'debit'            => (float)($entry['debit'] ?? 0),
                    'credit'           => (float)($entry['credit'] ?? 0),
                ]);
            }

            // Load lại journal entry với details
            return $this->journalEntryRepository->findById($journalEntry->id, ['*'], ['details.account']);
        });
    }

    /**
     * Cập nhật định khoản theo reference
     */
    public function updateJournalByReference($referenceType, $referenceId, array $journalEntries, $entryDate = null)
    {
        return DB::transaction(function () use ($referenceType, $referenceId, $journalEntries, $entryDate) {

            // Kiểm tra dữ liệu đầu vào
            if (empty($journalEntries) || !isset($journalEntries['entries']) || empty($journalEntries['entries'])) {
                // Nếu không có dữ liệu, xóa tất cả định khoản
                $this->deleteJournalByReference($referenceType, $referenceId);
                return null;
            }

            $entries = $journalEntries['entries'];
            $note = $journalEntries['note'] ?? 'Bút toán từ ' . $referenceType;

            // Kiểm tra cân bằng debit và credit
            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($entries as $entry) {
                if (!isset($entry['account_code']) && !isset($entry['account_id'])) {
                    throw new \Exception('Thiếu thông tin tài khoản trong định khoản.');
                }

                $totalDebit += (float)($entry['debit'] ?? 0);
                $totalCredit += (float)($entry['credit'] ?? 0);
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
            $updateData = [
                'note' => $note,
            ];

            if ($entryDate) {
                $updateData['entry_date'] = $entryDate;
            }

            $this->journalEntryRepository->update($journalEntry->id, $updateData);

            // Lấy danh sách detail hiện tại
            $existingDetails = $this->journalEntryDetailRepository->findByCondition(
                [['journal_entry_id', '=', $journalEntry->id]],
                true
            );

            // Xóa tất cả details cũ
            foreach ($existingDetails as $detail) {
                $this->journalEntryDetailRepository->delete($detail->id);
            }

            // Tạo details mới
            foreach ($entries as $entry) {
                $accountId = null;

                if (isset($entry['account_code'])) {
                    $account = $this->accountingAccountRepository->findByCondition(
                        [['account_code', '=', $entry['account_code']]],
                        false
                    );

                    if (!$account) {
                        throw new \Exception("Tài khoản {$entry['account_code']} không tồn tại.");
                    }
                    $accountId = $account->id;
                } elseif (isset($entry['account_id'])) {
                    $accountId = $entry['account_id'];
                }

                if (!$accountId) {
                    throw new \Exception('Không thể xác định tài khoản kế toán.');
                }

                $this->journalEntryDetailRepository->create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id'       => $accountId,
                    'debit'            => (float)($entry['debit'] ?? 0),
                    'credit'           => (float)($entry['credit'] ?? 0),
                ]);
            }

            // Load lại journal entry với details mới
            return $this->journalEntryRepository->findById($journalEntry->id, ['*'], ['details.account']);
        });
    }

    /**
     * Xác nhận định khoản
     */
    public function confirmJournalByReference($referenceType, $referenceId)
    {
        // Có thể thêm logic xác nhận nếu cần
        // Ví dụ: cập nhật trạng thái, ghi log, v.v.

        $journalEntry = $this->journalEntryRepository->findByCondition(
            [
                ['reference_type', '=', $referenceType],
                ['reference_id', '=', $referenceId]
            ],
            false
        );

        if ($journalEntry) {
            // Có thể update trạng thái confirmed nếu có trường status
            // $this->journalEntryRepository->update($journalEntry->id, ['status' => 'confirmed']);

            Log::info('Journal entry confirmed', [
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'journal_id' => $journalEntry->id
            ]);
        }

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
                'note' => $journal->note,
                'details' => $journal->details->map(function ($detail) {
                    return [
                        'account_code' => $detail->account?->account_code,
                        'account_name' => $detail->account?->name,
                        'debit' => (float)$detail->debit,
                        'credit' => (float)$detail->credit,
                    ];
                })->values()->toArray()
            ];
        })->values()->toArray();
    }

    /**
     * Kiểm tra tính cân bằng của định khoản
     */
    public function validateJournalBalance(array $entries): bool
    {
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($entries as $entry) {
            $totalDebit += (float)($entry['debit'] ?? 0);
            $totalCredit += (float)($entry['credit'] ?? 0);
        }

        return abs($totalDebit - $totalCredit) <= 0.01;
    }

    /**
     * Tự động generate mã định khoản
     * Format: JE_YYYYMMDD_001, JE_YYYYMMDD_002, ...
     */
    private function generateJournalEntryCode()
    {
        $date = now()->format('Ymd');

        // Tìm mã lớn nhất trong ngày
        $latest = $this->journalEntryRepository->findByCondition(
            [['code', 'LIKE', 'JE_' . $date . '_%']],
            true,
            [],
            ['id' => 'DESC'],
            ['code'],
            [],
            1
        )->first();

        if (!$latest) {
            return 'JE_' . $date . '_001';
        }

        $latestCode = $latest->code;
        $parts = explode('_', $latestCode);
        $lastNumber = isset($parts[2]) ? (int)$parts[2] : 0;
        $newNumber = $lastNumber + 1;

        return 'JE_' . $date . '_' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
}