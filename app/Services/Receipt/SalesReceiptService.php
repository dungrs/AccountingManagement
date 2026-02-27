<?php

namespace App\Services\Receipt;

use App\Repositories\Receipt\SalesReceiptItemRepository;
use App\Repositories\Receipt\SalesReceiptRepository;
use App\Repositories\VatTaxRepository;
use App\Services\BaseService;
use App\Services\Debt\CustomerDebtService;
use App\Services\Interfaces\Receipt\SalesReceiptServiceInterface;
use App\Services\Inventory\InventoryService;
use App\Services\JournalEntryService;
use App\Services\Product\ProductVariantService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesReceiptService extends BaseService implements SalesReceiptServiceInterface
{
    protected $salesReceiptRepository;
    protected $salesReceiptItemRepository;
    protected $vatTaxRepository;
    protected $journalEntryService;
    protected $customerDebtService;
    protected $productVariantService;
    protected $inventoryService;

    // Tài khoản kế toán
    const ACCOUNT_COST_OF_GOODS_SOLD = '632'; // Giá vốn hàng bán
    const ACCOUNT_INVENTORY = '156'; // Hàng hóa
    const ACCOUNT_VAT_OUTPUT = '3331'; // Thuế VAT đầu ra
    const ACCOUNT_RECEIVABLE = '131'; // Phải thu khách hàng
    const ACCOUNT_REVENUE = '511'; // Doanh thu bán hàng

    public function __construct(
        SalesReceiptRepository $salesReceiptRepository,
        SalesReceiptItemRepository $salesReceiptItemRepository,
        VatTaxRepository $vatTaxRepository,
        JournalEntryService $journalEntryService,
        CustomerDebtService $customerDebtService,
        ProductVariantService $productVariantService,
        InventoryService $inventoryService
    ) {
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->salesReceiptItemRepository = $salesReceiptItemRepository;
        $this->vatTaxRepository = $vatTaxRepository;
        $this->journalEntryService = $journalEntryService;
        $this->customerDebtService = $customerDebtService;
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
            'path' => '/receipt/sales/index',
            'fieldSearch' => ['code', 'u.name', 'c.name'],
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

            // Lấy items từ request
            $items = $request->input('product_variants', []);

            // Tính toán từ product_variants (bao gồm chiết khấu)
            $calculation = $this->calculateTotals($items);

            $payload['total_amount'] = $calculation['total_amount'];
            $payload['vat_amount']   = $calculation['vat_amount'];
            $payload['grand_total']  = $calculation['grand_total'];

            // THÊM: Gán các giá trị chiết khấu từ calculation
            $payload['discount_type'] = $request->input('discount_type');
            $payload['discount_value'] = $request->input('discount_value', 0);
            $payload['discount_amount'] = $calculation['total_discount'] ?? 0;
            $payload['discount_total'] = $calculation['total_discount'] ?? 0;
            $payload['discount_note'] = $request->input('discount_note');

            // Tạo mã nếu không có code từ request
            if (empty($payload['code'])) {
                $payload['code'] = $this->generateSalesReceiptCode();
            }

            $receipt = $this->salesReceiptRepository->create($payload);

            // Lưu items
            $this->syncSalesReceiptItems($receipt, $calculation['items']);

            // Tạo journal entries từ dữ liệu gửi lên
            if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                $journalData = $this->prepareJournalData($request->input('journal_entries'));

                $this->journalEntryService->createFromRequest(
                    'sales_receipt',
                    $receipt->id,
                    $journalData,
                    $receipt->receipt_date
                );
            }

            // Xử lý khi xác nhận - giảm tồn kho, tạo công nợ và tạo bút toán giá vốn
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

                // THÊM: Cập nhật các giá trị chiết khấu
                $payload['discount_type'] = $request->input('discount_type');
                $payload['discount_value'] = $request->input('discount_value', 0);
                $payload['discount_amount'] = $calculation['total_discount'] ?? 0;
                $payload['discount_total'] = $calculation['total_discount'] ?? 0;
                $payload['discount_note'] = $request->input('discount_note');

                // Không cho phép sửa code khi update
                unset($payload['code']);

                $this->salesReceiptRepository->update($id, $payload);

                // Cập nhật items
                $this->syncSalesReceiptItems($receipt, $calculation['items']);

                // Cập nhật journal entries
                if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                    $journalData = $this->prepareJournalData($request->input('journal_entries'));

                    $this->journalEntryService->updateJournalByReference(
                        'sales_receipt',
                        $receipt->id,
                        $journalData,
                        $receipt->receipt_date
                    );
                } else {
                    // Nếu không có journal entries, xóa định khoản cũ
                    $this->journalEntryService->deleteJournalByReference('sales_receipt', $receipt->id);
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

            // Xóa journal entries
            $this->journalEntryService->deleteJournalByReference('sales_receipt', $salesReceipt->id);
            $this->journalEntryService->deleteJournalByReference('sales_receipt_cogs', $salesReceipt->id);

            // Xóa công nợ và tăng lại tồn kho nếu đã confirmed
            if ($salesReceipt->status === 'confirmed') {
                $this->customerDebtService->deleteDebtByReference('sales_receipt', $salesReceipt->id);

                // Hoàn nhập giao dịch tồn kho
                $this->inventoryService->revertTransactions('sales_receipt', $salesReceipt->id);
            }

            $salesReceipt->delete();

            return true;
        });
    }

    /**
     * Xử lý khi xác nhận phiếu xuất
     */
    private function handleConfirm($receipt)
    {
        // 1️⃣ Tính giá vốn và giảm tồn kho (xuất kho)
        $cogsDetails = $this->inventoryService->issueStock(
            $receipt->items,
            'sales_receipt',
            $receipt->id,
            Carbon::parse($receipt->receipt_date)
        );

        // 2️⃣ Tạo bút toán giá vốn
        if (!empty($cogsDetails)) {
            $this->createCostOfGoodsSoldJournal($receipt, $cogsDetails);
        }

        // 3️⃣ Tạo công nợ khách hàng
        $this->customerDebtService->createDebtForSalesReceipt($receipt);

        // 4️⃣ Xác nhận journal entries
        $this->journalEntryService->confirmJournalByReference('sales_receipt', $receipt->id);
    }

    /**
     * Xử lý khi hủy phiếu xuất
     */
    private function handleCancel($receipt)
    {
        // 1️⃣ Hoàn nhập giao dịch tồn kho
        $this->inventoryService->revertTransactions('sales_receipt', $receipt->id);

        // 2️⃣ Xóa bút toán giá vốn
        $this->journalEntryService->deleteJournalByReference('sales_receipt_cogs', $receipt->id);

        // 3️⃣ Xóa công nợ khách hàng
        $this->customerDebtService->deleteDebtByReference('sales_receipt', $receipt->id);

        // 4️⃣ Xóa định khoản doanh thu (nếu có)
        $this->journalEntryService->deleteJournalByReference('sales_receipt', $receipt->id);
    }

    /**
     * Tạo bút toán giá vốn hàng bán
     * Nợ 632 / Có 156
     */
    private function createCostOfGoodsSoldJournal($receipt, $cogsDetails)
    {
        $totalCogs = collect($cogsDetails)->sum('cogs');

        if ($totalCogs <= 0) {
            return;
        }

        $journalEntries = [
            'entries' => [
                [
                    'account_code' => self::ACCOUNT_COST_OF_GOODS_SOLD,
                    'debit' => $totalCogs,
                    'credit' => 0,
                ],
                [
                    'account_code' => self::ACCOUNT_INVENTORY,
                    'debit' => 0,
                    'credit' => $totalCogs,
                ],
            ],
            'note' => 'Giá vốn hàng bán cho phiếu xuất ' . $receipt->code,
        ];

        try {
            $this->journalEntryService->createFromRequest(
                'sales_receipt_cogs',
                $receipt->id,
                $journalEntries,
                $receipt->receipt_date
            );
        } catch (\Exception $e) {
            Log::error('Lỗi tạo bút toán giá vốn: ' . $e->getMessage());
            // Không throw exception để tránh ảnh hưởng đến luồng chính
        }
    }

    /**
     * Chuẩn bị dữ liệu journal entries từ request
     */
    private function prepareJournalData($journalEntries)
    {
        // Nếu journalEntries đã có cấu trúc {entries: [...], note: '...'}
        if (isset($journalEntries['entries']) && is_array($journalEntries['entries'])) {
            return $journalEntries;
        }

        // Nếu journalEntries là mảng các entry đơn thuần
        if (is_array($journalEntries) && !isset($journalEntries['entries'])) {
            return [
                'entries' => $journalEntries,
                'note' => request()->input('journal_note') ?? 'Bút toán từ phiếu xuất',
            ];
        }

        return $journalEntries;
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
                'output_tax_id'       => $item['vat_id'] ?? null,
                'vat_amount'          => $item['vat_amount'] ?? 0,
                'subtotal'            => $item['subtotal'] ?? ($item['quantity'] * $item['price'] - ($item['discount_amount'] ?? 0)),
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        if (!empty($insertData)) {
            $this->salesReceiptItemRepository->create($insertData);
        }
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

        // Format thông tin customer
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
                    'discount_amount'    => $discountAmount,
                    'discount_percent'   => $item->discount_percent ?? 0,
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
        | Format journal entries - Hiển thị theo account_code
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
                            'debit'        => (float)$detail->debit,
                            'credit'       => (float)$detail->credit,
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
            'balance'      => $totalDebit - $totalCredit, // Công nợ phải thu = debit - credit
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

        // THÊM: Thông tin chiết khấu
        $salesReceipt->discount_info = [
            'discount_type' => $salesReceipt->discount_type,
            'discount_value' => $salesReceipt->discount_value,
            'discount_amount' => $salesReceipt->discount_amount,
            'discount_total' => $salesReceipt->discount_total,
            'discount_note' => $salesReceipt->discount_note,
            'discount_text' => $this->getDiscountText($salesReceipt),
        ];

        // Thêm thông tin tổng hợp
        $salesReceipt->summary = [
            'total_quantity' => $salesReceipt->items->sum('quantity'),
            'total_items'    => $salesReceipt->items->count(),
            'total_discount' => $salesReceipt->items->sum('discount_amount'),
            'total_discount_receipt' => $salesReceipt->discount_amount ?? 0,
            'created_by_name' => $salesReceipt->created_by ? optional($salesReceipt->user)->name : null,
        ];

        // Cleanup
        unset($salesReceipt->items);
        unset($salesReceipt->journalEntries);
        unset($salesReceipt->customerDebts);
        unset($salesReceipt->customer);
        unset($salesReceipt->priceList);
        unset($salesReceipt->user);

        return $salesReceipt;
    }

    /**
     * THÊM: Tính tổng chiết khấu từ items
     */
    private function calculateTotals($items)
    {
        $totalAmount = 0;
        $totalVat = 0;
        $totalDiscount = 0;
        $formattedItems = [];

        foreach ($items as $item) {
            $subtotal = $item['quantity'] * $item['price'];

            // Tính chiết khấu nếu có
            $discountAmount = $item['discount_amount'] ?? 0;
            $afterDiscount = $subtotal - $discountAmount;
            $totalDiscount += $discountAmount;

            // Tính VAT nếu có
            $vatAmount = $item['vat_amount'] ?? 0;

            // Nếu không có vat_amount trong item, tính từ vat_id
            if ($vatAmount == 0 && isset($item['vat_id']) && $item['vat_id']) {
                $vatTax = $this->vatTaxRepository->findById($item['vat_id']);
                $vatRate = $vatTax->rate ?? 0;
                $vatAmount = ($afterDiscount * $vatRate) / 100;
            }

            $totalAmount += $afterDiscount;
            $totalVat += $vatAmount;

            $formattedItems[] = [
                'product_variant_id' => $item['product_variant_id'],
                'quantity'           => $item['quantity'],
                'price'              => $item['price'],
                'discount_amount'    => $discountAmount,
                'discount_percent'   => $item['discount_percent'] ?? 0,
                'vat_id'             => $item['vat_id'] ?? null,
                'vat_amount'         => $vatAmount,
                'subtotal'           => $afterDiscount, // Tổng tiền hàng chưa VAT sau chiết khấu
            ];
        }

        return [
            'items'           => $formattedItems,
            'total_amount'    => $totalAmount,
            'vat_amount'      => $totalVat,
            'grand_total'     => $totalAmount + $totalVat,
            'total_discount'  => $totalDiscount,
        ];
    }

    /**
     * THÊM: Lấy text hiển thị chiết khấu
     */
    private function getDiscountText($receipt)
    {
        if (!$receipt->discount_type) {
            return 'Không chiết khấu';
        }

        if ($receipt->discount_type === 'percentage') {
            return "Chiết khấu {$receipt->discount_value}%";
        } else {
            return "Chiết khấu " . number_format($receipt->discount_value) . "đ";
        }
    }

    /**
     * Tự động generate mã phiếu xuất kho duy nhất
     */
    private function generateSalesReceiptCode()
    {
        do {
            $code = 'PXK_' . now()->format('Ymd_His');
            $exists = $this->salesReceiptRepository->findByCondition(
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
            'sales_receipts.id',
            'sales_receipts.code',
            'sales_receipts.note',
            'receipt_date',
            'u.id as user_id',
            'u.name as user_name',
            'c.name as customer_name',
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
            'total_amount',
            'vat_amount',
            'grand_total',
            'discount_type',
            'discount_value',
            'discount_amount',
            'discount_total',
            'discount_note',
            'status',
            'note',
            'price_list_id',
        ];
    }
}