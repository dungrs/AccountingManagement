<?php

namespace App\Services\Book;

use App\Services\Interfaces\Book\GeneralLedgerServiceInterface;
use App\Services\BaseService;
use App\Repositories\Voucher\PaymentVoucherRepository;
use App\Repositories\Voucher\ReceiptVoucherRepository;
use App\Repositories\Receipt\PurchaseReceiptRepository;
use App\Repositories\Receipt\SalesReceiptRepository;
use App\Repositories\AccountingAccountRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GeneralLedgerService extends BaseService implements GeneralLedgerServiceInterface
{
    protected $paymentVoucherRepository;
    protected $receiptVoucherRepository;
    protected $purchaseReceiptRepository;
    protected $salesReceiptRepository;
    protected $accountingAccountRepository;

    public function __construct(
        PaymentVoucherRepository $paymentVoucherRepository,
        ReceiptVoucherRepository $receiptVoucherRepository,
        PurchaseReceiptRepository $purchaseReceiptRepository,
        SalesReceiptRepository $salesReceiptRepository,
        AccountingAccountRepository $accountingAccountRepository
    ) {
        $this->paymentVoucherRepository = $paymentVoucherRepository;
        $this->receiptVoucherRepository = $receiptVoucherRepository;
        $this->purchaseReceiptRepository = $purchaseReceiptRepository;
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->accountingAccountRepository = $accountingAccountRepository;
    }

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

    public function getGeneralLedger(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $accountId  = $request->input('account_id');
        $accountCode = $request->input('account_code');

        $accountInfo = $this->getAccountInfo($accountId, $accountCode);

        $transactions = $this->getAccountTransactions(
            $accountInfo['id'],
            $periodData['start_date'],
            $periodData['end_date']
        );

        $openingBalance = $this->calculateOpeningBalance(
            $accountInfo['id'],
            $accountInfo['normal_balance'],
            $periodData['previous_period_end']
        );

        $formattedData = $this->formatGeneralLedgerData(
            $transactions,
            $openingBalance,
            $accountInfo['normal_balance']
        );

        $summary = $this->calculateSummary($transactions);

        $closingBalance = $this->calculateClosingBalance(
            $openingBalance,
            $summary['total_debit'],
            $summary['total_credit'],
            $accountInfo['normal_balance']
        );

        return [
            'account'         => $accountInfo,
            'opening_balance' => $openingBalance,
            'closing_balance' => $closingBalance,
            'data'            => $formattedData,
            'summary'         => $summary,
            'period'          => $periodData['period'],
        ];
    }

    public function getAccounts(Request $request): array
    {
        return $this->accountingAccountRepository->getAccountsWithLanguages(1);
    }

    // =========================================================================
    // ACCOUNT INFO
    // =========================================================================

    protected function getAccountInfo($accountId, $accountCode): array
    {
        $account = $this->accountingAccountRepository->getAccountInfo($accountId, $accountCode);

        if (!$account) {
            throw new \Exception('Không tìm thấy tài khoản');
        }

        return $account;
    }

    // =========================================================================
    // TRANSACTIONS
    // =========================================================================

    protected function getAccountTransactions(int $accountId, Carbon $startDate, Carbon $endDate): Collection
    {
        $transactions = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->leftJoin('accounting_account_languages as aal', function ($join) {
                $join->on('aa.id', '=', 'aal.accounting_account_id')
                    ->where('aal.language_id', '=', 1);
            })
            ->where('jed.account_id', $accountId)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                'je.id as journal_entry_id',
                'je.code as journal_code',
                'je.entry_date as journal_entry_date',
                'je.reference_type',
                'je.reference_id',
                'je.note as journal_note',
                'je.created_by',
                'jed.id as detail_id',
                'jed.debit',
                'jed.credit',
                'aa.account_code',
                'aal.name as account_name'
            )
            ->orderBy('je.entry_date', 'ASC')
            ->orderBy('je.id', 'ASC')
            ->orderBy('jed.id', 'ASC')
            ->get();

        $result = collect();

        foreach ($transactions as $item) {
            $referenceInfo  = $this->getReferenceInfo($item->reference_type, $item->reference_id);
            $contraAccounts = $this->getContraAccounts($item->journal_entry_id, $accountId, $item->detail_id);
            $voucherType    = $this->determineVoucherType($item->reference_type);
            $entryDate      = $item->journal_entry_date;
            $referenceTypeLabel = $this->getReferenceTypeLabel($item->reference_type, $voucherType);
            $voucherDate    = $referenceInfo['voucher_date'] ?? $item->journal_entry_date;
            $description    = $this->formatDescription($item, $referenceInfo, $contraAccounts);

            // Nếu không có contra accounts, tạo 1 dòng bình thường
            if (empty($contraAccounts)) {
                $result->push([
                    'id'                   => $item->detail_id,
                    'journal_entry_id'     => $item->journal_entry_id,
                    'journal_code'         => $item->journal_code ?? ('CT' . str_pad($item->journal_entry_id, 5, '0', STR_PAD_LEFT)),
                    'entry_date'           => $entryDate,
                    'reference_type_label' => $referenceTypeLabel,
                    'reference_code'       => $referenceInfo['code'],
                    'voucher_date'         => $voucherDate,
                    'description'          => $description,
                    'reference_note'       => $referenceInfo['note'] ?? $item->journal_note,
                    'account_code'         => $item->account_code,
                    'account_name'         => $item->account_name ?? $item->account_code,
                    'debit'                => (float)($item->debit ?? 0),
                    'credit'               => (float)($item->credit ?? 0),
                    'contra_account_code'  => null,
                    'contra_account_name'  => null,
                    'journal_note'         => $item->journal_note ?? '',
                    'reference_type'       => $item->reference_type,
                    'reference_id'         => $item->reference_id,
                ]);
            } else {
                // Tạo 1 dòng riêng cho mỗi tài khoản đối ứng
                foreach ($contraAccounts as $contra) {
                    $result->push([
                        'id'                   => $item->detail_id,
                        'journal_entry_id'     => $item->journal_entry_id,
                        'journal_code'         => $item->journal_code ?? ('CT' . str_pad($item->journal_entry_id, 5, '0', STR_PAD_LEFT)),
                        'entry_date'           => $entryDate,
                        'reference_type_label' => $referenceTypeLabel,
                        'reference_code'       => $referenceInfo['code'],
                        'voucher_date'         => $voucherDate,
                        'description'          => $description,
                        'reference_note'       => $referenceInfo['note'] ?? $item->journal_note,
                        'account_code'         => $item->account_code,
                        'account_name'         => $item->account_name ?? $item->account_code,
                        // Phân bổ debit/credit theo amount của contra account
                        'debit'                => $item->debit > 0 ? (float)$contra['amount'] : 0,
                        'credit'               => $item->credit > 0 ? (float)$contra['amount'] : 0,
                        'contra_account_code'  => $contra['code'],
                        'contra_account_name'  => $contra['name'],
                        'journal_note'         => $item->journal_note ?? '',
                        'reference_type'       => $item->reference_type,
                        'reference_id'         => $item->reference_id,
                    ]);
                }
            }
        }

        return $result;
    }

    protected function determineVoucherType($referenceType): string
    {
        $map = [
            'payment_voucher'  => 'PC',   // Phiếu chi
            'receipt_voucher'  => 'PT',   // Phiếu thu
            'purchase_receipt' => 'PNK',  // Phiếu nhập kho
            'sales_receipt'    => 'HD',   // Hóa đơn bán hàng
        ];

        return $map[$referenceType] ?? 'CT';
    }

    protected function getContraAccounts(int $journalEntryId, int $currentAccountId, int $currentDetailId): array
    {
        $rows = DB::table('journal_entry_details as jed')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->leftJoin('accounting_account_languages as aal', function ($join) {
                $join->on('aa.id', '=', 'aal.accounting_account_id')
                    ->where('aal.language_id', '=', 1);
            })
            ->where('jed.journal_entry_id', $journalEntryId)
            ->where('jed.account_id', '!=', $currentAccountId)
            ->where('jed.id', '!=', $currentDetailId)
            ->select(
                'aa.account_code',
                'aal.name as account_name',
                'jed.debit',
                'jed.credit'
            )
            ->distinct()
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[] = [
                'code'    => $row->account_code,
                'name'    => $row->account_name ?? $row->account_code,
                'display' => $row->account_code . ' - ' . ($row->account_name ?? $row->account_code),
                'amount'  => (float)($row->debit > 0 ? $row->debit : $row->credit),
            ];
        }

        return $result;
    }

    protected function getReferenceInfo($referenceType, $referenceId): array
    {
        $result = ['code' => null, 'note' => null, 'voucher_date' => null];

        if (!$referenceType || !$referenceId) {
            return $result;
        }

        try {
            switch ($referenceType) {
                case 'receipt_voucher':
                    $info = $this->receiptVoucherRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['voucher_date'],
                        ]);
                    }
                    break;

                case 'payment_voucher':
                    $info = $this->paymentVoucherRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['voucher_date'],
                        ]);
                    }
                    break;

                case 'purchase_receipt':
                    $info = $this->purchaseReceiptRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['receipt_date'],
                        ]);
                    }
                    break;

                case 'sales_receipt':
                    $info = $this->salesReceiptRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['receipt_date'],
                        ]);
                    }
                    break;

                default:
                    $result['code'] = 'CT_' . $referenceId;
                    break;
            }
        } catch (\Exception $e) {
            Log::error('GeneralLedgerService::getReferenceInfo - ' . $e->getMessage());
            $result['code'] = $referenceType . '_' . $referenceId;
        }

        return $result;
    }

    protected function getReferenceTypeLabel($referenceType, $voucherType = null): string
    {
        $labels = [
            'receipt_voucher'  => 'BC',   // Biên lai / Phiếu thu → BC
            'payment_voucher'  => 'PC',
            'sales_receipt'    => 'HD',   // Hóa đơn
            'purchase_receipt' => 'PNK',
        ];

        return $voucherType ?? ($labels[$referenceType] ?? 'CT');
    }

    /**
     * Cột D – Diễn giải: ưu tiên ghi chú chứng từ gốc, fallback journal note
     */
    protected function formatDescription($item, $referenceInfo = [], $contraAccounts = []): string
    {
        // Ưu tiên note từ chứng từ gốc
        if (!empty($referenceInfo['note'])) {
            return trim($referenceInfo['note']);
        }

        // Fallback: journal note
        if (!empty($item->journal_note)) {
            return trim($item->journal_note);
        }

        // Fallback cuối: mô tả mặc định
        return 'Phát sinh tài khoản ' . $item->account_code;
    }

    // =========================================================================
    // BALANCE CALCULATIONS
    // =========================================================================

    protected function calculateOpeningBalance(int $accountId, string $normalBalance, Carbon $endDate): float
    {
        $totals = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->where('jed.account_id', $accountId)
            ->where('je.entry_date', '<=', $endDate)
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_debit'),
                DB::raw('COALESCE(SUM(jed.credit), 0) as total_credit')
            )
            ->first();

        $totalDebit  = (float)($totals->total_debit ?? 0);
        $totalCredit = (float)($totals->total_credit ?? 0);

        return $normalBalance === 'debit'
            ? $totalDebit - $totalCredit
            : $totalCredit - $totalDebit;
    }

    protected function calculateSummary(Collection $transactions): array
    {
        return [
            'total_debit'       => round($transactions->sum('debit'), 2),
            'total_credit'      => round($transactions->sum('credit'), 2),
            'transaction_count' => $transactions->count(),
        ];
    }

    protected function calculateClosingBalance(float $openingBalance, float $totalDebit, float $totalCredit, string $normalBalance): float
    {
        return $normalBalance === 'debit'
            ? round($openingBalance + $totalDebit - $totalCredit, 2)
            : round($openingBalance + $totalCredit - $totalDebit, 2);
    }

    // =========================================================================
    // FORMAT DATA
    // =========================================================================

    protected function formatGeneralLedgerData(Collection $transactions, float $openingBalance, string $normalBalance): array
    {
        $result = [];

        $result[] = [
            'is_opening'           => true,
            'entry_date'           => null,
            'voucher_date'         => null,
            'reference_type_label' => null,
            'reference_code'       => null,
            'description'          => 'Số dư đầu kỳ',
            'debit'                => null,
            'credit'               => null,
            'balance'              => round($openingBalance, 2),
            'contra_account_code'  => null,
            'contra_account_name'  => null,
        ];

        foreach ($transactions as $item) {
            $result[] = [
                'is_opening'           => false,
                'entry_date'           => $item['entry_date']
                    ? Carbon::parse($item['entry_date'])->format('d/m/Y')
                    : null,
                'voucher_date'         => $item['voucher_date']
                    ? Carbon::parse($item['voucher_date'])->format('d/m/Y')
                    : null,
                'reference_type_label' => $item['reference_type_label'],
                'reference_code'       => $item['reference_code'],
                'description'          => $item['description'],
                'debit'                => $item['debit'] > 0  ? round($item['debit'], 2)  : null,
                'credit'               => $item['credit'] > 0 ? round($item['credit'], 2) : null,
                // Thay contra_accounts array bằng 1 tài khoản duy nhất
                'contra_account_code'  => $item['contra_account_code'],
                'contra_account_name'  => $item['contra_account_name'],
            ];
        }

        return $result;
    }

    // =========================================================================
    // PERIOD HELPERS
    // =========================================================================

    protected function preparePeriodData(Request $request): array
    {
        $startDateStr = $request->input('start_date');
        $endDateStr   = $request->input('end_date');

        if (!$startDateStr || !$endDateStr) {
            $startDate = Carbon::now()->startOfMonth()->startOfDay();
            $endDate   = Carbon::now()->endOfMonth()->endOfDay();
        } else {
            $startDate = Carbon::createFromFormat('Y-m-d', $startDateStr)->startOfDay();
            $endDate   = Carbon::createFromFormat('Y-m-d', $endDateStr)->endOfDay();
        }

        $previousPeriodEnd = $startDate->copy()->subDay()->endOfDay();

        return [
            'start_date'         => $startDate,
            'end_date'           => $endDate,
            'previous_period_end' => $previousPeriodEnd,
            'period'             => [
                'start_date'     => $startDate->format('d/m/Y'),
                'end_date'       => $endDate->format('d/m/Y'),
                'start_date_raw' => $startDate->format('Y-m-d'),
                'end_date_raw'   => $endDate->format('Y-m-d'),
            ],
        ];
    }
}
