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
use App\Models\DebitNote;
use App\Models\CreditNote;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class CustomerDebtService extends BaseService implements CustomerDebtServiceInterface
{
    protected const ACCOUNT_RECEIVABLE = '131'; // Phải thu khách hàng
    protected const REF_TYPE_DEBIT_NOTE = 'debit_note';
    protected const REF_TYPE_CREDIT_NOTE = 'credit_note';
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

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

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
            'data'       => $formattedData['data'],
            'summary'    => $formattedData['summary'],
            'period'     => $periodData['period'],
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

        // ✅ Dùng customer_debts để tính opening balance — nhất quán với danh sách
        $openingBalance = $this->calculateCustomerBalanceFromDebts(
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

        // ✅ Tính summary từ customer_debts — nhất quán với danh sách
        $summary = $this->calculateSummaryFromDebts(
            $customerId,
            $periodData['start_date'],
            $periodData['end_date']
        );

        $transactions = $this->updateRunningBalance($transactions, $openingBalance);

        return [
            'customer'        => $this->formatCustomerInfo($customer),
            'period'          => $periodData['period'],
            'opening_balance' => $openingBalance,
            'transactions'    => $transactions,
            'summary'         => $summary
        ];
    }

        /**
     * Tạo công nợ khi lập giấy báo nợ (Debit Note) cho khách hàng
     * Báo nợ khách hàng: Tăng công nợ phải thu (ghi Nợ TK 131)
     * 
     * @param DebitNote $debitNote Giấy báo nợ
     * @return mixed
     */
    public function createDebtForDebitNote($debitNote)
    {
        // Chỉ xử lý nếu debit note có customer_id (báo nợ khách hàng)
        if (!$debitNote->customer_id) {
            return null;
        }

        return DB::transaction(
            fn() =>
            $this->customerDebtRepository->create([
                'customer_id'      => $debitNote->customer_id,
                'reference_type'   => self::REF_TYPE_DEBIT_NOTE,
                'reference_id'     => $debitNote->id,
                'debit'            => $debitNote->total_amount,  // Giấy báo nợ: ghi Nợ (tăng công nợ)
                'credit'           => 0,
                'transaction_date' => $debitNote->issue_date ?? now(),
            ])
        );
    }

    /**
     * Tạo công nợ khi lập giấy báo có (Credit Note) cho khách hàng
     * Báo có khách hàng: Giảm công nợ phải thu (ghi Có TK 131)
     * 
     * @param CreditNote $creditNote Giấy báo có
     * @return mixed
     */
    public function createDebtForCreditNote($creditNote)
    {
        // Chỉ xử lý nếu credit note có customer_id (báo có khách hàng)
        if (!$creditNote->customer_id) {
            return null;
        }

        return DB::transaction(
            fn() =>
            $this->customerDebtRepository->create([
                'customer_id'      => $creditNote->customer_id,
                'reference_type'   => self::REF_TYPE_CREDIT_NOTE,
                'reference_id'     => $creditNote->id,
                'debit'            => 0,
                'credit'           => $creditNote->total_amount,  // Giấy báo có: ghi Có (giảm công nợ)
                'transaction_date' => $creditNote->issue_date ?? now(),
            ])
        );
    }

    /**
     * Cập nhật hoặc tạo mới công nợ cho Debit Note (nếu cần điều chỉnh)
     * 
     * @param DebitNote $debitNote Giấy báo nợ
     * @param array $data Dữ liệu cập nhật
     * @return mixed
     */
    public function updateDebtForDebitNote($debitNote, array $data = [])
    {
        if (!$debitNote->customer_id) {
            return null;
        }

        $existingDebt = $this->customerDebtRepository->findByCondition([
            ['reference_type', '=', self::REF_TYPE_DEBIT_NOTE],
            ['reference_id', '=', $debitNote->id],
        ], false);

        $debtData = [
            'customer_id'      => $debitNote->customer_id,
            'reference_type'   => self::REF_TYPE_DEBIT_NOTE,
            'reference_id'     => $debitNote->id,
            'debit'            => $data['debit'] ?? $debitNote->total_amount,
            'credit'           => $data['credit'] ?? 0,
            'transaction_date' => $data['transaction_date'] ?? ($debitNote->issue_date ?? now()),
        ];

        if ($existingDebt) {
            return $this->customerDebtRepository->update($existingDebt->id, $debtData);
        }

        return $this->customerDebtRepository->create($debtData);
    }

    /**
     * Cập nhật hoặc tạo mới công nợ cho Credit Note (nếu cần điều chỉnh)
     * 
     * @param CreditNote $creditNote Giấy báo có
     * @param array $data Dữ liệu cập nhật
     * @return mixed
     */
    public function updateDebtForCreditNote($creditNote, array $data = [])
    {
        if (!$creditNote->customer_id) {
            return null;
        }

        $existingDebt = $this->customerDebtRepository->findByCondition([
            ['reference_type', '=', self::REF_TYPE_CREDIT_NOTE],
            ['reference_id', '=', $creditNote->id],
        ], false);

        $debtData = [
            'customer_id'      => $creditNote->customer_id,
            'reference_type'   => self::REF_TYPE_CREDIT_NOTE,
            'reference_id'     => $creditNote->id,
            'debit'            => $data['debit'] ?? 0,
            'credit'           => $data['credit'] ?? $creditNote->total_amount,
            'transaction_date' => $data['transaction_date'] ?? ($creditNote->issue_date ?? now()),
        ];

        if ($existingDebt) {
            return $this->customerDebtRepository->update($existingDebt->id, $debtData);
        }

        return $this->customerDebtRepository->create($debtData);
    }

    /**
     * Lấy công nợ theo Debit Note
     * 
     * @param int $debitNoteId ID giấy báo nợ
     * @return mixed
     */
    public function getDebtByDebitNote(int $debitNoteId)
    {
        return $this->customerDebtRepository->findByCondition([
            ['reference_type', '=', self::REF_TYPE_DEBIT_NOTE],
            ['reference_id', '=', $debitNoteId],
        ], false);
    }

    /**
     * Lấy công nợ theo Credit Note
     * 
     * @param int $creditNoteId ID giấy báo có
     * @return mixed
     */
    public function getDebtByCreditNote(int $creditNoteId)
    {
        return $this->customerDebtRepository->findByCondition([
            ['reference_type', '=', self::REF_TYPE_CREDIT_NOTE],
            ['reference_id', '=', $creditNoteId],
        ], false);
    }

    /**
     * Lấy tổng số tiền từ Debit Notes trong kỳ cho khách hàng
     * 
     * @param int $customerId ID khách hàng
     * @param Carbon $startDate Ngày bắt đầu
     * @param Carbon $endDate Ngày kết thúc
     * @return float
     */
    public function getTotalDebitNoteAmount(int $customerId, Carbon $startDate, Carbon $endDate): float
    {
        $debts = $this->customerDebtRepository->findByCondition([
            ['customer_id', '=', $customerId],
            ['reference_type', '=', self::REF_TYPE_DEBIT_NOTE],
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate],
        ], true);

        return (float) $debts->sum('debit');
    }

    /**
     * Lấy tổng số tiền từ Credit Notes trong kỳ cho khách hàng
     * 
     * @param int $customerId ID khách hàng
     * @param Carbon $startDate Ngày bắt đầu
     * @param Carbon $endDate Ngày kết thúc
     * @return float
     */
    public function getTotalCreditNoteAmount(int $customerId, Carbon $startDate, Carbon $endDate): float
    {
        $debts = $this->customerDebtRepository->findByCondition([
            ['customer_id', '=', $customerId],
            ['reference_type', '=', self::REF_TYPE_CREDIT_NOTE],
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate],
        ], true);

        return (float) $debts->sum('credit');
    }

    // =========================================================================
    // CORE CALCULATION - Cập nhật để bao gồm Debit Note và Credit Note
    // =========================================================================

    /**
     * ✅ Cập nhật: Tính số dư tại một thời điểm từ bảng customer_debts
     * Đã bao gồm cả Debit Note và Credit Note
     * Với TK 131: Số dư = Nợ (tăng nợ) - Có (giảm nợ)
     */
    protected function calculateCustomerBalanceFromDebts(int $customerId, ?Carbon $endDate): float
    {
        $condition = [['customer_id', '=', $customerId]];

        if ($endDate) {
            $condition[] = ['transaction_date', '<=', $endDate];
        }

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

        // debit = tăng nợ (Sales Receipt + Debit Note)
        // credit = giảm nợ (Receipt Voucher + Credit Note)
        return (float)($debts->sum('debit') - $debts->sum('credit'));
    }

    /**
     * ✅ Cập nhật: Tính phát sinh trong kỳ từ bảng customer_debts
     * Đã bao gồm cả Debit Note và Credit Note
     */
    protected function calculateCustomerPeriodTransactions(
        int $customerId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $condition = [
            ['customer_id', '=', $customerId],
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate],
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
            'total_debit'  => (float)$debts->sum('debit'),
            'total_credit' => (float)$debts->sum('credit'),
            'count'        => $debts->count(),
        ];
    }

    // =========================================================================
    // THÊM REFERENCE TYPE VÀO getReferenceDetails
    // =========================================================================

    /**
     * Cập nhật: Lấy thông tin chi tiết của chứng từ tham chiếu
     * Đã bao gồm Debit Note và Credit Note
     */
    protected function getReferenceDetails(string $referenceType, int $referenceId): array
    {
        $result = ['code' => null, 'note' => null];

        $reference = match ($referenceType) {
            self::REF_TYPE_SALES        => SalesReceipt::find($referenceId),
            self::REF_TYPE_RECEIPT      => ReceiptVoucher::find($referenceId),
            self::REF_TYPE_DEBIT_NOTE   => DebitNote::find($referenceId),
            self::REF_TYPE_CREDIT_NOTE  => CreditNote::find($referenceId),
            default                     => null,
        };

        if ($reference) {
            $result['code'] = $reference->code;
            $result['note'] = $reference->note ?? $reference->reason ?? null;
        }

        return $result;
    }

    /**
     * Cập nhật: Áp dụng filter journal entry cho khách hàng
     * Đã bao gồm Debit Note và Credit Note
     */
    protected function applyJournalEntryFilters(
        $query,
        int $customerId,
        ?Carbon $startDate,
        ?Carbon $endDate
    ): void {
        $query->where(function ($q) use ($customerId) {
            // Sales Receipt (Phiếu xuất bán)
            $q->where(function ($sub) use ($customerId) {
                $sub->where('reference_type', self::REF_TYPE_SALES)
                    ->whereExists(function ($exists) use ($customerId) {
                        $exists->select(DB::raw(1))
                            ->from('sales_receipts')
                            ->whereColumn('sales_receipts.id', 'journal_entries.reference_id')
                            ->where('sales_receipts.customer_id', $customerId);
                    });
            })
            // Receipt Voucher (Phiếu thu)
            ->orWhere(function ($sub) use ($customerId) {
                $sub->where('reference_type', self::REF_TYPE_RECEIPT)
                    ->whereExists(function ($exists) use ($customerId) {
                        $exists->select(DB::raw(1))
                            ->from('receipt_vouchers')
                            ->whereColumn('receipt_vouchers.id', 'journal_entries.reference_id')
                            ->where('receipt_vouchers.customer_id', $customerId);
                    });
            })
            // Debit Note (Giấy báo nợ)
            ->orWhere(function ($sub) use ($customerId) {
                $sub->where('reference_type', self::REF_TYPE_DEBIT_NOTE)
                    ->whereExists(function ($exists) use ($customerId) {
                        $exists->select(DB::raw(1))
                            ->from('debit_notes')
                            ->whereColumn('debit_notes.id', 'journal_entries.reference_id')
                            ->where('debit_notes.customer_id', $customerId);
                    });
            })
            // Credit Note (Giấy báo có)
            ->orWhere(function ($sub) use ($customerId) {
                $sub->where('reference_type', self::REF_TYPE_CREDIT_NOTE)
                    ->whereExists(function ($exists) use ($customerId) {
                        $exists->select(DB::raw(1))
                            ->from('credit_notes')
                            ->whereColumn('credit_notes.id', 'journal_entries.reference_id')
                            ->where('credit_notes.customer_id', $customerId);
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

    // =========================================================================
    // BUILD FALLBACK TRANSACTION (Cập nhật thêm nhãn cho Debit/Credit Note)
    // =========================================================================

    /**
     * Xây dựng dòng transaction fallback khi chưa có journal entry.
     * Cập nhật thêm nhãn cho Debit Note và Credit Note
     */
    protected function buildFallbackTransaction(
        array $ref,
        array $referenceInfo,
        string $referenceTypeLabel
    ): array {
        // Xác định label phù hợp cho từng loại chứng từ
        $typeLabel = match ($ref['reference_type']) {
            self::REF_TYPE_SALES        => 'PXK',
            self::REF_TYPE_RECEIPT      => 'PT',
            self::REF_TYPE_DEBIT_NOTE   => 'BN',
            self::REF_TYPE_CREDIT_NOTE  => 'BC',
            default                     => $referenceTypeLabel,
        };

        // Lấy thông tin trực tiếp từ phiếu gốc
        $debtRecord = $this->customerDebtRepository->findByCondition(
            [
                ['reference_type', '=', $ref['reference_type']],
                ['reference_id', '=', $ref['reference_id']],
            ],
            true,
            [],
            [],
            ['*'],
            [],
            null,
            []
        )->first();

        $transactionDate = $debtRecord
            ? Carbon::parse($debtRecord->transaction_date)->format('d/m/Y')
            : now()->format('d/m/Y');

        $debit  = $debtRecord ? (float)$debtRecord->debit  : 0;
        $credit = $debtRecord ? (float)$debtRecord->credit : 0;

        return [
            'journal_entry_id'        => null,
            'journal_entry_detail_id' => null,
            'formatted_date'          => $transactionDate,
            'reference_code'          => $referenceInfo['code'],
            'reference_type_label'    => $typeLabel,
            'reference_note'          => $referenceInfo['note'] ?? '',
            'account_id'              => null,
            'account_code'            => self::ACCOUNT_RECEIVABLE,
            'account_name'            => 'Phải thu khách hàng',
            'debit'                   => $debit,
            'credit'                  => $credit,
            'is_receivable_account'   => true,
            'is_tax_account'          => false,
            'has_journal_entry'       => false,
            'running_balance'         => 0,
            'sort_key'                => ($debtRecord
                ? $debtRecord->transaction_date
                : now()->format('Y-m-d')) . '_0_' . $ref['reference_id'],
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
                'customer_id'      => $receipt->customer_id,
                'reference_type'   => self::REF_TYPE_SALES,
                'reference_id'     => $receipt->id,
                'debit'            => $receipt->grand_total,
                'credit'           => 0,
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
                'customer_id'      => $receiptVoucher->customer_id,
                'reference_type'   => self::REF_TYPE_RECEIPT,
                'reference_id'     => $receiptVoucher->id,
                'debit'            => 0,
                'credit'           => $receiptVoucher->amount,
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
        return $this->calculateCustomerBalanceFromDebts($customerId, $endDate);
    }

    /**
     * Lấy tổng công nợ theo nhiều khách hàng
     */
    public function getMultipleCustomerDebtBalance(array $customerIds, ?Carbon $endDate = null): array
    {
        $result = [];
        foreach ($customerIds as $customerId) {
            $result[$customerId] = $this->calculateCustomerBalanceFromDebts($customerId, $endDate);
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
     * ✅ Tính summary từ customer_debts — dùng cho trang chi tiết
     */
    protected function calculateSummaryFromDebts(
        int $customerId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $period = $this->calculateCustomerPeriodTransactions($customerId, $startDate, $endDate);

        return [
            'total_debit'  => $period['total_debit'],
            'total_credit' => $period['total_credit'],
        ];
    }

    // =========================================================================
    // PERIOD & FILTER HELPERS
    // =========================================================================

    /**
     * Chuẩn bị dữ liệu kỳ báo cáo
     */
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
            'start_date'          => $startDate,
            'end_date'            => $endDate,
            'previous_period_end' => $previousPeriodEnd,
            'period'              => [
                'start_date'      => $startDate->format('d/m/Y'),
                'end_date'        => $endDate->format('d/m/Y'),
                'start_date_raw'  => $startDate->format('Y-m-d'),
                'end_date_raw'    => $endDate->format('Y-m-d'),
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
            ['transaction_date', '<=', $endDate],
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

    // =========================================================================
    // FORMAT DANH SÁCH
    // =========================================================================

    /**
     * Format dữ liệu công nợ khách hàng cho danh sách
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
            'total_debit'     => 0,
            'total_credit'    => 0,
            'closing_balance' => 0,
        ];

        foreach ($customers as $customer) {
            // ✅ Cả hai dùng cùng hàm calculateCustomerBalanceFromDebts
            $openingBalance      = $this->calculateCustomerBalanceFromDebts($customer->id, $previousPeriodEnd);
            $periodTransactions  = $this->calculateCustomerPeriodTransactions($customer->id, $startDate, $endDate);

            // Với TK 131: Số dư cuối = Số dư đầu + Phát sinh Nợ (bán hàng) - Phát sinh Có (thu tiền)
            $closingBalance      = $openingBalance
                + $periodTransactions['total_debit']
                - $periodTransactions['total_credit'];

            $summary['opening_balance'] += $openingBalance;
            $summary['total_debit']     += $periodTransactions['total_debit'];
            $summary['total_credit']    += $periodTransactions['total_credit'];

            $formattedData->push([
                'customer_id'       => $customer->id,
                'customer_name'     => $customer->name,
                'tax_code'          => $customer->tax_code ?? '',
                'phone'             => $customer->phone ?? '',
                'email'             => $customer->email ?? '',
                'address'           => $customer->address ?? '',
                'opening_balance'   => $openingBalance,
                'total_debit'       => $periodTransactions['total_debit'],
                'total_credit'      => $periodTransactions['total_credit'],
                'closing_balance'   => $closingBalance,
                'transaction_count' => $periodTransactions['count'],
            ]);
        }

        $summary['closing_balance'] = $summary['opening_balance']
            + $summary['total_debit']
            - $summary['total_credit'];

        return [
            'data'    => $formattedData,
            'summary' => $summary,
        ];
    }

    // =========================================================================
    // FORMAT CHI TIẾT (journal entries)
    // =========================================================================

    /**
     * Lấy danh sách ID chứng từ theo khách hàng trong kỳ
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
                ['transaction_date', '<=', $endDate],
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
            'reference_id'   => $debt->reference_id,
        ])->toArray();
    }

    /**
     * Lấy chi tiết journal entries để hiển thị sổ chi tiết.
     * Nếu chưa có journal entry (chưa hạch toán) thì fallback về dữ liệu từ customer_debts.
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
            // ✅ FIX: Bỏ filter theo startDate/endDate khi tìm journal entry
            // vì entry_date có thể khác transaction_date trong customer_debts
            $journalEntry = $this->findJournalEntry($ref);

            $referenceInfo      = $this->getReferenceDetails($ref['reference_type'], $ref['reference_id']);
                        $referenceTypeLabel =
                $ref['reference_type'] === self::REF_TYPE_SALES ? 'PN' : ($ref['reference_type'] === self::REF_TYPE_DEBIT_NOTE ? 'BN' : ($ref['reference_type'] === self::REF_TYPE_CREDIT_NOTE ? 'BC' : 'PC'));

            if ($journalEntry) {
                // --- Có journal entry: lấy chi tiết bút toán để hiển thị ---
                $details = $this->getJournalEntryDetails($journalEntry->id);

                if ($details->isEmpty()) {
                    // Journal entry tồn tại nhưng không có details → fallback
                    $transactions->push(
                        $this->buildFallbackTransaction($ref, $referenceInfo, $referenceTypeLabel)
                    );
                    continue;
                }

                $formattedDate = Carbon::parse($journalEntry->entry_date)->format('d/m/Y');

                foreach ($details as $detail) {
                    if (!$detail->account) {
                        continue;
                    }

                    $account     = $detail->account;
                    $accountName = $account->languages->first()->pivot->name ?? $account->account_code;

                    $transactions->push([
                        'journal_entry_id'        => $journalEntry->id,
                        'journal_entry_detail_id' => $detail->id,
                        'formatted_date'          => $formattedDate,
                        'reference_code'          => $referenceInfo['code'],
                        'reference_type_label'    => $referenceTypeLabel,
                        'reference_note'          => $referenceInfo['note'] ?? $journalEntry->note,
                        'account_id'              => $account->id,
                        'account_code'            => $account->account_code,
                        'account_name'            => $accountName,
                        'debit'                   => (float)$detail->debit,
                        'credit'                  => (float)$detail->credit,
                        'is_receivable_account'   => str_starts_with($account->account_code, self::ACCOUNT_RECEIVABLE),
                        'is_tax_account'          => str_starts_with($account->account_code, self::TAX_ACCOUNT),
                        'has_journal_entry'       => true,
                        'running_balance'         => 0,
                        'sort_key'                => $journalEntry->entry_date . '_' . $journalEntry->id . '_' . $detail->id,
                    ]);
                }
            } else {
                // ✅ FIX: Chưa có journal entry (chưa hạch toán) → fallback về customer_debts
                $transactions->push(
                    $this->buildFallbackTransaction($ref, $referenceInfo, $referenceTypeLabel)
                );
            }
        }

        return $transactions->sortBy('sort_key')->values();
    }

    /**
     * ✅ Cập nhật running balance dựa trên dòng TK 131 trong journal entries
     * Opening balance đã được tính đúng từ customer_debts nên running balance sẽ khớp
     */
    protected function updateRunningBalance(Collection $transactions, float $openingBalance): Collection
    {
        $runningBalance = $openingBalance;

        return $transactions->map(function ($item) use (&$runningBalance) {
            if ($item['is_receivable_account']) {
                // Với TK 131: Nợ (tăng nợ), Có (giảm nợ)
                $runningBalance += ($item['debit'] - $item['credit']);
            }

            $item['running_balance'] = $runningBalance;

            return $item;
        });
    }

    // =========================================================================
    // JOURNAL ENTRY HELPERS
    // =========================================================================

    /**
     * ✅ FIX: Tìm journal entry theo reference — KHÔNG lọc theo ngày
     * vì entry_date có thể khác transaction_date trong customer_debts
     */
    protected function findJournalEntry(array $ref): ?JournalEntry
    {
        return JournalEntry::where('reference_type', $ref['reference_type'])
            ->where('reference_id', $ref['reference_id'])
            ->first();
    }

    protected function getJournalEntryDetails(int $journalEntryId): Collection
    {
        return JournalEntryDetail::with(['account.languages' => function ($q) {
            $q->where('language_id', session('currentLanguage', 1));
        }])
            ->where('journal_entry_id', $journalEntryId)
            ->orderBy('id', 'ASC')
            ->get();
    }

    // =========================================================================
    // FORMAT HELPERS
    // =========================================================================

    protected function formatAccountData($item): array
    {
        $accountName = $item->account->languages->first()->pivot->name
            ?? $item->account->account_code;

        return [
            'account_id'    => $item->account_id,
            'account_code'  => $item->account->account_code,
            'account_name'  => $accountName,
            'total_debit'   => (float)$item->total_debit,
            'total_credit'  => (float)$item->total_credit,
            'balance'       => (float)($item->total_debit - $item->total_credit), // Với TK 131: Nợ - Có
        ];
    }

    protected function formatCustomerInfo($customer): array
    {
        return [
            'customer_id'   => $customer->id,
            'customer_name' => $customer->name,
            'tax_code'      => $customer->tax_code ?? '',
            'phone'         => $customer->phone ?? '',
            'email'         => $customer->email ?? '',
            'address'       => $customer->address ?? '',
        ];
    }

    protected function formatPagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem() ?? 0,
            'to'           => $paginator->lastItem() ?? 0,
        ];
    }

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

    protected function emptyResponse(array $periodData, int $perpage): array
    {
        return [
            'data'    => [],
            'summary' => [
                'opening_balance' => 0,
                'total_debit'     => 0,
                'total_credit'    => 0,
                'closing_balance' => 0,
            ],
            'period'     => $periodData['period'],
            'pagination' => [
                'current_page' => 1,
                'last_page'    => 1,
                'per_page'     => $perpage,
                'total'        => 0,
                'from'         => 0,
                'to'           => 0,
            ]
        ];
    }

    // =========================================================================
    // DEPRECATED — giữ lại để tránh break nếu có nơi khác gọi
    // =========================================================================

    /** @deprecated Dùng calculateCustomerBalanceFromDebts() */
    protected function calculateCustomerBalance(int $customerId, Carbon $endDate): float
    {
        return $this->calculateCustomerBalanceFromDebts($customerId, $endDate);
    }

    /** @deprecated Dùng calculateSummaryFromDebts() */
    protected function calculateSummary(Collection $transactions): array
    {
        $receivableTransactions = $transactions->filter(fn($item) => $item['is_receivable_account']);

        return [
            'total_debit'  => $receivableTransactions->sum('debit'),
            'total_credit' => $receivableTransactions->sum('credit'),
        ];
    }

    /** @deprecated */
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
}