<?php

namespace App\Services\Receipt;

use App\Repositories\Receipt\PurchaseReceiptItemRepository;
use App\Repositories\Receipt\PurchaseReceiptRepository;
use App\Repositories\VatTaxRepository;
use App\Services\BaseService;
use App\Services\Debt\SupplierDebtService;
use App\Services\Interfaces\Receipt\PurchaseReceiptServiceInterface;
use App\Services\JournalEntryService;
use App\Services\Product\ProductVariantService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurchaseReceiptService extends BaseService implements PurchaseReceiptServiceInterface
{
    protected $purchaseReceiptRepository;
    protected $purchaseReceiptItemRepository;
    protected $vatTaxRepository;
    protected $journalEntryService;
    protected $supplierDebtService;
    protected $productVariantService;

    public function __construct(
        PurchaseReceiptRepository $purchaseReceiptRepository,
        PurchaseReceiptItemRepository $purchaseReceiptItemRepository,
        VatTaxRepository $vatTaxRepository,
        JournalEntryService $journalEntryService,
        SupplierDebtService $supplierDebtService,
        ProductVariantService $productVariantService
    ) {
        $this->purchaseReceiptRepository = $purchaseReceiptRepository;
        $this->purchaseReceiptItemRepository = $purchaseReceiptItemRepository;
        $this->vatTaxRepository = $vatTaxRepository;
        $this->journalEntryService = $journalEntryService;
        $this->supplierDebtService = $supplierDebtService;
        $this->productVariantService = $productVariantService;
    }

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
        ];

        $extend = [
            'path' => '/purchase-receipt/index',
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

            $items = $request->input('product_variants', []);

            $calculation = $this->calculateTotals($items);

            $payload = $request->only($this->payload());
            $payload['user_id'] = $request->input('user_id');
            $payload['created_by'] = Auth::id();
            $payload['total_amount'] = $calculation['total_amount'];
            $payload['vat_amount']   = $calculation['vat_amount'];
            $payload['grand_total']  = $calculation['grand_total'];

            if (empty($payload['code'])) {
                $payload['code'] = $this->generatePurchaseReceiptCode();
            }

            $receipt = $this->purchaseReceiptRepository->create($payload);

            $this->syncPurchaseReceiptItems($receipt, $calculation['items']);

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
                $payload['user_id'] = Auth::id();
                $payload['total_amount'] = $calculation['total_amount'];
                $payload['vat_amount']   = $calculation['vat_amount'];
                $payload['grand_total']  = $calculation['grand_total'];

                $this->purchaseReceiptRepository->update($id, $payload);

                $this->syncPurchaseReceiptItems($receipt, $calculation['items']);

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

            $purchaseReceipt->delete();

            return true;
        });
    }

    private function handleConfirm($receipt)
    {
        // 1️⃣ Tăng tồn kho
        $this->productVariantService->increaseStock($receipt->items);

        // 2️⃣ Tạo công nợ
        $this->supplierDebtService->createDebtForPurchaseReceipt($receipt);

        // 3️⃣ Tạo định khoản
        $this->journalEntryService->createPurchaseReceiptJournal($receipt);
    }

    private function handleCancel($receipt)
    {
        // 1️⃣ Trừ tồn kho
        $this->productVariantService->decreaseStock($receipt->items);

        // 2️⃣ Xoá công nợ
        $this->supplierDebtService->deleteDebtByReference('purchase_receipt', $receipt->id);

        // 3️⃣ Xoá định khoản
        $this->journalEntryService->deleteJournalByReference('purchase_receipt', $receipt->id);
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
                'input_tax_id'        => $item['vat_id'],
                'vat_amount'          => $item['vat_amount'],
                'subtotal'            => $item['subtotal'],
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        $this->purchaseReceiptItemRepository->create($insertData);
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
                'items.productVariant.products.languages',
                'items.productVariant.languages',
                'items.productVariant.unit', // ✅ thêm unit
                'journalEntries.details.account.languages',
                'supplierDebts'
            ]
        );

        if (!$purchaseReceipt) {
            return null;
        }

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
        $purchaseReceipt->product_variants = $purchaseReceipt->items->map(function ($item) {

            // Lấy tên product
            $productName = $item->productVariant?->products?->languages->first()?->pivot->name ?? '';

            // Lấy tên variant
            $variantName = $item->productVariant?->languages->first()?->pivot->name ?? '';

            // Ghép tên theo format: "Product Name - Variant Name"
            $fullName = trim($productName);
            if ($variantName) {
                $fullName .= ($fullName ? ' - ' : '') . $variantName;
            }

            // ✅ Lấy đơn vị tính
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

                // ✅ thêm thông tin đơn vị tính
                'unit' => $unit ? [
                    'id'        => $unit->id,
                    'code' => $unit->unit_code ?? null,
                    'name'      => $unit->name ?? null,
                ] : null,
            ];
        });

        /*
        |--------------------------------------------------------------------------
        | Format định khoản (gom Nợ/Có)
        |--------------------------------------------------------------------------
        */
        $accounting = [];

        foreach ($purchaseReceipt->journalEntries as $journal) {
            foreach ($journal->details as $detail) {
                $accountName = optional($detail->account->languages->first())->pivot->name ?? null;

                $accounting[] = [
                    'account_id'   => $detail->account?->id,
                    'account_code' => $detail->account?->account_code,
                    'account_name' => $accountName,
                    'debit'        => $detail->debit ?? 0,
                    'credit'       => $detail->credit ?? 0,
                ];
            }
        }

        $purchaseReceipt->accounting = $accounting;

        /*
    |--------------------------------------------------------------------------
    | Format công nợ
    |--------------------------------------------------------------------------
    */
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($purchaseReceipt->supplierDebts as $debt) {
            $totalDebit += $debt->debit ?? 0;
            $totalCredit += $debt->credit ?? 0;
        }

        $purchaseReceipt->debt = [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalDebit - $totalCredit,
        ];

        // Cleanup
        unset($purchaseReceipt->items);
        unset($purchaseReceipt->journalEntries);
        unset($purchaseReceipt->supplierDebts);
        unset($purchaseReceipt->supplier);

        return $purchaseReceipt;
    }

    private function calculateTotals($items)
    {
        $totalAmount = 0;
        $totalVat = 0;
        $formattedItems = [];

        foreach ($items as $item) {

            $subtotal = $item['quantity'] * $item['price'];

            // Lấy rate từ VatTaxRepository
            $vatTax = $this->vatTaxRepository->findById($item['vat_id']);
            $vatRate = $vatTax->rate ?? 0;

            $vatAmount = ($subtotal * $vatRate) / 100;

            $totalAmount += $subtotal;
            $totalVat += $vatAmount;

            $formattedItems[] = [
                'product_variant_id' => $item['product_variant_id'],
                'quantity'           => $item['quantity'],
                'price'              => $item['price'],
                'vat_id'             => $item['vat_id'],
                'vat_amount'         => $vatAmount,
                'subtotal'           => $subtotal,
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
     * Tự động generate mã phiếu nhập kho
     * Format: PNK_001, PNK_002, ...
     */
    private function generatePurchaseReceiptCode()
    {
        $latest = $this->purchaseReceiptRepository->findLastest();

        if (!$latest) {
            return 'PNK_001';
        }

        $latestCode = $latest->code;
        preg_match('/(\d+)/', $latestCode, $matches);

        $number = isset($matches[1]) ? (int)$matches[1] + 1 : 1;

        return 'PNK_' . str_pad($number, 3, '0', STR_PAD_LEFT);
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
