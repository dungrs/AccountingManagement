<?php

namespace App\Services\Receipt;

use App\Repositories\Receipt\PurchaseReceiptItemRepository;
use App\Repositories\Receipt\PurchaseReceiptRepository;
use App\Repositories\VatTaxRepository;
use App\Services\BaseService;
use App\Services\Debt\SupplierDebtService;
use App\Services\Interfaces\Receipt\PurchaseReceiptServiceInterface;
use App\Services\Inventory\InventoryService;
use App\Services\JournalEntryService;
use App\Services\Product\ProductVariantService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PurchaseReceiptService extends BaseService implements PurchaseReceiptServiceInterface
{
    protected $purchaseReceiptRepository;
    protected $purchaseReceiptItemRepository;
    protected $vatTaxRepository;
    protected $journalEntryService;
    protected $supplierDebtService;
    protected $productVariantService;
    protected $inventoryService;

    public function __construct(
        PurchaseReceiptRepository $purchaseReceiptRepository,
        PurchaseReceiptItemRepository $purchaseReceiptItemRepository,
        VatTaxRepository $vatTaxRepository,
        JournalEntryService $journalEntryService,
        SupplierDebtService $supplierDebtService,
        ProductVariantService $productVariantService,
        InventoryService $inventoryService
    ) {
        $this->purchaseReceiptRepository = $purchaseReceiptRepository;
        $this->purchaseReceiptItemRepository = $purchaseReceiptItemRepository;
        $this->vatTaxRepository = $vatTaxRepository;
        $this->journalEntryService = $journalEntryService;
        $this->supplierDebtService = $supplierDebtService;
        $this->productVariantService = $productVariantService;
        $this->inventoryService = $inventoryService;
    }

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
        ];

        $extend = [
            'path' => '/receipt/purchase/index',
            'fieldSearch' => ['code', 'u.name', 'supplier_name'],
        ];

        $join = [
            [
                'table' => 'users as u',
                'on' => [['purchase_receipts.user_id', 'u.id']]
            ],
            [
                'table' => 'suppliers as sp',
                'on' => [['purchase_receipts.supplier_id', 'sp.id']]
            ],
        ];

        return $this->purchaseReceiptRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC'],
            $join
        );
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $payload = $request->only($this->payload());
            $payload['user_id'] = $request->input('user_id');
            $payload['created_by'] = $request->input('user_id');

            // Lấy items từ request
            $items = $request->input('product_variants', []);

            // Tính toán từ product_variants (nếu cần, nhưng có thể dùng journal_entries để tính)
            $calculation = $this->calculateTotals($items);

            $payload['total_amount'] = $calculation['total_amount'];
            $payload['vat_amount']   = $calculation['vat_amount'];
            $payload['grand_total']  = $calculation['grand_total'];

            // Tạo mã nếu không có code từ request
            if (empty($payload['code'])) {
                $payload['code'] = $this->generatePurchaseReceiptCode();
            }

            $receipt = $this->purchaseReceiptRepository->create($payload);

            // Lưu items
            $this->syncPurchaseReceiptItems($receipt, $calculation['items']);

            // Tạo journal entries từ dữ liệu gửi lên
            if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                $journalData = $this->prepareJournalData($request->input('journal_entries'));

                $this->journalEntryService->createFromRequest(
                    'purchase_receipt',
                    $receipt->id,
                    $journalData,
                    $receipt->receipt_date
                );
            }

            // Xử lý khi xác nhận - tăng tồn kho và tạo công nợ
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($receipt);
            }

            return $receipt;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {

            $receipt = $this->purchaseReceiptRepository->findByCondition(
                [['id', '=', $id]],
                false,
                [],
                [],
                ['*'],
                ['items']
            );

            if (!$receipt) {
                throw new \Exception('Phiếu nhập không tồn tại.');
            }

            if ($receipt->status === 'cancelled') {
                throw new \Exception('Phiếu đã hủy không thể chỉnh sửa.');
            }

            $newStatus = $request->input('status');

            /*
            |--------------------------------------------------------------------------
            | Nếu đang CONFIRMED
            |--------------------------------------------------------------------------
            */
            if ($receipt->status === 'confirmed') {

                // Chỉ cho phép hủy
                if ($newStatus === 'cancelled') {
                    $this->handleCancel($receipt);
                    $receipt->update(['status' => 'cancelled']);
                    return true;
                }

                throw new \Exception('Phiếu đã xác nhận không thể chỉnh sửa.');
            }

            /*
            |--------------------------------------------------------------------------
            | Nếu đang DRAFT
            |--------------------------------------------------------------------------
            */
            if ($receipt->status === 'draft') {

                $items = $request->input('product_variants', []);
                $calculation = $this->calculateTotals($items);

                $payload = $request->only($this->payload());
                $payload['user_id'] = $request->input('user_id');
                $payload['total_amount'] = $calculation['total_amount'];
                $payload['vat_amount']   = $calculation['vat_amount'];
                $payload['grand_total']  = $calculation['grand_total'];

                // Không cho phép sửa code khi update
                unset($payload['code']);

                $this->purchaseReceiptRepository->update($id, $payload);

                // Cập nhật items
                $this->syncPurchaseReceiptItems($receipt, $calculation['items']);

                // Cập nhật journal entries
                if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                    $journalData = $this->prepareJournalData($request->input('journal_entries'));

                    $this->journalEntryService->updateJournalByReference(
                        'purchase_receipt',
                        $receipt->id,
                        $journalData,
                        $receipt->receipt_date
                    );
                }

                // Nếu từ draft → confirmed
                if ($newStatus === 'confirmed') {
                    $receipt = $this->purchaseReceiptRepository->findById($id);
                    $this->handleConfirm($receipt);
                }

                return true;
            }

            return false;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $purchaseReceipt = $this->purchaseReceiptRepository->findById($id);

            if (!$purchaseReceipt) {
                throw new \Exception('Phiếu nhập không tồn tại.');
            }

            // Xóa journal entries
            $this->journalEntryService->deleteJournalByReference('purchase_receipt', $purchaseReceipt->id);

            // Xóa công nợ và giảm tồn kho nếu đã confirmed
            if ($purchaseReceipt->status === 'confirmed') {
                $this->supplierDebtService->deleteDebtByReference('purchase_receipt', $purchaseReceipt->id);

                // Giảm tồn kho khi xóa phiếu đã confirmed (hoàn nhập)
                $this->inventoryService->revertTransactions('purchase_receipt', $purchaseReceipt->id);
            }

            $purchaseReceipt->delete();

            return true;
        });
    }

    /**
     * Xử lý khi xác nhận phiếu nhập
     */
    private function handleConfirm($receipt)
    {
        // 1️⃣ Tăng tồn kho và ghi nhận giao dịch nhập kho với giá nhập
        $this->inventoryService->receiveStock(
            $receipt->items,
            'purchase_receipt',
            $receipt->id,
            Carbon::parse($receipt->receipt_date)
        );

        // 2️⃣ Tạo công nợ nhà cung cấp (dựa vào tổng tiền từ phiếu nhập)
        $this->supplierDebtService->createDebtForPurchaseReceipt($receipt);

        // 3️⃣ Xác nhận journal entries (nếu cần)
        $this->journalEntryService->confirmJournalByReference('purchase_receipt', $receipt->id);
    }

    /**
     * Xử lý khi hủy phiếu nhập
     */
    private function handleCancel($receipt)
    {
        // 1️⃣ Hoàn nhập giao dịch tồn kho
        $this->inventoryService->revertTransactions('purchase_receipt', $receipt->id);

        // 2️⃣ Xóa công nợ nhà cung cấp
        $this->supplierDebtService->deleteDebtByReference('purchase_receipt', $receipt->id);

        // 3️⃣ Xóa định khoản
        $this->journalEntryService->deleteJournalByReference('purchase_receipt', $receipt->id);
    }

    /**
     * Chuẩn bị dữ liệu journal entries từ request
     */
    private function prepareJournalData($journalEntries)
    {
        $formattedEntries = [];

        foreach ($journalEntries as $entry) {
            // Lấy account_id từ account_code
            $accountId = $this->getAccountIdByCode($entry['account_code']);

            if ($accountId) {
                $formattedEntries[] = [
                    'account_id' => $accountId,
                    'debit' => $entry['debit'],
                    'credit' => $entry['credit'],
                ];
            }
        }

        return [
            'entries' => $formattedEntries,
            'note' => request()->input('journal_note') ?? 'Bút toán từ phiếu nhập',
        ];
    }

    /**
     * Lấy account_id từ account_code
     */
    private function getAccountIdByCode($accountCode)
    {
        $account = DB::table('accounting_accounts')
            ->where('account_code', $accountCode)
            ->first();

        return $account ? $account->id : null;
    }

    private function syncPurchaseReceiptItems($purchaseReceipt, $items)
    {
        // Xóa items cũ
        $this->purchaseReceiptItemRepository->deleteByCondition([
            ['purchase_receipt_id', '=', $purchaseReceipt->id]
        ]);

        $insertData = [];

        foreach ($items as $item) {
            $insertData[] = [
                'purchase_receipt_id' => $purchaseReceipt->id,
                'product_variant_id'  => $item['product_variant_id'],
                'quantity'            => $item['quantity'],
                'price'               => $item['price'],
                'input_tax_id'        => $item['vat_id'] ?? null,
                'vat_amount'          => $item['vat_amount'] ?? 0,
                'subtotal'            => $item['subtotal'] ?? ($item['quantity'] * $item['price']),
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        if (!empty($insertData)) {
            $this->purchaseReceiptItemRepository->create($insertData);
        }
    }

    public function getPurchaseReceiptDetail($id)
    {
        $purchaseReceipt = $this->purchaseReceiptRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            [
                'supplier',
                'items.productVariant',
                'items.productVariant.unit',
                'journalEntries' => function ($query) {
                    $query->with(['details.account']);
                },
                'supplierDebts'
            ]
        );

        if (!$purchaseReceipt) {
            return null;
        }

        // Lấy ngôn ngữ hiện tại
        $currentLanguageId = session('currentLanguage', 1);

        // Format thông tin supplier
        $purchaseReceipt->supplier_info = [
            'id'            => $purchaseReceipt->supplier?->id,
            'supplier_code' => $purchaseReceipt->supplier?->supplier_code,
            'name'          => $purchaseReceipt->supplier?->name,
            'tax_code'      => $purchaseReceipt->supplier?->tax_code,
            'phone'         => $purchaseReceipt->supplier?->phone,
            'email'         => $purchaseReceipt->supplier?->email,
            'address'       => $purchaseReceipt->supplier?->address,
        ];

        /*
        |--------------------------------------------------------------------------
        | Format sản phẩm
        |--------------------------------------------------------------------------
        */
        $purchaseReceipt->product_variants = $purchaseReceipt->items->isNotEmpty()
            ? $purchaseReceipt->items->map(function ($item) use ($currentLanguageId) {
                // Lấy tên product variant
                $productName = $this->productVariantService->getProductNameByVariant(
                    $item->product_variant_id,
                    $currentLanguageId
                );

                // Lấy tên variant theo ngôn ngữ
                $variantName = '';
                if ($item->productVariant) {
                    $variantTranslation = $item->productVariant->languages
                        ->firstWhere('id', $currentLanguageId);
                    $variantName = $variantTranslation?->pivot?->name ?? '';
                }

                $fullName = $productName . ($variantName ? ' - ' . $variantName : '');

                // Lấy đơn vị tính
                $unit = $item->productVariant?->unit;

                return [
                    'product_variant_id' => $item->product_variant_id,
                    'barcode'            => $item->productVariant?->barcode,
                    'name'               => $fullName,
                    'sku'                => $item->productVariant?->sku,
                    'quantity'           => $item->quantity,
                    'price'              => $item->price,
                    'vat_amount'         => $item->vat_amount,
                    'subtotal'           => $item->subtotal,
                    'unit' => $unit ? [
                        'id'        => $unit->id,
                        'code'      => $unit->unit_code ?? $unit->code ?? null,
                        'name'      => $unit->name ?? null,
                    ] : null,
                ];
            })->values()->toArray()
            : [];

        /*
        |--------------------------------------------------------------------------
        | Format journal entries - Hiển thị theo account_code
        |--------------------------------------------------------------------------
        */
        $purchaseReceipt->journal_entries = $purchaseReceipt->journalEntries->isNotEmpty()
            ? $purchaseReceipt->journalEntries->map(function ($journal) {
                return [
                    'id'          => $journal->id,
                    'code'        => $journal->code,
                    'entry_date'  => $journal->entry_date,
                    'note'        => $journal->note,
                    'created_by'  => $journal->created_by,
                    'details'     => $journal->details->map(function ($detail) {
                        return [
                            'account_code' => $detail->account?->account_code,
                            'debit'        => $detail->debit,
                            'credit'       => $detail->credit,
                        ];
                    })->values()->toArray()
                ];
            })->values()->toArray()
            : [];

        /*
        |--------------------------------------------------------------------------
        | Format công nợ
        |--------------------------------------------------------------------------
        */
        $totalDebit = 0;
        $totalCredit = 0;

        if ($purchaseReceipt->supplierDebts->isNotEmpty()) {
            foreach ($purchaseReceipt->supplierDebts as $debt) {
                $totalDebit += $debt->debit ?? 0;
                $totalCredit += $debt->credit ?? 0;
            }
        }

        $purchaseReceipt->debt = [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalCredit - $totalDebit, // Công nợ phải trả = credit - debit
            'details'      => $purchaseReceipt->supplierDebts->isNotEmpty()
                ? $purchaseReceipt->supplierDebts->map(function ($debt) {
                    return [
                        'id'               => $debt->id,
                        'transaction_date' => $debt->transaction_date,
                        'debit'            => $debt->debit,
                        'credit'           => $debt->credit,
                        'reference_type'   => $debt->reference_type,
                        'reference_id'     => $debt->reference_id,
                    ];
                })->values()->toArray()
                : []
        ];

        // Thêm thông tin tổng hợp
        $purchaseReceipt->summary = [
            'total_quantity' => $purchaseReceipt->items->sum('quantity'),
            'total_items'    => $purchaseReceipt->items->count(),
            'created_by_name' => $purchaseReceipt->created_by ? optional($purchaseReceipt->user)->name : null,
        ];

        // Cleanup
        unset($purchaseReceipt->items);
        unset($purchaseReceipt->journalEntries);
        unset($purchaseReceipt->supplierDebts);
        unset($purchaseReceipt->supplier);
        unset($purchaseReceipt->user);

        return $purchaseReceipt;
    }

    private function calculateTotals($items)
    {
        $totalAmount = 0;
        $totalVat = 0;
        $formattedItems = [];

        foreach ($items as $item) {
            $subtotal = $item['quantity'] * $item['price'];

            // Tính VAT nếu có
            $vatAmount = $item['vat_amount'] ?? 0;

            // Nếu không có vat_amount trong item, tính từ vat_id
            if ($vatAmount == 0 && isset($item['vat_id'])) {
                $vatTax = $this->vatTaxRepository->findById($item['vat_id']);
                $vatRate = $vatTax->rate ?? 0;
                $vatAmount = ($subtotal * $vatRate) / 100;
            }

            $totalAmount += $subtotal;
            $totalVat += $vatAmount;

            $formattedItems[] = [
                'product_variant_id' => $item['product_variant_id'],
                'quantity'           => $item['quantity'],
                'price'              => $item['price'],
                'vat_id'             => $item['vat_id'] ?? null,
                'vat_amount'         => $vatAmount,
                'subtotal'           => $subtotal, // Tổng tiền hàng chưa VAT
            ];
        }

        return [
            'items'        => $formattedItems,
            'total_amount' => $totalAmount,
            'vat_amount'   => $totalVat,
            'grand_total'  => $totalAmount + $totalVat,
        ];
    }

    /**
     * Tự động generate mã phiếu nhập kho duy nhất
     */
    private function generatePurchaseReceiptCode()
    {
        do {
            $code = 'PNK_' . now()->format('Ymd_His');
            $exists = $this->purchaseReceiptRepository->findByCondition(
                [['code', '=', $code]],
                false
            );
            if ($exists) {
                sleep(1);
                now()->refresh();
            }
        } while ($exists);

        return $code;
    }

    private function paginateSelect()
    {
        return [
            'purchase_receipts.id',
            'purchase_receipts.code',
            'purchase_receipts.note',
            'receipt_date',
            'u.id as user_id',
            'u.name as user_name',
            'sp.name as supplier_name',
            'purchase_receipts.status',
            'purchase_receipts.grand_total',
        ];
    }

    private function payload()
    {
        return [
            'code',
            'receipt_date',
            'supplier_id',
            'total_amount',
            'vat_amount',
            'grand_total',
            'status',
            'note',
        ];
    }
}