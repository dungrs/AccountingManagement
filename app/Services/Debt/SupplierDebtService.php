<?php

namespace App\Services\Debt;

use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Repositories\Debt\SupplierDebtRepository;
use App\Repositories\SupplierRepository;
use App\Services\BaseService;
use App\Services\Interfaces\Debt\SupplierDebtServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\PurchaseReceipt;
use App\Models\PaymentVoucher;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SupplierDebtService extends BaseService implements SupplierDebtServiceInterface
{
    protected const ACCOUNT_PAYABLE = '331';
    protected const REF_TYPE_PURCHASE = 'purchase_receipt';
    protected const REF_TYPE_PAYMENT = 'payment_voucher';
    protected const TAX_ACCOUNT = '1331'; 

    protected SupplierDebtRepository $supplierDebtRepository;
    protected SupplierRepository $supplierRepository;

    public function __construct(
        SupplierDebtRepository $supplierDebtRepository,
        SupplierRepository $supplierRepository
    ) {
        $this->supplierDebtRepository = $supplierDebtRepository;
        $this->supplierRepository = $supplierRepository;
    }

    /**
     * Paginate danh sách tổng hợp công nợ theo từng nhà cung cấp
     */
    public function paginate(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $perpage = (int)($request->input('perpage') ?? 20);

        $supplierIds = $this->getSupplierIdsWithTransactions(
            $periodData['start_date'],
            $periodData['end_date'],
            $request
        );

        if (empty($supplierIds)) {
            return $this->emptyResponse($periodData, $perpage);
        }

        $suppliers = $this->getSuppliersWithPagination($supplierIds, $request, $perpage);
        $formattedData = $this->formatSupplierDebtData(
            $suppliers,
            $periodData['previous_period_end'],
            $periodData['start_date'],
            $periodData['end_date']
        );

        return [
            'data' => $formattedData['data'],
            'summary' => $formattedData['summary'],
            'period' => $periodData['period'],
            'pagination' => $this->formatPagination($suppliers)
        ];
    }

    /**
     * Lấy chi tiết công nợ của nhà cung cấp - Sổ chi tiết 331
     */
    public function getSupplierDebtDetails(int $supplierId, Request $request): array
    {
        $periodData = $this->preparePeriodData($request);

        $supplier = $this->supplierRepository->findById($supplierId);
        if (!$supplier) {
            throw new \Exception("Không tìm thấy nhà cung cấp với ID: {$supplierId}");
        }

        $openingBalance = $this->calculateSupplierBalance(
            $supplierId,
            $periodData['previous_period_end']
        );

        $referenceIds = $this->getReferenceIdsBySupplier(
            $supplierId,
            $periodData['start_date'],
            $periodData['end_date']
        );

        $transactions = $this->getDetailedJournalEntryDetails(
            $referenceIds,
            $periodData['start_date'],
            $periodData['end_date']
        );

        $summary = $this->calculateSummary($transactions);
        $transactions = $this->updateRunningBalance($transactions, $openingBalance);

        return [
            'supplier' => $this->formatSupplierInfo($supplier),
            'period' => $periodData['period'],
            'opening_balance' => $openingBalance,
            'transactions' => $transactions,
            'summary' => $summary
        ];
    }

    /**
     * Lấy danh sách tài khoản kế toán theo nhà cung cấp
     */
    public function getSupplierAccounts(
        int $supplierId,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): Collection {
        $query = JournalEntryDetail::with(['account.languages' => function ($q) {
            $q->where('language_id', session('currentLanguage', 1));
        }])
            ->whereHas('journalEntry', function ($q) use ($supplierId, $startDate, $endDate) {
                $this->applyJournalEntryFilters($q, $supplierId, $startDate, $endDate);
            })
            ->select(
                'account_id',
                DB::raw('SUM(debit) as total_debit'),
                DB::raw('SUM(credit) as total_credit')
            )
            ->groupBy('account_id');

        return $query->get()->map(fn($item) => $this->formatAccountData($item));
    }

    /**
     * Tạo công nợ khi nhập hàng (tăng nợ - ghi Có)
     */
    public function createDebtForPurchaseReceipt($receipt)
    {
        return DB::transaction(
            fn() =>
            $this->supplierDebtRepository->create([
                'supplier_id' => $receipt->supplier_id,
                'reference_type' => self::REF_TYPE_PURCHASE,
                'reference_id' => $receipt->id,
                'debit' => 0,
                'credit' => $receipt->grand_total,
                'transaction_date' => $receipt->receipt_date ?? now(),
            ])
        );
    }

    /**
     * Tạo công nợ khi thanh toán (giảm nợ - ghi Nợ)
     */
    public function createDebtForPaymentVoucher($paymentVoucher)
    {
        return DB::transaction(
            fn() =>
            $this->supplierDebtRepository->create([
                'supplier_id' => $paymentVoucher->supplier_id,
                'reference_type' => self::REF_TYPE_PAYMENT,
                'reference_id' => $paymentVoucher->id,
                'debit' => $paymentVoucher->amount,
                'credit' => 0,
                'transaction_date' => $paymentVoucher->voucher_date ?? now(),
            ])
        );
    }

    /**
     * Xóa công nợ theo reference
     */
    public function deleteDebtByReference(string $referenceType, int $referenceId): bool
    {
        return (bool)$this->supplierDebtRepository->deleteByCondition([
            ['reference_type', '=', $referenceType],
            ['reference_id', '=', $referenceId]
        ]);
    }

    /**
     * Lấy tổng công nợ hiện tại của nhà cung cấp
     */
    public function getSupplierDebtBalance(int $supplierId, ?Carbon $endDate = null): float
    {
        $debts = $this->getSupplierDebts($supplierId, $endDate);
        return $debts->sum('credit') - $debts->sum('debit');
    }

    /**
     * Lấy tổng công nợ theo nhiều nhà cung cấp
     */
    public function getMultipleSupplierDebtBalance(array $supplierIds, ?Carbon $endDate = null): array
    {
        $result = [];
        foreach ($supplierIds as $supplierId) {
            $result[$supplierId] = $this->getSupplierDebtBalance($supplierId, $endDate);
        }
        return $result;
    }

    /**
     * Lấy lịch sử công nợ của nhà cung cấp
     */
    public function getSupplierDebtHistory(
        int $supplierId,
        int $limit = 50,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): Collection {
        $condition = $this->buildDebtHistoryCondition($supplierId, $startDate, $endDate);

        return $this->supplierDebtRepository->findByCondition(
            $condition,
            true,
            [],
            ['transaction_date' => 'DESC', 'id' => 'DESC'],
            ['*'],
            [],
            null,
            [],
            $limit
        );
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

    /**
     * Lấy danh sách ID nhà cung cấp có phát sinh trong kỳ
     */
    protected function getSupplierIdsWithTransactions(
        Carbon $startDate,
        Carbon $endDate,
        Request $request
    ): array {
        $condition = [
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate]
        ];

        if ($request->has('supplier_id') && $request->supplier_id) {
            $condition[] = ['supplier_id', '=', $request->supplier_id];
        }

        if ($request->has('reference_type') && $request->reference_type !== 'all') {
            $condition[] = ['reference_type', '=', $request->reference_type];
        }

        $debts = $this->supplierDebtRepository->findByCondition(
            $condition,
            true,
            [],
            [],
            ['supplier_id'],
            [],
            null,
            ['supplier_id']
        );

        return $debts->pluck('supplier_id')->unique()->toArray();
    }

    /**
     * Lấy danh sách nhà cung cấp có phân trang
     */
    protected function getSuppliersWithPagination(
        array $supplierIds,
        Request $request,
        int $perpage
    ): LengthAwarePaginator {
        $condition = [
            'whereIn' => [['id', $supplierIds]]
        ];

        if ($keyword = $request->input('keyword')) {
            $condition['keyword'] = $keyword;
        }

        return $this->supplierRepository->paginate(
            ['*'],
            $condition,
            $perpage,
            (int)$request->input('page', 1),
            ['path' => $request->fullUrl()],
            ['supplier_code', 'ASC']
        );
    }

    /**
     * Format dữ liệu công nợ nhà cung cấp
     */
    protected function formatSupplierDebtData(
        LengthAwarePaginator $suppliers,
        Carbon $previousPeriodEnd,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $formattedData = collect();
        $summary = [
            'opening_balance' => 0,
            'total_debit' => 0,
            'total_credit' => 0,
            'closing_balance' => 0
        ];

        foreach ($suppliers as $supplier) {
            $openingBalance = $this->calculateSupplierBalance($supplier->id, $previousPeriodEnd);
            $periodTransactions = $this->calculateSupplierPeriodTransactions(
                $supplier->id,
                $startDate,
                $endDate
            );

            $closingBalance = $openingBalance + $periodTransactions['total_credit'] - $periodTransactions['total_debit'];

            // Cập nhật summary
            $summary['opening_balance'] += $openingBalance;
            $summary['total_debit'] += $periodTransactions['total_debit'];
            $summary['total_credit'] += $periodTransactions['total_credit'];

            $formattedData->push([
                'id' => $supplier->id,
                'supplier_code' => $supplier->supplier_code,
                'supplier_name' => $supplier->name,
                'tax_code' => $supplier->tax_code ?? '',
                'phone' => $supplier->phone ?? '',
                'email' => $supplier->email ?? '',
                'address' => $supplier->address ?? '',
                'opening_balance' => $openingBalance,
                'total_debit' => $periodTransactions['total_debit'],
                'total_credit' => $periodTransactions['total_credit'],
                'closing_balance' => $closingBalance,
                'transaction_count' => $periodTransactions['count']
            ]);
        }

        $summary['closing_balance'] = $summary['opening_balance'] + $summary['total_credit'] - $summary['total_debit'];

        return [
            'data' => $formattedData,
            'summary' => $summary
        ];
    }

    /**
     * Tính số dư của nhà cung cấp tại một thời điểm
     */
    protected function calculateSupplierBalance(int $supplierId, Carbon $endDate): float
    {
        $debts = $this->getSupplierDebts($supplierId, $endDate);
        return $debts->sum('credit') - $debts->sum('debit');
    }

    /**
     * Lấy danh sách công nợ của nhà cung cấp
     */
    protected function getSupplierDebts(int $supplierId, ?Carbon $endDate = null): Collection
    {
        $condition = [['supplier_id', '=', $supplierId]];

        if ($endDate) {
            $condition[] = ['transaction_date', '<=', $endDate];
        }

        return $this->supplierDebtRepository->findByCondition(
            $condition,
            true,
            [],
            [],
            ['debit', 'credit'],
            [],
            null,
            []
        );
    }

    /**
     * Tính phát sinh trong kỳ của nhà cung cấp
     */
    protected function calculateSupplierPeriodTransactions(
        int $supplierId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $condition = [
            ['supplier_id', '=', $supplierId],
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate]
        ];

        $debts = $this->supplierDebtRepository->findByCondition(
            $condition,
            true,
            [],
            [],
            ['debit', 'credit'],
            [],
            null,
            []
        );

        return [
            'total_debit' => $debts->sum('debit'),
            'total_credit' => $debts->sum('credit'),
            'count' => $debts->count()
        ];
    }

    /**
     * Lấy danh sách ID chứng từ theo nhà cung cấp
     */
    protected function getReferenceIdsBySupplier(
        int $supplierId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $debts = $this->supplierDebtRepository->findByCondition(
            [
                ['supplier_id', '=', $supplierId],
                ['transaction_date', '>=', $startDate],
                ['transaction_date', '<=', $endDate]
            ],
            true,
            [],
            [],
            ['reference_type', 'reference_id'],
            [],
            null,
            []
        );

        return $debts->map(fn($debt) => [
            'reference_type' => $debt->reference_type,
            'reference_id' => $debt->reference_id
        ])->toArray();
    }

    protected function getDetailedJournalEntryDetails(
        array $referenceIds,
        Carbon $startDate,
        Carbon $endDate
    ): Collection {
        if (empty($referenceIds)) {
            return collect();
        }

        $transactions = collect();

        foreach ($referenceIds as $ref) {
            // Tìm journal entry theo reference
            $journalEntry = $this->findJournalEntry($ref, $startDate, $endDate);
            if (!$journalEntry) {
                continue;
            }

            // Lấy TẤT CẢ chi tiết của journal entry, không lọc bỏ bất kỳ dòng nào
            $details = $this->getJournalEntryDetails($journalEntry->id);

            if ($details->isEmpty()) {
                continue;
            }

            // Lấy thông tin chung
            $referenceInfo = $this->getReferenceDetails($ref['reference_type'], $ref['reference_id']);
            $formattedDate = Carbon::parse($journalEntry->entry_date)->format('d/m/Y');
            $referenceTypeLabel = $ref['reference_type'] === self::REF_TYPE_PURCHASE ? 'PN' : 'PC';

            // Với MỖI dòng chi tiết, tạo một dòng riêng trong báo cáo
            foreach ($details as $detail) {
                // Bỏ qua nếu không có thông tin tài khoản
                if (!$detail->account) {
                    continue;
                }

                // Lấy thông tin account
                $account = $detail->account;
                $accountName = $account->languages->first()->pivot->name ?? $account->account_code;

                $transactions->push([
                    'journal_entry_id' => $journalEntry->id,
                    'journal_entry_detail_id' => $detail->id,
                    'formatted_date' => $formattedDate,
                    'reference_code' => $referenceInfo['code'],
                    'reference_type_label' => $referenceTypeLabel,
                    'reference_note' => $referenceInfo['note'] ?? $journalEntry->note,

                    // Thông tin chi tiết từng dòng
                    'account_id' => $account->id,
                    'account_code' => $account->account_code,
                    'account_name' => $accountName,

                    // Số tiền của từng dòng (chính xác từ bảng journal_entry_details)
                    'debit' => (float)$detail->debit,
                    'credit' => (float)$detail->credit,

                    // Phân loại dòng
                    'is_payable_account' => strpos($account->account_code, self::ACCOUNT_PAYABLE) === 0,
                    'is_tax_account' => strpos($account->account_code, self::TAX_ACCOUNT) === 0,

                    // Running balance sẽ cập nhật sau
                    'running_balance' => 0,

                    // Key để sort (đảm bảo thứ tự đúng)
                    'sort_key' => $journalEntry->entry_date . '_' . $journalEntry->id . '_' . $detail->id
                ]);
            }
        }

        // Sắp xếp theo ngày và ID để giữ đúng thứ tự định khoản
        $sortedTransactions = $transactions->sortBy('sort_key')->values();

        return $sortedTransactions;
    }

    /**
     * Cập nhật running balance cho transactions (TÍNH ĐÚNG THEO DÒNG 331)
     */
    protected function updateRunningBalance(Collection $transactions, float $openingBalance): Collection
    {
        $runningBalance = $openingBalance;

        // Chỉ tính running balance khi gặp dòng tài khoản 331
        // Vì công nợ chỉ thay đổi khi có phát sinh trên TK 331

        return $transactions->map(function ($item) use (&$runningBalance) {
            // Chỉ cập nhật running balance cho dòng là tài khoản 331
            if ($item['is_payable_account']) {
                // Với TK 331:
                // - Nợ: giảm công nợ (trả tiền)
                // - Có: tăng công nợ (mua hàng)
                $runningBalance += ($item['credit'] - $item['debit']);
            }

            // Gán running balance (có thể là giá trị mới nhất từ TK 331 trước đó)
            $item['running_balance'] = $runningBalance;

            return $item;
        });
    }

    /**
     * Tính tổng phát sinh cho summary (TÍNH ĐÚNG TỔNG CÔNG NỢ)
     */
    protected function calculateSummary(Collection $transactions): array
    {
        // Lọc chỉ lấy dòng tài khoản 331 để tính tổng công nợ
        $payableTransactions = $transactions->filter(function ($item) {
            return $item['is_payable_account'];
        });

        // Tổng phát sinh Nợ TK 331 (giảm nợ)
        $totalDebit = $payableTransactions->sum('debit');

        // Tổng phát sinh Có TK 331 (tăng nợ)
        $totalCredit = $payableTransactions->sum('credit');

        return [
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit
        ];
    }

    /**
     * Tìm journal entry theo reference
     */
    protected function findJournalEntry(array $ref, Carbon $startDate, Carbon $endDate): ?JournalEntry
    {
        return JournalEntry::where('reference_type', $ref['reference_type'])
            ->where('reference_id', $ref['reference_id'])
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->first();
    }

    /**
     * Lấy tất cả chi tiết journal entry (KHÔNG LỌC)
     */
    protected function getJournalEntryDetails(int $journalEntryId): Collection
    {
        return JournalEntryDetail::with(['account.languages' => function ($q) {
            $q->where('language_id', session('currentLanguage', 1));
        }])
            ->where('journal_entry_id', $journalEntryId)
            ->orderBy('id', 'ASC') // Giữ đúng thứ tự nhập
            ->get();
    }



    /**
     * Group transactions theo journal entry để dễ hiển thị
     */
    protected function groupTransactionsByJournalEntry(Collection $transactions): Collection
    {
        return $transactions->groupBy('journal_entry_id')->map(function ($items, $journalEntryId) {
            $firstItem = $items->first();

            return [
                'journal_entry_id' => $journalEntryId,
                'formatted_date' => $firstItem['formatted_date'],
                'reference_code' => $firstItem['reference_code'],
                'reference_type_label' => $firstItem['reference_type_label'],
                'reference_note' => $firstItem['reference_note'],
                'running_balance' => $items->last()['running_balance'], // Lấy balance cuối cùng
                'details' => $items->map(function ($item) {
                    return [
                        'account_code' => $item['account_code'],
                        'account_name' => $item['account_name'],
                        'debit' => $item['debit'],
                        'credit' => $item['credit'],
                        'is_payable' => $item['is_payable_account']
                    ];
                })->values()
            ];
        })->values();
    }

    /**
     * Lọc các dòng tài khoản 331
     */
    protected function filterAccount331Details(Collection $details): Collection
    {
        return $details->filter(function ($detail) {
            return $detail->account &&
                strpos($detail->account->account_code, self::ACCOUNT_PAYABLE) === 0;
        });
    }

    /**
     * Xây dựng transactions từ details
     */
    protected function buildTransactionsFromDetails(
        JournalEntry $journalEntry,
        array $ref,
        Collection $details,
        Collection $account331Details
    ): Collection {
        $transactions = collect();

        $totalDebit331 = $account331Details->sum('debit');
        $totalCredit331 = $account331Details->sum('credit');

        $referenceInfo = $this->getReferenceDetails($ref['reference_type'], $ref['reference_id']);
        $formattedDate = Carbon::parse($journalEntry->entry_date)->format('d/m/Y');
        $referenceTypeLabel = $ref['reference_type'] === self::REF_TYPE_PURCHASE ? 'PN' : 'PC';

        $otherAccounts = $details->filter(function ($detail) {
            return $detail->account &&
                strpos($detail->account->account_code, self::ACCOUNT_PAYABLE) !== 0;
        });

        if ($otherAccounts->isNotEmpty()) {
            foreach ($otherAccounts as $otherAccount) {
                $transactions->push($this->buildTransactionItem(
                    $journalEntry,
                    $formattedDate,
                    $referenceInfo['code'],
                    $referenceTypeLabel,
                    $referenceInfo['note'] ?? $journalEntry->note,
                    $otherAccount->account->account_code,
                    $totalDebit331,
                    $totalCredit331
                ));
            }
        } else {
            $transactions->push($this->buildTransactionItem(
                $journalEntry,
                $formattedDate,
                $referenceInfo['code'],
                $referenceTypeLabel,
                $referenceInfo['note'] ?? $journalEntry->note,
                '',
                $totalDebit331,
                $totalCredit331
            ));
        }

        return $transactions;
    }

    /**
     * Xây dựng một item transaction
     */
    protected function buildTransactionItem(
        JournalEntry $journalEntry,
        string $formattedDate,
        ?string $referenceCode,
        string $referenceTypeLabel,
        ?string $referenceNote,
        string $accountCode,
        float $debit,
        float $credit
    ): array {
        return [
            'journal_entry_id' => $journalEntry->id,
            'formatted_date' => $formattedDate,
            'reference_code' => $referenceCode,
            'reference_type_label' => $referenceTypeLabel,
            'reference_note' => $referenceNote,
            'account_code' => $accountCode,
            'debit' => $debit,
            'credit' => $credit,
            'running_balance' => 0,
            'sort_key' => $journalEntry->entry_date . '_' . $journalEntry->id . '_' . $accountCode
        ];
    }

    /**
     * Lấy thông tin chi tiết từ reference
     */
    protected function getReferenceDetails(string $referenceType, int $referenceId): array
    {
        $result = ['code' => null, 'note' => null];

        switch ($referenceType) {
            case self::REF_TYPE_PURCHASE:
                $reference = PurchaseReceipt::find($referenceId);
                break;
            case self::REF_TYPE_PAYMENT:
                $reference = PaymentVoucher::find($referenceId);
                break;
            default:
                return $result;
        }

        if ($reference) {
            $result['code'] = $reference->code;
            $result['note'] = $reference->note;
        }

        return $result;
    }

    /**
     * Áp dụng filters cho journal entry query
     */
    protected function applyJournalEntryFilters(
        $query,
        int $supplierId,
        ?Carbon $startDate,
        ?Carbon $endDate
    ): void {
        $query->where(function ($q) use ($supplierId) {
            $q->where(function ($sub) use ($supplierId) {
                $sub->where('reference_type', self::REF_TYPE_PURCHASE)
                    ->whereExists(function ($exists) use ($supplierId) {
                        $exists->select(DB::raw(1))
                            ->from('purchase_receipts')
                            ->whereColumn('purchase_receipts.id', 'journal_entries.reference_id')
                            ->where('purchase_receipts.supplier_id', $supplierId);
                    });
            })->orWhere(function ($sub) use ($supplierId) {
                $sub->where('reference_type', self::REF_TYPE_PAYMENT)
                    ->whereExists(function ($exists) use ($supplierId) {
                        $exists->select(DB::raw(1))
                            ->from('payment_vouchers')
                            ->whereColumn('payment_vouchers.id', 'journal_entries.reference_id')
                            ->where('payment_vouchers.supplier_id', $supplierId);
                    });
            });
        });

        if ($startDate) {
            $query->where('entry_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('entry_date', '<=', $endDate);
        }
    }

    /**
     * Format dữ liệu tài khoản
     */
    protected function formatAccountData($item): array
    {
        $accountName = $item->account->languages->first()->pivot->name ??
            $item->account->account_code;

        return [
            'account_id' => $item->account_id,
            'account_code' => $item->account->account_code,
            'account_name' => $accountName,
            'total_debit' => (float)$item->total_debit,
            'total_credit' => (float)$item->total_credit,
            'balance' => (float)($item->total_credit - $item->total_debit)
        ];
    }

    /**
     * Format thông tin nhà cung cấp
     */
    protected function formatSupplierInfo($supplier): array
    {
        return [
            'id' => $supplier->id,
            'supplier_code' => $supplier->supplier_code,
            'name' => $supplier->name,
            'tax_code' => $supplier->tax_code ?? '',
            'phone' => $supplier->phone ?? '',
            'email' => $supplier->email ?? '',
            'address' => $supplier->address ?? ''
        ];
    }

    /**
     * Format thông tin phân trang
     */
    protected function formatPagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem() ?? 0,
            'to' => $paginator->lastItem() ?? 0
        ];
    }

    /**
     * Xây dựng điều kiện cho lịch sử công nợ
     */
    protected function buildDebtHistoryCondition(
        int $supplierId,
        ?Carbon $startDate,
        ?Carbon $endDate
    ): array {
        $condition = [['supplier_id', '=', $supplierId]];

        if ($startDate) {
            $condition[] = ['transaction_date', '>=', $startDate];
        }

        if ($endDate) {
            $condition[] = ['transaction_date', '<=', $endDate];
        }

        return $condition;
    }

    /**
     * Trả về response rỗng
     */
    protected function emptyResponse(array $periodData, int $perpage): array
    {
        return [
            'data' => [],
            'summary' => [
                'opening_balance' => 0,
                'total_debit' => 0,
                'total_credit' => 0,
                'closing_balance' => 0
            ],
            'period' => $periodData['period'],
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perpage,
                'total' => 0,
                'from' => 0,
                'to' => 0
            ]
        ];
    }
}