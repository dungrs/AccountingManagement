<?php

namespace App\Services\Receipt;

use App\Repositories\Receipt\SalesReceiptItemRepository;
use App\Repositories\Receipt\SalesReceiptRepository;
use App\Repositories\VatTaxRepository;
use App\Services\BaseService;
use App\Services\Debt\CustomerDebtService;
use App\Services\Interfaces\Receipt\SalesReceiptServiceInterface;
use App\Services\JournalEntryService;
use App\Services\Product\ProductVariantService;
use Illuminate\Support\Facades\DB;

class SalesReceiptService extends BaseService implements SalesReceiptServiceInterface
{
    protected $salesReceiptRepository;
    protected $salesReceiptItemRepository;
    protected $vatTaxRepository;
    protected $journalEntryService;
    protected $customerDebtService;
    protected $productVariantService;

    public function __construct(
        SalesReceiptRepository $salesReceiptRepository,
        SalesReceiptItemRepository $salesReceiptItemRepository,
        VatTaxRepository $vatTaxRepository,
        JournalEntryService $journalEntryService,
        CustomerDebtService $customerDebtService,
        ProductVariantService $productVariantService
    ) {
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->salesReceiptItemRepository = $salesReceiptItemRepository;
        $this->vatTaxRepository = $vatTaxRepository;
        $this->journalEntryService = $journalEntryService;
        $this->customerDebtService = $customerDebtService;
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
            'path' => '/receipt/sales/index',
            'fieldSearch' => ['code', 'u.name', 'c.name'], // Sửa từ customer_name thành c.name
        ];

        $join = [
            [
                'table' => 'users as u',
                'on' => [['sales_receipts.user_id', 'u.id']]
            ],
            [
                'table' => 'customers as c',
                'on' => [['sales_receipts.customer_id', 'c.id']]
            ],
            [
                'table' => 'price_lists as pl',
                'on' => [['sales_receipts.price_list_id', 'pl.id']],
                'type' => 'left'
            ],
        ];

        return $this->salesReceiptRepository->paginate(
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

            // Tính toán từ product_variants
            $items = $request->input('product_variants', []);
            $calculation = $this->calculateTotals($items);

            $payload['total_amount'] = $calculation['total_amount'];
            $payload['vat_amount']   = $calculation['vat_amount'];
            $payload['grand_total']  = $calculation['grand_total'];

            // Tạo mã nếu không có code từ request
            if (empty($payload['code'])) {
                $payload['code'] = $this->generateSalesReceiptCode();
            }

            $receipt = $this->salesReceiptRepository->create($payload);

            // Lưu items
            $this->syncSalesReceiptItems($receipt, $calculation['items']);

            // Tạo journal entries cho cả draft và confirmed
            if ($request->has('journal_entries')) {
                $this->journalEntryService->createFromRequest(
                    'sales_receipt',
                    $receipt->id,
                    $request->input('journal_entries'),
                    $receipt->receipt_date
                );
            }

            // Xử lý khi xác nhận - chỉ tạo công nợ và giảm tồn kho
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($receipt);
            }

            return $receipt;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {

            $receipt = $this->salesReceiptRepository->findByCondition(
                [['id', '=', $id]],
                false,
                [],
                [],
                ['*'],
                ['items']
            );

            if (!$receipt) {
                throw new \Exception('Phiếu xuất không tồn tại.');
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

                $this->salesReceiptRepository->update($id, $payload);

                // Cập nhật items
                $this->syncSalesReceiptItems($receipt, $calculation['items']);

                // Cập nhật journal entries
                if ($request->has('journal_entries')) {
                    $this->journalEntryService->updateJournalByReference(
                        'sales_receipt',
                        $receipt->id,
                        $request->input('journal_entries'),
                        $receipt->receipt_date
                    );
                }

                // Nếu từ draft → confirmed
                if ($newStatus === 'confirmed') {
                    $receipt = $this->salesReceiptRepository->findById($id);
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

            $salesReceipt = $this->salesReceiptRepository->findById($id);

            if (!$salesReceipt) {
                throw new \Exception('Phiếu xuất không tồn tại.');
            }

            // Xóa journal entries (cho cả draft và confirmed)
            $this->journalEntryService->deleteJournalByReference('sales_receipt', $salesReceipt->id);

            // Xóa công nợ và tăng lại tồn kho nếu đã confirmed
            if ($salesReceipt->status === 'confirmed') {
                $this->customerDebtService->deleteDebtByReference('sales_receipt', $salesReceipt->id);

                // Tăng lại tồn kho khi xóa phiếu đã confirmed (hoàn nhập)
                $this->productVariantService->increaseStock($salesReceipt->items);
            }

            $salesReceipt->delete();

            return true;
        });
    }

