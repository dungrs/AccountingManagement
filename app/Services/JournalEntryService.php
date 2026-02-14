<?php

namespace App\Services;

use App\Repositories\AccountingAccountRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use App\Repositories\Journal\JournalEntryRepository;
use App\Services\BaseService;
use App\Services\Interfaces\JournalEntryServiceInterface;
use Illuminate\Support\Facades\Auth;

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
     * Tạo định khoản cho phiếu nhập kho
     * Nợ 156 (Hàng hóa) / Có 331 (Phải trả NCC)
     */
    public function createPurchaseReceiptJournal($receipt)
    {
        // Tạo journal entry
        $journalEntry = $this->journalEntryRepository->create([
            'code'           => $this->generateJournalEntryCode(),
            'reference_type' => 'purchase_receipt',
            'reference_id'   => $receipt->id,
            'entry_date'     => $receipt->receipt_date ?? now(),
            'created_by'     => Auth::id(),
        ]);

        // Lấy tài khoản kế toán
        $account156 = $this->accountingAccountRepository->findByCondition(
            [['account_code', '=', '156']],
            false
        );
        
        $account331 = $this->accountingAccountRepository->findByCondition(
            [['account_code', '=', '331']],
            false
        );

        if (!$account156 || !$account331) {
            throw new \Exception('Tài khoản kế toán 156 hoặc 331 không tồn tại.');
        }

        // Nợ 156 - Hàng hóa
        $this->journalEntryDetailRepository->create([
            'journal_entry_id' => $journalEntry->id,
            'account_id'       => $account156->id,
            'debit'            => $receipt->grand_total,
            'credit'           => 0,
        ]);

        // Có 331 - Phải trả NCC
        $this->journalEntryDetailRepository->create([
            'journal_entry_id' => $journalEntry->id,
            'account_id'       => $account331->id,
            'debit'            => 0,
            'credit'           => $receipt->grand_total,
        ]);

        return $journalEntry;
    }

    /**
     * Tạo định khoản cho phiếu chi
     * Nợ 331 (Phải trả NCC) / Có 111/112 (Tiền mặt/Ngân hàng)
     */
    public function createPaymentVoucherJournal($paymentVoucher)
    {
        // Tạo journal entry
        $journalEntry = $this->journalEntryRepository->create([
            'code'           => $this->generateJournalEntryCode(),
            'reference_type' => 'payment_voucher',
            'reference_id'   => $paymentVoucher->id,
            'entry_date'     => $paymentVoucher->payment_date ?? now(),
            'created_by'     => Auth::id(),
        ]);

        // Lấy tài khoản kế toán
        $account331 = $this->accountingAccountRepository->findByCondition(
            [['account_code', '=', '331']],
            false
        );

        // Xác định tài khoản tiền (111: tiền mặt, 112: ngân hàng)
        $cashAccountCode = $paymentVoucher->payment_method === 'cash' ? '111' : '112';
        $cashAccount = $this->accountingAccountRepository->findByCondition(
            [['account_code', '=', $cashAccountCode]],
            false
        );

        if (!$account331 || !$cashAccount) {
            throw new \Exception("Tài khoản kế toán 331 hoặc {$cashAccountCode} không tồn tại.");
        }

        // Nợ 331 - Phải trả NCC
        $this->journalEntryDetailRepository->create([
            'journal_entry_id' => $journalEntry->id,
            'account_id'       => $account331->id,
            'debit'            => $paymentVoucher->amount,
            'credit'           => 0,
        ]);

        // Có 111/112 - Tiền mặt/Ngân hàng
        $this->journalEntryDetailRepository->create([
            'journal_entry_id' => $journalEntry->id,
            'account_id'       => $cashAccount->id,
            'debit'            => 0,
            'credit'           => $paymentVoucher->amount,
        ]);

        return $journalEntry;
    }

    /**
     * Xóa định khoản theo reference
     */
    public function deleteJournalByReference($referenceType, $referenceId)
    {
        $journalEntries = $this->journalEntryRepository->findByCondition(
            [
                ['reference_type', '=', $referenceType],
                ['reference_id', '=', $referenceId]
            ],
            true // get all
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
    }

    /**
     * Tự động generate mã định khoản
     * Format: JE_001, JE_002, ...
     */
    private function generateJournalEntryCode()
    {
        $latest = $this->journalEntryRepository->findLastest();

        if (!$latest) {
            return 'JE_001';
        }

        $latestCode = $latest->code;
        preg_match('/(\d+)/', $latestCode, $matches);

        $number = isset($matches[1]) ? (int)$matches[1] + 1 : 1;

        return 'JE_' . str_pad($number, 3, '0', STR_PAD_LEFT);
    }
}