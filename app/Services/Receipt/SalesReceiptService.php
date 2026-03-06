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
    const ACCOUNT_CASH = '111'; // Tiền mặt
    const ACCOUNT_BANK = '112'; // Tiền gửi ngân hàng
    const ACCOUNT_REVENUE_DEDUCTION = '521'; // Các khoản giảm trừ doanh thu

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

            // Gán các giá trị chiết khấu từ calculation
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

            // ✅ Lấy journal entries từ request
            $journalEntries = $request->input('journal_entries', []);

            // Tạo journal entries từ dữ liệu gửi lên
            if (!empty($journalEntries)) {
                $journalData = $this->prepareJournalData($journalEntries, $request->input('journal_note'));

                $this->journalEntryService->createFromRequest(
                    'sales_receipt',
                    $receipt->id,
                    $journalData,
                    $receipt->receipt_date
                );
            }

            // ✅ Xử lý khi xác nhận - chỉ tạo công nợ nếu có tài khoản 131 trong journal_entries
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($receipt, $journalEntries);
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
                    // ✅ Xử lý hủy - KHÔNG XÓA mà tạo bút toán đảo ngược
                    $this->handleCancellation($receipt, $request->input('journal_entries', []));
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

                // Cập nhật các giá trị chiết khấu
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

                // ✅ Lấy journal entries từ request
                $journalEntries = $request->input('journal_entries', []);

                // Cập nhật journal entries
                if (!empty($journalEntries)) {
                    $journalData = $this->prepareJournalData($journalEntries, $request->input('journal_note'));

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
                    $this->handleConfirm($receipt, $journalEntries);
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

            // ✅ Xóa công nợ và tăng lại tồn kho nếu đã confirmed
            if ($salesReceipt->status === 'confirmed') {
                // Kiểm tra xem có công nợ không trước khi xóa
                $this->customerDebtService->deleteDebtByReference('sales_receipt', $salesReceipt->id);

                // Hoàn nhập giao dịch tồn kho
                $this->inventoryService->revertTransactions('sales_receipt', $salesReceipt->id);
            }

            $salesReceipt->delete();

            return true;
        });
    }

    /**
     * ✅ Kiểm tra xem có sử dụng tài khoản 131 không
     */
    private function hasReceivableAccount(array $journalEntries): bool
    {
        foreach ($journalEntries as $entry) {
            $accountCode = $entry['account_code'] ?? '';
            if ($accountCode === self::ACCOUNT_RECEIVABLE) {
                return true;
            }
        }
        return false;
    }

    /**
     * ✅ Kiểm tra xem có sử dụng tài khoản tiền mặt/ngân hàng không
     */
    private function hasCashOrBankAccount(array $journalEntries): bool
    {
        $cashBankAccounts = [self::ACCOUNT_CASH, self::ACCOUNT_BANK];
        foreach ($journalEntries as $entry) {
            $accountCode = $entry['account_code'] ?? '';
            if (in_array($accountCode, $cashBankAccounts)) {
                return true;
            }
        }
        return false;
    }

    /**
     * ✅ Xử lý khi xác nhận phiếu xuất
     */
    private function handleConfirm($receipt, array $journalEntries = [])
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

        // 3️⃣ ✅ Tạo công nợ khách hàng CHỈ KHI có tài khoản 131 trong journal entries
        if ($this->hasReceivableAccount($journalEntries)) {
            $this->customerDebtService->createDebtForSalesReceipt($receipt);
            Log::info('Đã tạo công nợ cho khách hàng', [
                'receipt_id' => $receipt->id,
                'customer_id' => $receipt->customer_id
            ]);
        } else {
            Log::info('Không tạo công nợ vì không sử dụng TK 131', [
                'receipt_id' => $receipt->id,
                'payment_method' => $receipt->payment_method ?? 'unknown'
            ]);
        }

        // 4️⃣ Xác nhận journal entries
        $this->journalEntryService->confirmJournalByReference('sales_receipt', $receipt->id);
    }

    /**
     * ✅ Xử lý khi hủy phiếu xuất - Tạo bút toán đảo ngược, KHÔNG XÓA
     */
    private function handleCancellation($receipt, array $cancellationJournalEntries = [])
    {
        // 1️⃣ Hoàn nhập giao dịch tồn kho (tăng lại tồn kho)
        $this->inventoryService->revertTransactions('sales_receipt', $receipt->id);

        // 2️⃣ Tạo bút toán đảo ngược giá vốn: Nợ 156 / Có 632
        $this->createReversalCostOfGoodsSoldJournal($receipt);

        // 3️⃣ Xử lý công nợ nếu có
        if (!empty($cancellationJournalEntries)) {
            // Kiểm tra xem có sử dụng TK 131 không
            $hasReceivable = $this->hasReceivableAccount($cancellationJournalEntries);

            if ($hasReceivable) {
                // Nếu có TK 131, cập nhật công nợ (giảm công nợ)
                // Lưu ý: Debt service sẽ tự động tính toán dựa trên bút toán
                Log::info('Hủy phiếu có ảnh hưởng đến công nợ', [
                    'receipt_id' => $receipt->id
                ]);
            }
        }

        // 4️⃣ Tạo bút toán hủy từ dữ liệu gửi lên (nếu có)
        if (!empty($cancellationJournalEntries)) {
            $journalData = $this->prepareJournalData(
                $cancellationJournalEntries,
                'Bút toán hủy phiếu xuất ' . $receipt->code
            );

            $this->journalEntryService->createFromRequest(
                'sales_receipt_cancellation',
                $receipt->id,
                $journalData,
                now() // Ngày hủy là ngày hiện tại
            );

            Log::info('Đã tạo bút toán hủy', [
                'receipt_id' => $receipt->id,
                'entries_count' => count($cancellationJournalEntries)
            ]);
        }

        // 5️⃣ Xóa công nợ cũ (nếu có) - Cái này nên để Debt service xử lý
        // Thay vì xóa, nên tạo bút toán điều chỉnh công nợ
        $this->customerDebtService->deleteDebtByReference('sales_receipt', $receipt->id);
    }

    /**
     * ✅ Tạo bút toán đảo ngược giá vốn (khi hủy)
     * Nợ 156 / Có 632
     */
    private function createReversalCostOfGoodsSoldJournal($receipt)
    {
        // Tính tổng giá vốn từ items
        $totalCogs = 0;
        foreach ($receipt->items as $item) {
            // Giả sử mỗi item có giá vốn (có thể lấy từ product variant)
            // Nếu không có, cần logic tính giá vốn thực tế
            $cogs = $item->quantity * ($item->productVariant->cost_price ?? 0);
            $totalCogs += $cogs;
        }

        if ($totalCogs <= 0) {
            Log::warning('Không thể tạo bút toán đảo ngược giá vốn vì totalCogs = 0', [
                'receipt_id' => $receipt->id
            ]);
            return;
        }

        $journalEntries = [
            'entries' => [
                [
                    'account_code' => self::ACCOUNT_INVENTORY,
                    'debit' => $totalCogs,
                    'credit' => 0,
                    'note' => 'Hoàn nhập giá vốn khi hủy phiếu xuất ' . $receipt->code
                ],
                [
                    'account_code' => self::ACCOUNT_COST_OF_GOODS_SOLD,
                    'debit' => 0,
                    'credit' => $totalCogs,
                    'note' => 'Hoàn nhập giá vốn khi hủy phiếu xuất ' . $receipt->code
                ],
            ],
            'note' => 'Hoàn nhập giá vốn khi hủy phiếu xuất ' . $receipt->code,
        ];

        try {
            $this->journalEntryService->createFromRequest(
                'sales_receipt_cogs_reversal',
                $receipt->id,
                $journalEntries,
                now() // Ngày hủy
            );

            Log::info('Đã tạo bút toán đảo ngược giá vốn', [
                'receipt_id' => $receipt->id,
                'total_cogs' => $totalCogs
            ]);
        } catch (\Exception $e) {
            Log::error('Lỗi tạo bút toán đảo ngược giá vốn: ' . $e->getMessage());
            // Không throw exception để tránh ảnh hưởng đến luồng chính
        }
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
     * ✅ Chuẩn bị dữ liệu journal entries từ request
     */
    private function prepareJournalData($journalEntries, $journalNote = null)
    {
        // Nếu journalEntries đã có cấu trúc {entries: [...], note: '...'}
        if (isset($journalEntries['entries']) && is_array($journalEntries['entries'])) {
            return $journalEntries;
        }

        // Nếu journalEntries là mảng các entry đơn thuần (như dữ liệu bạn gửi)
        if (is_array($journalEntries) && !isset($journalEntries['entries'])) {
            // Format lại để đúng cấu trúc
            $formattedEntries = [];
            foreach ($journalEntries as $entry) {
                $formattedEntries[] = [
                    'account_code' => $entry['account_code'] ?? '',
                    'debit' => (float)($entry['debit'] ?? 0),
                    'credit' => (float)($entry['credit'] ?? 0),
                    'note' => $entry['note'] ?? null,
                ];
            }

            return [
                'entries' => $formattedEntries,
                'note' => $journalNote ?? 'Bút toán từ phiếu xuất',
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
        | Format công nợ (chỉ hiển thị nếu có)
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

        // Thông tin chiết khấu
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
     * Tính tổng chiết khấu từ items
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
     * Lấy text hiển thị chiết khấu
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