    private function handleConfirm($receipt)
    {
        // 1️⃣ Giảm tồn kho (xuất kho)
        $this->productVariantService->decreaseStock($receipt->items);

        // 2️⃣ Tạo công nợ khách hàng
        $this->customerDebtService->createDebtForSalesReceipt($receipt);

        // 3️⃣ Xác nhận journal entries (nếu cần)
        $this->journalEntryService->confirmJournalByReference('sales_receipt', $receipt->id);
    }

    private function handleCancel($receipt)
    {
        // 1️⃣ Tăng lại tồn kho (nhập lại kho)
        $this->productVariantService->increaseStock($receipt->items);

        // 2️⃣ Xoá công nợ khách hàng
        $this->customerDebtService->deleteDebtByReference('sales_receipt', $receipt->id);

        // 3️⃣ Xoá định khoản
        $this->journalEntryService->deleteJournalByReference('sales_receipt', $receipt->id);
    }

    private function syncSalesReceiptItems($salesReceipt, $items)
    {
        // Xóa items cũ
        $this->salesReceiptItemRepository->deleteByCondition([
            ['sales_receipt_id', '=', $salesReceipt->id]
        ]);

        $insertData = [];

        foreach ($items as $item) {
            $insertData[] = [
                'sales_receipt_id'    => $salesReceipt->id,
                'product_variant_id'  => $item['product_variant_id'],
                'quantity'            => $item['quantity'],
                'price'               => $item['price'],
                'discount_amount'     => $item['discount_amount'] ?? 0,
                'discount_percent'    => $item['discount_percent'] ?? 0,
                'output_tax_id'       => $item['vat_id'],
                'vat_amount'          => $item['vat_amount'],
                'subtotal'            => $item['subtotal'],
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        $this->salesReceiptItemRepository->create($insertData);
    }

    public function getSalesReceiptDetail($id)
    {
        $salesReceipt = $this->salesReceiptRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            [
                'customer',
                'priceList',
                'items.productVariant',
                'items.productVariant.unit',
                'items.outputTax',
                'journalEntries' => function ($query) {
                    $query->with(['details.account']);
                },
                'customerDebts'
            ]
        );

        if (!$salesReceipt) {
            return null;
        }

        // Lấy ngôn ngữ hiện tại
        $currentLanguageId = session('currentLanguage', 1);

        // Format thông tin customer - LOẠI BỎ customer_code
        $salesReceipt->customer_info = [
            'customer_id'   => $salesReceipt->customer?->id,
            'name'          => $salesReceipt->customer?->name,
            'tax_code'      => $salesReceipt->customer?->tax_code ?? null,
            'phone'         => $salesReceipt->customer?->phone,
            'email'         => $salesReceipt->customer?->email,
            'address'       => $salesReceipt->customer?->address,
        ];

        // Format thông tin bảng giá
        $salesReceipt->price_list_info = $salesReceipt->priceList ? [
            'id'          => $salesReceipt->priceList->id,
            'name'        => $salesReceipt->priceList->name,
            'start_date'  => $salesReceipt->priceList->start_date,
            'end_date'    => $salesReceipt->priceList->end_date,
        ] : null;

        /*
        |--------------------------------------------------------------------------
        | Format sản phẩm
        |--------------------------------------------------------------------------
        */
        $salesReceipt->product_variants = $salesReceipt->items->isNotEmpty()
            ? $salesReceipt->items->map(function ($item) use ($currentLanguageId) {
                // Lấy tên product variant bằng repository
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

                // Tính các giá trị
                $amount = $item->quantity * $item->price;
                $discountAmount = $item->discount_amount ?? 0;
                $afterDiscount = $amount - $discountAmount;

                return [
                    'product_variant_id' => $item->product_variant_id,
                    'barcode'            => $item->productVariant?->barcode,
                    'name'               => $fullName,
                    'sku'                => $item->productVariant?->sku,
                    'quantity'           => $item->quantity,
                    'price'              => $item->price,
                    'vat_amount'         => $item->vat_amount,
                    'subtotal'           => $item->subtotal,
                    'amount'             => $amount,
                    'after_discount'     => $afterDiscount,
                    'vat_info'           => $item->outputTax ? [
                        'id'   => $item->outputTax->id,
                        'name' => $item->outputTax->name,
                        'rate' => $item->outputTax->rate,
                    ] : null,
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
        | Format journal entries
        |--------------------------------------------------------------------------
        */
        $salesReceipt->journal_entries = $salesReceipt->journalEntries->isNotEmpty()
            ? $salesReceipt->journalEntries->map(function ($journal) {
                return [
                    'id'          => $journal->id,
                    'code'        => $journal->code,
                    'entry_date'  => $journal->entry_date,
                    'note'        => $journal->note,
                    'created_by'  => $journal->created_by,
                    'details'     => $journal->details->map(function ($detail) {
                        return [
                            'account_code' => $detail->account?->account_code,
                            'account_name' => $detail->account?->name,
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

        if ($salesReceipt->customerDebts->isNotEmpty()) {
            foreach ($salesReceipt->customerDebts as $debt) {
                $totalDebit += $debt->debit ?? 0;
                $totalCredit += $debt->credit ?? 0;
            }
        }

        $salesReceipt->debt = [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalDebit - $totalCredit,
            'details'      => $salesReceipt->customerDebts->isNotEmpty()
                ? $salesReceipt->customerDebts->map(function ($debt) {
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
        $salesReceipt->summary = [
            'total_quantity' => $salesReceipt->items->sum('quantity'),
            'total_items'    => $salesReceipt->items->count(),
            'total_discount' => $salesReceipt->items->sum('discount_amount'),
            'created_by_name' => $salesReceipt->created_by ? optional($salesReceipt->user)->name : null,
        ];

        // Cleanup - xóa các relation không cần thiết khỏi response
        unset($salesReceipt->items);
        unset($salesReceipt->journalEntries);
        unset($salesReceipt->customerDebts);
        unset($salesReceipt->customer);
        unset($salesReceipt->priceList);
        unset($salesReceipt->user);

        return $salesReceipt;
    }

    private function calculateTotals($items)
    {
        $totalAmount = 0;
        $totalVat = 0;
        $formattedItems = [];

        foreach ($items as $item) {
            $subtotal = $item['quantity'] * $item['price'];

            // Tính chiết khấu nếu có
            $discountAmount = $item['discount_amount'] ?? 0;
            $afterDiscount = $subtotal - $discountAmount;

            // Lấy rate từ VatTaxRepository
            $vatTax = $this->vatTaxRepository->findById($item['vat_id']);
            $vatRate = $vatTax->rate ?? 0;

            $vatAmount = ($afterDiscount * $vatRate) / 100;

            $totalAmount += $afterDiscount;
            $totalVat += $vatAmount;

            $formattedItems[] = [
                'product_variant_id' => $item['product_variant_id'],
                'quantity'           => $item['quantity'],
                'price'              => $item['price'],
                'vat_id'             => $item['vat_id'],
                'vat_amount'         => $vatAmount,
                'subtotal'           => $afterDiscount + $vatAmount,
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
     * Tự động generate mã phiếu xuất kho duy nhất
     * Format: PXK_YYYYMMDD_HHMMSS (dựa trên thời gian hiện tại)
     */
    private function generateSalesReceiptCode()
    {
        do {
            // Tạo mã dựa trên thời gian: PXK_YYYYMMDD_HHMMSS
            $code = 'PXK_' . now()->format('Ymd_His');

            // Kiểm tra xem mã đã tồn tại chưa
            $exists = $this->salesReceiptRepository->findByCondition(
                [['code', '=', $code]],
                false
            );

            // Nếu đã tồn tại, chờ 1 giây để tạo mã mới
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
            'sales_receipts.id',
            'sales_receipts.code',
            'sales_receipts.note',
            'receipt_date',
            'u.id as user_id',
            'u.name as user_name',
            'c.name as customer_name', // Giữ lại customer_name nhưng là từ bảng customers
            'sales_receipts.status',
            'sales_receipts.grand_total',
        ];
    }

    private function payload()
    {
        return [
            'code',
            'receipt_date',
            'customer_id',
            'user_id',
            'price_list_id',
            'total_amount',
            'vat_amount',
            'grand_total',
            'status',
            'note',
        ];
    }
}