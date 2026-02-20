<?php

namespace App\Services\Debt;

use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Repositories\Debt\CustomerDebtRepository;
use App\Repositories\Customer\CustomerRepository;
use App\Services\BaseService;
use App\Services\Interfaces\Debt\CustomerDebtServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\SalesReceipt;
use App\Models\ReceiptVoucher;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class CustomerDebtService extends BaseService implements CustomerDebtServiceInterface
{
    protected const ACCOUNT_RECEIVABLE = '131'; // Phải thu khách hàng
    protected const REF_TYPE_SALES = 'sales_receipt';
    protected const REF_TYPE_RECEIPT = 'receipt_voucher';
    protected const TAX_ACCOUNT = '3331'; // Thuế GTGT đầu ra

    protected CustomerDebtRepository $customerDebtRepository;
    protected CustomerRepository $customerRepository;

    public function __construct(
        CustomerDebtRepository $customerDebtRepository,
        CustomerRepository $customerRepository
    ) {
        $this->customerDebtRepository = $customerDebtRepository;
        $this->customerRepository = $customerRepository;
    }

    /**
     * Paginate danh sách tổng hợp công nợ theo từng khách hàng
     */
    public function paginate(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $perpage = (int)($request->input('perpage') ?? 20);

        $customerIds = $this->getCustomerIdsWithTransactions(
            $periodData['start_date'],
            $periodData['end_date'],
            $request
        );

        if (empty($customerIds)) {
            return $this->emptyResponse($periodData, $perpage);
        }

        $customers = $this->getCustomersWithPagination($customerIds, $request, $perpage);
        $formattedData = $this->formatCustomerDebtData(
            $customers,
            $periodData['previous_period_end'],
            $periodData['start_date'],
            $periodData['end_date']
        );

        return [
            'data' => $formattedData['data'],
            'summary' => $formattedData['summary'],
            'period' => $periodData['period'],
            'pagination' => $this->formatPagination($customers)
        ];
    }

    /**
     * Lấy chi tiết công nợ của khách hàng - Sổ chi tiết 131
     */
    public function getCustomerDebtDetails(int $customerId, Request $request): array
    {
        $periodData = $this->preparePeriodData($request);

        $customer = $this->customerRepository->findById($customerId);
        if (!$customer) {
            throw new \Exception("Không tìm thấy khách hàng với ID: {$customerId}");
        }

        $openingBalance = $this->calculateCustomerBalance(
            $customerId,
            $periodData['previous_period_end']
        );

        $referenceIds = $this->getReferenceIdsByCustomer(
            $customerId,
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
            'customer' => $this->formatCustomerInfo($customer),
            'period' => $periodData['period'],
            'opening_balance' => $openingBalance,
            'transactions' => $transactions,
            'summary' => $summary
        ];
    }

    /**
     * Lấy danh sách tài khoản kế toán theo khách hàng
     */
    public function getCustomerAccounts(
        int $customerId,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): Collection {
        $query = JournalEntryDetail::with(['account.languages' => function ($q) {
            $q->where('language_id', session('currentLanguage', 1));
        }])
            ->whereHas('journalEntry', function ($q) use ($customerId, $startDate, $endDate) {
                $this->applyJournalEntryFilters($q, $customerId, $startDate, $endDate);
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
     * Tạo công nợ khi bán hàng (tăng nợ - ghi Nợ TK 131)
     */
    public function createDebtForSalesReceipt($receipt)
    {
        return DB::transaction(
            fn() =>
            $this->customerDebtRepository->create([
                'customer_id' => $receipt->customer_id,
                'reference_type' => self::REF_TYPE_SALES,
                'reference_id' => $receipt->id,
                'debit' => $receipt->grand_total, // Khách hàng nợ (tăng công nợ)
                'credit' => 0,
                'transaction_date' => $receipt->receipt_date ?? now(),
            ])
        );
    }

    /**
     * Tạo công nợ khi thu tiền (giảm nợ - ghi Có TK 131)
     */
    public function createDebtForReceiptVoucher($receiptVoucher)
    {
        return DB::transaction(
            fn() =>
            $this->customerDebtRepository->create([
                'customer_id' => $receiptVoucher->customer_id,
                'reference_type' => self::REF_TYPE_RECEIPT,
                'reference_id' => $receiptVoucher->id,
                'debit' => 0,
                'credit' => $receiptVoucher->amount, // Khách hàng trả (giảm công nợ)
                'transaction_date' => $receiptVoucher->voucher_date ?? now(),
            ])
        );
    }

    /**
     * Xóa công nợ theo reference
     */
    public function deleteDebtByReference(string $referenceType, int $referenceId): bool
    {
        return (bool)$this->customerDebtRepository->deleteByCondition([
            ['reference_type', '=', $referenceType],
            ['reference_id', '=', $referenceId]
        ]);
    }

    /**
     * Lấy tổng công nợ hiện tại của khách hàng
     */
    public function getCustomerDebtBalance(int $customerId, ?Carbon $endDate = null): float
    {
        $debts = $this->getCustomerDebts($customerId, $endDate);
        return $debts->sum('debit') - $debts->sum('credit'); // Công nợ phải thu = Nợ - Có
    }

    /**
     * Lấy tổng công nợ theo nhiều khách hàng
     */
    public function getMultipleCustomerDebtBalance(array $customerIds, ?Carbon $endDate = null): array
    {
        $result = [];
        foreach ($customerIds as $customerId) {
            $result[$customerId] = $this->getCustomerDebtBalance($customerId, $endDate);
        }
        return $result;
    }

    /**
     * Lấy lịch sử công nợ của khách hàng
     */
    public function getCustomerDebtHistory(
        int $customerId,
        int $limit = 50,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): Collection {
        $condition = $this->buildDebtHistoryCondition($customerId, $startDate, $endDate);

        return $this->customerDebtRepository->findByCondition(
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
     * Lấy danh sách ID khách hàng có phát sinh trong kỳ
     */
    protected function getCustomerIdsWithTransactions(
        Carbon $startDate,
        Carbon $endDate,
        Request $request
    ): array {
        $condition = [
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate]
        ];

        if ($request->has('customer_id') && $request->customer_id) {
            $condition[] = ['customer_id', '=', $request->customer_id];
        }

        if ($request->has('reference_type') && $request->reference_type !== 'all') {
            $condition[] = ['reference_type', '=', $request->reference_type];
        }

        $debts = $this->customerDebtRepository->findByCondition(
            $condition,
            true,
            [],
            [],
            ['customer_id'],
            [],
            null,
            ['customer_id']
        );

        return $debts->pluck('customer_id')->unique()->toArray();
    }

    /**
     * Lấy danh sách khách hàng có phân trang
     */
    protected function getCustomersWithPagination(
        array $customerIds,
        Request $request,
        int $perpage
    ): LengthAwarePaginator {
        $condition = [
            'whereIn' => [['id', $customerIds]]
        ];

        if ($keyword = $request->input('keyword')) {
            $condition['keyword'] = $keyword;
        }

        return $this->customerRepository->paginate(
            ['id', 'name', 'phone', 'email', 'address'],
            $condition,
            $perpage,
            (int)$request->input('page', 1),
            ['path' => $request->fullUrl()],
            ['name', 'ASC']
        );
    }

    /**
     * Format dữ liệu công nợ khách hàng
     */
    protected function formatCustomerDebtData(
        LengthAwarePaginator $customers,
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

        foreach ($customers as $customer) {
            $openingBalance = $this->calculateCustomerBalance($customer->id, $previousPeriodEnd);
            $periodTransactions = $this->calculateCustomerPeriodTransactions(
                $customer->id,
                $startDate,
                $endDate
            );

            // Với TK 131: Số dư cuối = Số dư đầu + Phát sinh Nợ (bán hàng) - Phát sinh Có (thu tiền)
            $closingBalance = $openingBalance + $periodTransactions['total_debit'] - $periodTransactions['total_credit'];

            // Cập nhật summary
            $summary['opening_balance'] += $openingBalance;
            $summary['total_debit'] += $periodTransactions['total_debit'];
            $summary['total_credit'] += $periodTransactions['total_credit'];

            $formattedData->push([
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'tax_code' => $customer->tax_code ?? '',
                'phone' => $customer->phone ?? '',
                'email' => $customer->email ?? '',
                'address' => $customer->address ?? '',
                'opening_balance' => $openingBalance,
                'total_debit' => $periodTransactions['total_debit'],
                'total_credit' => $periodTransactions['total_credit'],
                'closing_balance' => $closingBalance,
                'transaction_count' => $periodTransactions['count']
            ]);
        }

        $summary['closing_balance'] = $summary['opening_balance'] + $summary['total_debit'] - $summary['total_credit'];

        return [
            'data' => $formattedData,
            'summary' => $summary
        ];
    }

    /**
     * Tính số dư của khách hàng tại một thời điểm
     */
    protected function calculateCustomerBalance(int $customerId, Carbon $endDate): float
    {
        $debts = $this->getCustomerDebts($customerId, $endDate);
        return $debts->sum('debit') - $debts->sum('credit');
    }

    /**
     * Lấy danh sách công nợ của khách hàng
     */
    protected function getCustomerDebts(int $customerId, ?Carbon $endDate = null): Collection
    {
        $condition = [['customer_id', '=', $customerId]];

        if ($endDate) {
            $condition[] = ['transaction_date', '<=', $endDate];
        }

        return $this->customerDebtRepository->findByCondition(
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
     * Tính phát sinh trong kỳ của khách hàng
     */
    protected function calculateCustomerPeriodTransactions(
        int $customerId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $condition = [
            ['customer_id', '=', $customerId],
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate]
        ];

        $debts = $this->customerDebtRepository->findByCondition(
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
     * Lấy danh sách ID chứng từ theo khách hàng
     */
    protected function getReferenceIdsByCustomer(
        int $customerId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $debts = $this->customerDebtRepository->findByCondition(
            [
                ['customer_id', '=', $customerId],
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

    /**
     * Lấy chi tiết journal entry
     */
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

            // Lấy TẤT CẢ chi tiết của journal entry
            $details = $this->getJournalEntryDetails($journalEntry->id);

            if ($details->isEmpty()) {
                continue;
            }

            // Lấy thông tin chung
            $referenceInfo = $this->getReferenceDetails($ref['reference_type'], $ref['reference_id']);
            $formattedDate = Carbon::parse($journalEntry->entry_date)->format('d/m/Y');
            $referenceTypeLabel = $ref['reference_type'] === self::REF_TYPE_SALES ? 'PXK' : 'PT';

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

                    // Số tiền của từng dòng
                    'debit' => (float)$detail->debit,
                    'credit' => (float)$detail->credit,

                    // Phân loại dòng
                    'is_receivable_account' => strpos($account->account_code, self::ACCOUNT_RECEIVABLE) === 0,
                    'is_tax_account' => strpos($account->account_code, self::TAX_ACCOUNT) === 0,

                    // Running balance sẽ cập nhật sau
                    'running_balance' => 0,

                    // Key để sort
                    'sort_key' => $journalEntry->entry_date . '_' . $journalEntry->id . '_' . $detail->id
                ]);
            }
        }

        // Sắp xếp theo ngày và ID
        $sortedTransactions = $transactions->sortBy('sort_key')->values();

        return $sortedTransactions;
    }

    /**
     * Cập nhật running balance cho transactions
     */
    protected function updateRunningBalance(Collection $transactions, float $openingBalance): Collection
    {
        $runningBalance = $openingBalance;

        // Chỉ tính running balance khi gặp dòng tài khoản 131
        return $transactions->map(function ($item) use (&$runningBalance) {
            // Chỉ cập nhật running balance cho dòng là tài khoản 131
            if ($item['is_receivable_account']) {
                // Với TK 131:
                // - Nợ: tăng công nợ (bán hàng)
                // - Có: giảm công nợ (thu tiền)
                $runningBalance += ($item['debit'] - $item['credit']);
            }

            // Gán running balance
            $item['running_balance'] = $runningBalance;

            return $item;
        });
    }

    /**
     * Tính tổng phát sinh cho summary
     */
    protected function calculateSummary(Collection $transactions): array
    {
        // Lọc chỉ lấy dòng tài khoản 131 để tính tổng công nợ
        $receivableTransactions = $transactions->filter(function ($item) {
            return $item['is_receivable_account'];
        });

        // Tổng phát sinh Nợ TK 131 (tăng nợ - bán hàng)
        $totalDebit = $receivableTransactions->sum('debit');

        // Tổng phát sinh Có TK 131 (giảm nợ - thu tiền)
        $totalCredit = $receivableTransactions->sum('credit');

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
     * Lấy tất cả chi tiết journal entry
     */
    protected function getJournalEntryDetails(int $journalEntryId): Collection
    {
        return JournalEntryDetail::with(['account.languages' => function ($q) {
            $q->where('language_id', session('currentLanguage', 1));
        }])
            ->where('journal_entry_id', $journalEntryId)
            ->orderBy('id', 'ASC')
            ->get();
    }

    /**
     * Lấy thông tin chi tiết từ reference
     */
    protected function getReferenceDetails(string $referenceType, int $referenceId): array
    {
        $result = ['code' => null, 'note' => null];

        switch ($referenceType) {
            case self::REF_TYPE_SALES:
                $reference = SalesReceipt::find($referenceId);
                break;
            case self::REF_TYPE_RECEIPT:
                $reference = ReceiptVoucher::find($referenceId);
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
        int $customerId,
        ?Carbon $startDate,
        ?Carbon $endDate
    ): void {
        $query->where(function ($q) use ($customerId) {
            $q->where(function ($sub) use ($customerId) {
                $sub->where('reference_type', self::REF_TYPE_SALES)
                    ->whereExists(function ($exists) use ($customerId) {
                        $exists->select(DB::raw(1))
                            ->from('sales_receipts')
                            ->whereColumn('sales_receipts.id', 'journal_entries.reference_id')
                            ->where('sales_receipts.customer_id', $customerId);
                    });
            })->orWhere(function ($sub) use ($customerId) {
                $sub->where('reference_type', self::REF_TYPE_RECEIPT)
                    ->whereExists(function ($exists) use ($customerId) {
                        $exists->select(DB::raw(1))
                            ->from('receipt_vouchers')
                            ->whereColumn('receipt_vouchers.id', 'journal_entries.reference_id')
                            ->where('receipt_vouchers.customer_id', $customerId);
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
            'balance' => (float)($item->total_debit - $item->total_credit) // Với TK 131: Nợ - Có
        ];
    }

    /**
     * Format thông tin khách hàng
     */
    protected function formatCustomerInfo($customer): array
    {
        return [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'tax_code' => $customer->tax_code ?? '',
            'phone' => $customer->phone ?? '',
            'email' => $customer->email ?? '',
            'address' => $customer->address ?? ''
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
        int $customerId,
        ?Carbon $startDate,
        ?Carbon $endDate
    ): array {
        $condition = [['customer_id', '=', $customerId]];

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