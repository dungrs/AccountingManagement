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

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

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
            'data'       => $formattedData['data'],
            'summary'    => $formattedData['summary'],
            'period'     => $periodData['period'],
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

        // ✅ FIX: Dùng supplier_debts để tính opening balance — nhất quán với danh sách
        $openingBalance = $this->calculateSupplierBalanceFromDebts(
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

        // ✅ FIX: Tính summary từ supplier_debts — nhất quán với danh sách
        $summary = $this->calculateSummaryFromDebts(
            $supplierId,
            $periodData['start_date'],
            $periodData['end_date']
        );

        $transactions = $this->updateRunningBalance($transactions, $openingBalance);

        return [
            'supplier'        => $this->formatSupplierInfo($supplier),
            'period'          => $periodData['period'],
            'opening_balance' => $openingBalance,
            'transactions'    => $transactions,
            'summary'         => $summary
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
                'supplier_id'      => $receipt->supplier_id,
                'reference_type'   => self::REF_TYPE_PURCHASE,
                'reference_id'     => $receipt->id,
                'debit'            => 0,
                'credit'           => $receipt->grand_total,
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
                'supplier_id'      => $paymentVoucher->supplier_id,
                'reference_type'   => self::REF_TYPE_PAYMENT,
                'reference_id'     => $paymentVoucher->id,
                'debit'            => $paymentVoucher->amount,
                'credit'           => 0,
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
        return $this->calculateSupplierBalanceFromDebts($supplierId, $endDate);
    }

    /**
     * Lấy tổng công nợ theo nhiều nhà cung cấp
     */
    public function getMultipleSupplierDebtBalance(array $supplierIds, ?Carbon $endDate = null): array
    {
        $result = [];
        foreach ($supplierIds as $supplierId) {
            $result[$supplierId] = $this->calculateSupplierBalanceFromDebts($supplierId, $endDate);
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

    // =========================================================================
    // CORE CALCULATION — dùng supplier_debts (nguồn dữ liệu chính)
    // =========================================================================

    /**
     * ✅ Tính số dư tại một thời điểm từ bảng supplier_debts
     * Đây là nguồn sự thật duy nhất — cả danh sách lẫn chi tiết đều dùng hàm này
     */
    protected function calculateSupplierBalanceFromDebts(int $supplierId, ?Carbon $endDate): float
    {
        $condition = [['supplier_id', '=', $supplierId]];

        if ($endDate) {
            $condition[] = ['transaction_date', '<=', $endDate];
        }

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

        return (float)($debts->sum('credit') - $debts->sum('debit'));
    }

    /**
     * ✅ Tính phát sinh trong kỳ từ bảng supplier_debts
     * Nhất quán với calculateSupplierBalanceFromDebts
     */
    protected function calculateSupplierPeriodTransactions(
        int $supplierId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $condition = [
            ['supplier_id', '=', $supplierId],
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate],
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
            'total_debit'  => (float)$debts->sum('debit'),
            'total_credit' => (float)$debts->sum('credit'),
            'count'        => $debts->count(),
        ];
    }

    /**
     * ✅ Tính summary từ supplier_debts — dùng cho trang chi tiết
     * Thay thế calculateSummary() cũ vốn chỉ lọc dòng TK 331 trong journal entries
     */
    protected function calculateSummaryFromDebts(
        int $supplierId,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $period = $this->calculateSupplierPeriodTransactions($supplierId, $startDate, $endDate);

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
     * Lấy danh sách ID nhà cung cấp có phát sinh trong kỳ
     */
    protected function getSupplierIdsWithTransactions(
        Carbon $startDate,
        Carbon $endDate,
        Request $request
    ): array {
        $condition = [
            ['transaction_date', '>=', $startDate],
            ['transaction_date', '<=', $endDate],
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

    // =========================================================================
    // FORMAT DANH SÁCH
    // =========================================================================

    /**
     * Format dữ liệu công nợ nhà cung cấp cho danh sách
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
            'total_debit'     => 0,
            'total_credit'    => 0,
            'closing_balance' => 0,
        ];

        foreach ($suppliers as $supplier) {
            // ✅ Cả hai dùng cùng hàm calculateSupplierBalanceFromDebts
            $openingBalance      = $this->calculateSupplierBalanceFromDebts($supplier->id, $previousPeriodEnd);
            $periodTransactions  = $this->calculateSupplierPeriodTransactions($supplier->id, $startDate, $endDate);
            $closingBalance      = $openingBalance
                + $periodTransactions['total_credit']
                - $periodTransactions['total_debit'];

            $summary['opening_balance'] += $openingBalance;
            $summary['total_debit']     += $periodTransactions['total_debit'];
            $summary['total_credit']    += $periodTransactions['total_credit'];

            $formattedData->push([
                'id'                => $supplier->id,
                'supplier_code'     => $supplier->supplier_code,
                'supplier_name'     => $supplier->name,
                'tax_code'          => $supplier->tax_code ?? '',
                'phone'             => $supplier->phone ?? '',
                'email'             => $supplier->email ?? '',
                'address'           => $supplier->address ?? '',
                'opening_balance'   => $openingBalance,
                'total_debit'       => $periodTransactions['total_debit'],
                'total_credit'      => $periodTransactions['total_credit'],
                'closing_balance'   => $closingBalance,
                'transaction_count' => $periodTransactions['count'],
            ]);
        }

        $summary['closing_balance'] = $summary['opening_balance']
            + $summary['total_credit']
            - $summary['total_debit'];

        return [
            'data'    => $formattedData,
            'summary' => $summary,
        ];
    }

    // =========================================================================
    // FORMAT CHI TIẾT (journal entries)
    // =========================================================================

    /**
     * Lấy danh sách ID chứng từ theo nhà cung cấp trong kỳ
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
     * Nếu chưa có journal entry (chưa hạch toán) thì fallback về dữ liệu từ supplier_debts.
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
            // vì entry_date có thể khác transaction_date trong supplier_debts
            $journalEntry = $this->findJournalEntry($ref);

            $referenceInfo      = $this->getReferenceDetails($ref['reference_type'], $ref['reference_id']);
            $referenceTypeLabel = $ref['reference_type'] === self::REF_TYPE_PURCHASE ? 'PN' : 'PC';

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
                        'is_payable_account'      => str_starts_with($account->account_code, self::ACCOUNT_PAYABLE),
                        'is_tax_account'          => str_starts_with($account->account_code, self::TAX_ACCOUNT),
                        'has_journal_entry'       => true,
                        'running_balance'         => 0,
                        'sort_key'                => $journalEntry->entry_date . '_' . $journalEntry->id . '_' . $detail->id,
                    ]);
                }
            } else {
                // ✅ FIX: Chưa có journal entry (chưa hạch toán) → fallback về supplier_debts
                // Vẫn hiển thị dòng công nợ để sổ chi tiết không bị trống
                $transactions->push(
                    $this->buildFallbackTransaction($ref, $referenceInfo, $referenceTypeLabel)
                );
            }
        }

        return $transactions->sortBy('sort_key')->values();
    }

    /**
     * Xây dựng dòng transaction fallback khi chưa có journal entry.
     * Lấy dữ liệu trực tiếp từ supplier_debts và reference (phiếu nhập/phiếu chi).
     */
    protected function buildFallbackTransaction(
        array $ref,
        array $referenceInfo,
        string $referenceTypeLabel
    ): array {
        // Lấy thông tin trực tiếp từ phiếu gốc
        $debtRecord = $this->supplierDebtRepository->findByCondition(
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

        // Xác định tài khoản đối ứng hiển thị (TK 331 phía công nợ)
        $isPurchase = $ref['reference_type'] === self::REF_TYPE_PURCHASE;

        return [
            'journal_entry_id'        => null,
            'journal_entry_detail_id' => null,
            'formatted_date'          => $transactionDate,
            'reference_code'          => $referenceInfo['code'],
            'reference_type_label'    => $referenceTypeLabel,
            'reference_note'          => $referenceInfo['note'] ?? '',
            'account_id'              => null,
            'account_code'            => self::ACCOUNT_PAYABLE,  // Hiển thị TK 331
            'account_name'            => 'Phải trả người bán',
            'debit'                   => $debit,
            'credit'                  => $credit,
            'is_payable_account'      => true,   // Luôn là TK 331 → tính vào running balance
            'is_tax_account'          => false,
            'has_journal_entry'       => false,  // Frontend có thể dùng flag này để highlight
            'running_balance'         => 0,
            // sort_key dùng transaction_date + reference_id để đảm bảo thứ tự đúng
            'sort_key'                => ($debtRecord
                ? $debtRecord->transaction_date
                : now()->format('Y-m-d')) . '_0_' . $ref['reference_id'],
        ];
    }

    /**
     * ✅ Cập nhật running balance dựa trên dòng TK 331 trong journal entries
     * Opening balance đã được tính đúng từ supplier_debts nên running balance sẽ khớp
     */
    protected function updateRunningBalance(Collection $transactions, float $openingBalance): Collection
    {
        $runningBalance = $openingBalance;

        return $transactions->map(function ($item) use (&$runningBalance) {
            if ($item['is_payable_account']) {
                $runningBalance += ($item['credit'] - $item['debit']);
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
     * vì entry_date có thể khác transaction_date trong supplier_debts
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

    // =========================================================================
    // REFERENCE HELPERS
    // =========================================================================

    protected function getReferenceDetails(string $referenceType, int $referenceId): array
    {
        $result = ['code' => null, 'note' => null];

        $reference = match ($referenceType) {
            self::REF_TYPE_PURCHASE => PurchaseReceipt::find($referenceId),
            self::REF_TYPE_PAYMENT  => PaymentVoucher::find($referenceId),
            default                 => null,
        };

        if ($reference) {
            $result['code'] = $reference->code;
            $result['note'] = $reference->note;
        }

        return $result;
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
            'balance'       => (float)($item->total_credit - $item->total_debit),
        ];
    }

    protected function formatSupplierInfo($supplier): array
    {
        return [
            'id'            => $supplier->id,
            'supplier_code' => $supplier->supplier_code,
            'name'          => $supplier->name,
            'tax_code'      => $supplier->tax_code ?? '',
            'phone'         => $supplier->phone ?? '',
            'email'         => $supplier->email ?? '',
            'address'       => $supplier->address ?? '',
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

    /** @deprecated Dùng calculateSupplierBalanceFromDebts() */
    protected function calculateSupplierBalance(int $supplierId, Carbon $endDate): float
    {
        return $this->calculateSupplierBalanceFromDebts($supplierId, $endDate);
    }

    /** @deprecated Dùng calculateSummaryFromDebts() */
    protected function calculateSummary(Collection $transactions): array
    {
        $payableTransactions = $transactions->filter(fn($item) => $item['is_payable_account']);

        return [
            'total_debit'  => $payableTransactions->sum('debit'),
            'total_credit' => $payableTransactions->sum('credit'),
        ];
    }

    /** @deprecated */
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
}