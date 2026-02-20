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

    /**
     * Lấy dữ liệu sổ cái theo tài khoản
     */
    public function getGeneralLedger(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $accountId = $request->input('account_id');
        $accountCode = $request->input('account_code');

        // Lấy thông tin tài khoản
        $accountInfo = $this->getAccountInfo($accountId, $accountCode);

        // Lấy tất cả giao dịch liên quan đến tài khoản trong kỳ
        $transactions = $this->getAccountTransactions(
            $accountInfo['id'],
            $periodData['start_date'],
            $periodData['end_date']
        );

        // Tính số dư đầu kỳ
        $openingBalance = $this->calculateOpeningBalance(
            $accountInfo['id'],
            $accountInfo['normal_balance'],
            $periodData['previous_period_end']
        );

        // Format dữ liệu theo mẫu sổ cái
        $formattedData = $this->formatGeneralLedgerData(
            $transactions,
            $openingBalance,
            $accountInfo['normal_balance']
        );

        // Tính tổng phát sinh trong kỳ
        $summary = $this->calculateSummary($transactions);

        // Tính số dư cuối kỳ
        $closingBalance = $this->calculateClosingBalance(
            $openingBalance,
            $summary['total_debit'],
            $summary['total_credit'],
            $accountInfo['normal_balance']
        );

        return [
            'account' => $accountInfo,
            'year' => $periodData['year'],
            'month' => $periodData['month'],
            'opening_balance' => $openingBalance,
            'closing_balance' => $closingBalance,
            'data' => $formattedData,
            'summary' => $summary,
            'period' => $periodData['period']
        ];
    }

    /**
     * Lấy danh sách tài khoản
     */
    public function getAccounts(Request $request): array
    {
        // Sử dụng repository để lấy danh sách tài khoản
        $accounts = $this->accountingAccountRepository->getAccountsWithLanguages(1);
        
        return $accounts;
    }

    /**
     * Lấy thông tin tài khoản
     */
    protected function getAccountInfo($accountId, $accountCode): array
    {
        // Sử dụng repository để lấy thông tin tài khoản
        $account = $this->accountingAccountRepository->getAccountInfo($accountId, $accountCode);

        if (!$account) {
            throw new \Exception('Không tìm thấy tài khoản');
        }

        return $account;
    }

    /**
     * Lấy các giao dịch liên quan đến tài khoản
     */
    protected function getAccountTransactions(int $accountId, Carbon $startDate, Carbon $endDate): Collection
    {
        // Lấy từ journal_entry_details thông qua journal_entries
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

        // Lấy thông tin reference (phiếu thu/chi) và tài khoản đối ứng
        $transactions = $transactions->map(function ($item) use ($accountId) {
            $referenceInfo = $this->getReferenceInfo($item->reference_type, $item->reference_id);
            
            // Lấy tài khoản đối ứng cho dòng này
            $contraAccounts = $this->getContraAccounts($item->journal_entry_id, $accountId, $item->detail_id);

            // Xác định loại chứng từ dựa vào reference_type
            $voucherType = $this->determineVoucherType($item->reference_type);

            // Xác định ngày chứng từ (ưu tiên ngày từ chứng từ gốc, nếu không có thì lấy ngày journal)
            $entryDate = $referenceInfo['voucher_date'] ?? $item->journal_entry_date;

            // Lấy mô tả chi tiết
            $description = $this->formatDescription($item, $referenceInfo, $contraAccounts);

            return [
                'id' => $item->detail_id,
                'journal_entry_id' => $item->journal_entry_id,
                'journal_code' => $item->journal_code ?? 'CT' . str_pad($item->journal_entry_id, 5, '0', STR_PAD_LEFT),
                'entry_date' => $entryDate,
                'reference_type' => $item->reference_type,
                'reference_type_label' => $this->getReferenceTypeLabel($item->reference_type, $voucherType),
                'reference_code' => $referenceInfo['code'],
                'reference_note' => $referenceInfo['note'] ?? $item->journal_note,
                'account_code' => $item->account_code,
                'account_name' => $item->account_name ?? $item->account_code,
                'debit' => (float)($item->debit ?? 0),
                'credit' => (float)($item->credit ?? 0),
                'contra_accounts' => $contraAccounts,
                'description' => $description,
                'voucher_note' => $referenceInfo['note'] ?? '',
                'voucher_date' => $referenceInfo['voucher_date'] ?? null,
                'journal_note' => $item->journal_note ?? ''
            ];
        });

        return $transactions;
    }

    /**
     * Xác định loại chứng từ dựa vào reference_type
     */
    protected function determineVoucherType($referenceType): string
    {
        switch ($referenceType) {
            case 'payment_voucher':
                return 'PC'; // Phiếu chi
            case 'receipt_voucher':
                return 'PT'; // Phiếu thu
            case 'purchase_receipt':
                return 'PNK'; // Phiếu nhập kho
            case 'sales_receipt':
                return 'PXK'; // Phiếu xuất kho
            default:
                return 'CT'; // Chứng từ chung
        }
    }

    /**
     * Lấy tài khoản đối ứng cho một dòng journal entry detail
     */
    protected function getContraAccounts(int $journalEntryId, int $currentAccountId, int $currentDetailId): array
    {
        // Lấy tất cả các dòng khác trong cùng journal entry (trừ dòng hiện tại)
        $contraAccounts = DB::table('journal_entry_details as jed')
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
        foreach ($contraAccounts as $account) {
            $accountName = $account->account_name ?? $account->account_code;
            $result[] = [
                'code' => $account->account_code,
                'name' => $accountName,
                'display' => $account->account_code . ' - ' . $accountName,
                'amount' => (float)($account->debit > 0 ? $account->debit : $account->credit)
            ];
        }

        return $result;
    }

    /**
     * Lấy thông tin reference bao gồm code, note và voucher_date
     * Sử dụng các repository thay vì query DB trực tiếp
     */
    protected function getReferenceInfo($referenceType, $referenceId): array
    {
        $result = [
            'code' => null,
            'note' => null,
            'voucher_date' => null
        ];

        if (!$referenceType || !$referenceId) {
            return $result;
        }

        try {
            switch ($referenceType) {
                case 'receipt_voucher':
                    // Sử dụng phương thức getBasicInfo từ repository
                    $info = $this->receiptVoucherRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code' => $info['code'],
                            'note' => $info['note'],
                            'voucher_date' => $info['voucher_date']
                        ]);
                    }
                    break;

                case 'payment_voucher':
                    // Sử dụng phương thức getBasicInfo từ repository
                    $info = $this->paymentVoucherRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code' => $info['code'],
                            'note' => $info['note'],
                            'voucher_date' => $info['voucher_date']
                        ]);
                    }
                    break;

                case 'purchase_receipt':
                    // Sử dụng phương thức getBasicInfo từ repository
                    $info = $this->purchaseReceiptRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code' => $info['code'],
                            'note' => $info['note'],
                            'voucher_date' => $info['receipt_date']
                        ]);
                    }
                    break;

                case 'sales_receipt':
                    // Sử dụng phương thức getBasicInfo từ repository
                    $info = $this->salesReceiptRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code' => $info['code'],
                            'note' => $info['note'],
                            'voucher_date' => $info['receipt_date']
                        ]);
                    }
                    break;

                default:
                    $result['code'] = 'CT_' . $referenceId;
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Error getting reference info: ' . $e->getMessage());
            $result['code'] = $referenceType . '_' . $referenceId;
        }

        return $result;
    }

    /**
     * Lấy nhãn loại chứng từ
     */
    protected function getReferenceTypeLabel($referenceType, $voucherType = null): string
    {
        $labels = [
            'receipt_voucher' => 'PT',
            'payment_voucher' => 'PC',
            'sales_receipt' => 'PXK',
            'purchase_receipt' => 'PNK'
        ];

        if ($voucherType) {
            return $voucherType;
        }

        return $labels[$referenceType] ?? 'CT';
    }

    /**
     * Format mô tả giao dịch
     */
    protected function formatDescription($item, $referenceInfo = [], $contraAccounts = []): string
    {
        $parts = [];

        // Thêm ghi chú từ chứng từ gốc (ưu tiên cao nhất)
        if (!empty($referenceInfo['note'])) {
            $parts[] = trim($referenceInfo['note']);
        }
        // Nếu không có ghi chú từ chứng từ, lấy từ journal note
        elseif (!empty($item->journal_note)) {
            $parts[] = trim($item->journal_note);
        }

        // Thêm thông tin tài khoản đối ứng
        if (!empty($contraAccounts) && count($contraAccounts) > 0) {
            $contraDescriptions = [];
            foreach ($contraAccounts as $account) {
                $contraDescriptions[] = $account['code'];
            }
            if (!empty($contraDescriptions)) {
                $parts[] = 'TKƯ: ' . implode(', ', $contraDescriptions);
            }
        }

        // Nếu không có gì, tạo mô tả mặc định
        if (empty($parts)) {
            $parts[] = 'Phát sinh tài khoản ' . $item->account_code;
        }

        return implode(' - ', $parts);
    }

    /**
     * Tính số dư đầu kỳ
     */
    protected function calculateOpeningBalance(int $accountId, string $normalBalance, Carbon $endDate): float
    {
        // Tính tổng phát sinh Nợ và Có đến cuối kỳ trước
        $totals = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->where('jed.account_id', $accountId)
            ->where('je.entry_date', '<=', $endDate)
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_debit'),
                DB::raw('COALESCE(SUM(jed.credit), 0) as total_credit')
            )
            ->first();

        $totalDebit = (float)($totals->total_debit ?? 0);
        $totalCredit = (float)($totals->total_credit ?? 0);

        // Tính số dư theo normal_balance (debit hoặc credit)
        if ($normalBalance === 'debit') {
            return $totalDebit - $totalCredit;
        } else {
            return $totalCredit - $totalDebit;
        }
    }

    /**
     * Format dữ liệu sổ cái
     */
    protected function formatGeneralLedgerData(Collection $transactions, float $openingBalance, string $normalBalance): array
    {
        $runningBalance = $openingBalance;
        $result = [];

        // Thêm dòng số dư đầu kỳ
        $result[] = [
            'is_opening' => true,
            'entry_date' => null,
            'reference_code' => null,
            'reference_type_label' => null,
            'description' => 'Số dư đầu kỳ',
            'debit' => null,
            'credit' => null,
            'balance' => round($runningBalance, 2),
            'journal_code' => null,
            'contra_accounts' => [],
            'voucher_note' => '',
            'voucher_date' => null,
            'journal_note' => ''
        ];

        // Thêm các dòng giao dịch
        foreach ($transactions as $item) {
            // Tính số dư lũy kế
            if ($normalBalance === 'debit') {
                $runningBalance += ($item['debit'] - $item['credit']);
            } else {
                $runningBalance += ($item['credit'] - $item['debit']);
            }

            $result[] = [
                'is_opening' => false,
                'entry_date' => $item['entry_date'] ? Carbon::parse($item['entry_date'])->format('d/m/Y') : null,
                'reference_code' => $item['reference_code'],
                'reference_type_label' => $item['reference_type_label'],
                'description' => $item['description'],
                'debit' => $item['debit'] > 0 ? round($item['debit'], 2) : null,
                'credit' => $item['credit'] > 0 ? round($item['credit'], 2) : null,
                'balance' => round($runningBalance, 2),
                'journal_code' => $item['journal_code'],
                'contra_accounts' => $item['contra_accounts'] ?? [],
                'voucher_note' => $item['voucher_note'] ?? '',
                'voucher_date' => $item['voucher_date'] ? Carbon::parse($item['voucher_date'])->format('d/m/Y') : null,
                'journal_note' => $item['journal_note'] ?? ''
            ];
        }

        return $result;
    }

    /**
     * Tính tổng phát sinh
     */
    protected function calculateSummary(Collection $transactions): array
    {
        return [
            'total_debit' => round($transactions->sum('debit'), 2),
            'total_credit' => round($transactions->sum('credit'), 2),
            'transaction_count' => $transactions->count()
        ];
    }

    /**
     * Tính số dư cuối kỳ
     */
    protected function calculateClosingBalance(float $openingBalance, float $totalDebit, float $totalCredit, string $normalBalance): float
    {
        if ($normalBalance === 'debit') {
            return round($openingBalance + $totalDebit - $totalCredit, 2);
        } else {
            return round($openingBalance + $totalCredit - $totalDebit, 2);
        }
    }

    /**
     * Chuẩn bị dữ liệu kỳ báo cáo
     */
    protected function preparePeriodData(Request $request): array
    {
        $month = (int)($request->input('month') ?? now()->month);
        $year = (int)($request->input('year') ?? now()->year);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $endDate = $startDate->copy()->endOfMonth();
        $previousPeriodEnd = $startDate->copy()->subDay()->endOfDay();

        return [
            'month' => $month,
            'year' => $year,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'previous_period_end' => $previousPeriodEnd,
            'period' => [
                'month' => $month,
                'year' => $year,
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y')
            ]
        ];
    }
}