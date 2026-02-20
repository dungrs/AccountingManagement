<?php

namespace App\Services\Product;

use App\Services\Interfaces\Product\ProductVariantServiceInterface;
use App\Services\BaseService;
use App\Repositories\Product\ProductRepository;
use App\Repositories\Product\ProductVariantRepository;
use App\Repositories\Inventory\InventoryTransactionRepository;
use App\Services\Inventory\InventoryValuationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProductVariantService extends BaseService implements ProductVariantServiceInterface
{
    protected $productRepository;
    protected $productVariantRepository;
    protected $inventoryTransactionRepository;
    protected $inventoryValuationService;

    public function __construct(
        ProductRepository $productRepository,
        ProductVariantRepository $productVariantRepository,
        InventoryTransactionRepository $inventoryTransactionRepository,
        InventoryValuationService $inventoryValuationService
    ) {
        $this->productRepository = $productRepository;
        $this->productVariantRepository = $productVariantRepository;
        $this->inventoryTransactionRepository = $inventoryTransactionRepository;
        $this->inventoryValuationService = $inventoryValuationService;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page');

        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'where' => []
        ];

        if (!is_null($publish)) {
            $condition['where'][] = ['product_variants.publish', '=', $publish];
        }

        $join = [
            [
                'table' => 'products',
                'on' => [
                    ['products.id', 'product_variants.product_id'],
                ],
            ],
            [
                'table' => 'product_languages',
                'on' => [
                    ['product_languages.product_id', 'products.id'],
                    ['product_languages.language_id', 1],
                ],
            ],
            [
                'table' => 'product_variant_languages',
                'on' => [
                    ['product_variant_languages.product_variant_id', 'product_variants.id'],
                    ['product_variant_languages.language_id', 1],
                ],
            ],
            [
                'table' => 'units',
                'on' => [
                    ['units.id', 'product_variants.unit_id'],
                ],
            ],
        ];

        $extend['path'] = '/product/variant/index';
        $extend['fieldSearch'] = [
            'product_languages.name',
            'product_variants.barcode',
            'product_variants.sku',
        ];

        $productVariants = $this->productVariantRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['product_variants.id', 'DESC'],
            $join,
            []
        );

        // Bổ sung thông tin giá vốn bình quân cho mỗi sản phẩm
        foreach ($productVariants as $variant) {
            $variant->average_cost = $this->inventoryValuationService->calculateAverageCost(
                $variant->product_variant_id,
                Carbon::now()
            );

            // Tính tổng giá trị tồn kho
            $variant->inventory_value = $variant->average_cost * $variant->quantity;
        }

        return $productVariants;
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {
            $productVariantId = $request->input('id');
            $flag = $this->updateProductVariant($request, $productVariantId);

            if (!$flag) {
                throw new \Exception("Cập nhật nhóm thành viên thất bại.");
            }

            return true;
        });
    }

    public function getProductVariant($payload, $languageId, $attributeString)
    {
        $variants = $this->productVariantRepository->findByCondition(
            [
                ['pvl.language_id', '=', $languageId],
                ['product_variants.product_id', '=', $payload['product_id']]
            ],
            true,
            [
                [
                    'table' => 'product_variant_languages as pvl',
                    'on' => [['pvl.product_variant_id', 'product_variants.id']]
                ]
            ],
            ['product_variants.id' => 'ASC'],
            [
                'product_variants.id',
                'product_variants.quantity',
                'product_variants.sku',
                'product_variants.code',
                'product_variants.base_price',
                'product_variants.uuid',
                'pvl.*',
            ]
        );

        foreach ($variants as $variant) {
            $dbAttributeId = explode(',', $variant->code);
            $dbAttributeString = sortAttributeId($dbAttributeId);

            if ($dbAttributeString == $attributeString) {
                return $variant;
            }
        }
    }

    private function updateProductVariant($request, $id)
    {
        $payload = $request->only($this->payload());
        return $this->productVariantRepository->update($id, $payload);
    }

    private function payload()
    {
        return ['barcode', 'sku', 'quantity'];
    }

    public function getListProductVariant()
    {
        $languageId = 1;

        $condition = [
            ['product_variants.publish', '=', 1]
        ];

        $select = [
            'product_variants.id as product_variant_id',
            DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name"),
            'product_variants.quantity',
            'product_variants.base_price',
        ];

        $joins = [
            [
                'table' => 'products',
                'on' => [
                    ['products.id', 'product_variants.product_id'],
                ],
            ],
            [
                'table' => 'product_languages',
                'on' => [
                    ['product_languages.product_id', 'products.id'],
                    ['product_languages.language_id', $languageId],
                ],
            ],
            [
                'table' => 'product_variant_languages',
                'on' => [
                    ['product_variant_languages.product_variant_id', 'product_variants.id'],
                    ['product_variant_languages.language_id', $languageId],
                ],
            ],
        ];

        $groupBy = [
            'product_variants.id',
            'product_languages.name',
            'product_variant_languages.name',
            'product_variants.quantity',
            'product_variants.base_price',
        ];

        $variants = $this->productVariantRepository->findByCondition(
            $condition,
            true,
            $joins,
            [],
            $select,
            [],
            null,
            $groupBy
        );

        // Bổ sung giá vốn bình quân cho mỗi variant
        foreach ($variants as $variant) {
            $variant->average_cost = $this->inventoryValuationService->calculateAverageCost(
                $variant->product_variant_id,
                Carbon::now()
            );

            $variant->inventory_value = $variant->average_cost * $variant->quantity;
        }

        return $variants;
    }

    /**
     * Tăng tồn kho khi nhập hàng (purchase receipt)
     * Ghi nhận giao dịch nhập kho với giá vốn
     */
    public function increaseStock($items, $referenceType, $referenceId, $transactionDate = null)
    {
        $transactionDate = $transactionDate ?? Carbon::now();
        $inboundDetails = [];

        foreach ($items as $item) {
            $productVariantId = $item['product_variant_id'] ?? $item->product_variant_id;
            $quantity = $item['quantity'];

            // Lấy giá nhập từ item (giá thực tế khi nhập)
            $unitCost = $item['price'] ?? $item->price ?? 0;

            // Lấy thông tin sản phẩm hiện tại
            $productVariant = $this->productVariantRepository->findById($productVariantId);

            // Cập nhật số lượng tồn kho
            $newQuantity = $productVariant->quantity + $quantity;

            $this->productVariantRepository->update($productVariantId, [
                'quantity' => $newQuantity
            ]);

            // Ghi nhận giao dịch nhập kho
            $transaction = $this->inventoryTransactionRepository->create([
                'product_variant_id' => $productVariantId,
                'transaction_type' => 'inbound',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $unitCost * $quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'transaction_date' => $transactionDate,
                'before_quantity' => $productVariant->quantity,
                'before_value' => $this->getInventoryValue($productVariantId, $productVariant->quantity),
                'after_quantity' => $newQuantity,
                'after_value' => $this->getInventoryValue($productVariantId, $newQuantity),
                'note' => 'Nhập kho từ ' . $referenceType . ' #' . $referenceId,
            ]);

            // Cập nhật inventory_balance
            $this->inventoryValuationService->updateInventoryBalance($productVariantId, $transactionDate);

            $inboundDetails[] = [
                'product_variant_id' => $productVariantId,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $unitCost * $quantity,
                'transaction_id' => $transaction->id,
            ];
        }

        return $inboundDetails;
    }

    /**
     * Giảm tồn kho khi xuất hàng (sales receipt)
     * Tính giá vốn và ghi nhận giao dịch xuất kho
     */
    public function decreaseStock($items, $referenceType, $referenceId, $transactionDate = null)
    {
        $transactionDate = $transactionDate ?? Carbon::now();
        $cogsDetails = [];

        foreach ($items as $item) {
            $productVariantId = $item['product_variant_id'] ?? $item->product_variant_id;
            $quantity = $item['quantity'];

            // Tính giá vốn bình quân
            $averageCost = $this->inventoryValuationService->calculateAverageCost(
                $productVariantId,
                $transactionDate
            );

            $cogs = $averageCost * $quantity;

            // Lấy thông tin sản phẩm hiện tại
            $productVariant = $this->productVariantRepository->findById($productVariantId);

            // Kiểm tra tồn kho
            if ($productVariant->quantity < $quantity) {
                throw new \Exception("Số lượng tồn kho của sản phẩm ID {$productVariantId} không đủ. 
                    Yêu cầu: {$quantity}, Tồn kho: {$productVariant->quantity}");
            }

            // Cập nhật số lượng tồn kho
            $newQuantity = $productVariant->quantity - $quantity;

            $this->productVariantRepository->update($productVariantId, [
                'quantity' => $newQuantity
            ]);

            // Ghi nhận giao dịch xuất kho
            $transaction = $this->inventoryTransactionRepository->create([
                'product_variant_id' => $productVariantId,
                'transaction_type' => 'outbound',
                'quantity' => $quantity,
                'unit_cost' => $averageCost,
                'total_cost' => $cogs,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'transaction_date' => $transactionDate,
                'before_quantity' => $productVariant->quantity,
                'before_value' => $this->getInventoryValue($productVariantId, $productVariant->quantity),
                'after_quantity' => $newQuantity,
                'after_value' => $this->getInventoryValue($productVariantId, $newQuantity),
                'note' => 'Xuất kho từ ' . $referenceType . ' #' . $referenceId,
            ]);

            // Cập nhật inventory_balance
            $this->inventoryValuationService->updateInventoryBalance($productVariantId, $transactionDate);

            $cogsDetails[] = [
                'product_variant_id' => $productVariantId,
                'quantity' => $quantity,
                'average_cost' => $averageCost,
                'cogs' => $cogs,
                'transaction_id' => $transaction->id,
            ];
        }

        return $cogsDetails;
    }

    /**
     * Hoàn nhập giao dịch (khi hủy phiếu)
     */
    public function revertTransaction($referenceType, $referenceId)
    {
        // Lấy tất cả giao dịch liên quan
        $transactions = $this->inventoryTransactionRepository->getByReference($referenceType, $referenceId);

        foreach ($transactions as $transaction) {
            $productVariantId = $transaction->product_variant_id;
            $productVariant = $this->productVariantRepository->findById($productVariantId);

            // Hoàn nhập số lượng
            if ($transaction->transaction_type === 'inbound') {
                // Nếu là giao dịch nhập, thì khi hủy phải trừ đi
                $newQuantity = $productVariant->quantity - $transaction->quantity;
            } else {
                // Nếu là giao dịch xuất, thì khi hủy phải cộng lại
                $newQuantity = $productVariant->quantity + $transaction->quantity;
            }

            // Cập nhật số lượng
            $this->productVariantRepository->update($productVariantId, [
                'quantity' => $newQuantity
            ]);

            // Xóa giao dịch
            $transaction->delete();

            // Cập nhật inventory_balance
            $this->inventoryValuationService->updateInventoryBalance($productVariantId, Carbon::now());
        }

        return true;
    }

    /**
     * Kiểm tra tồn kho có đủ không
     */
    public function checkStockAvailability($items)
    {
        foreach ($items as $item) {
            $productVariantId = $item['product_variant_id'] ?? $item->product_variant_id;
            $quantity = $item['quantity'];

            $productVariant = $this->productVariantRepository->findById($productVariantId);

            if ($productVariant->quantity < $quantity) {
                // Lấy tên sản phẩm
                $productName = $this->getProductNameByVariant($productVariantId, 1);

                return [
                    'available' => false,
                    'product'   => $productName,
                    'required'  => $quantity,
                    'current'   => $productVariant->quantity,
                    'variant_id' => $productVariantId,
                ];
            }
        }

        return ['available' => true];
    }

    /**
     * Lấy giá trị tồn kho
     */
    protected function getInventoryValue($productVariantId, $quantity)
    {
        $averageCost = $this->inventoryValuationService->calculateAverageCost(
            $productVariantId,
            Carbon::now()
        );

        return $averageCost * $quantity;
    }

    /**
     * Lấy thông tin tồn kho chi tiết của sản phẩm
     */
    public function getInventoryDetail($productVariantId)
    {
        $productVariant = $this->productVariantRepository->findById($productVariantId);

        if (!$productVariant) {
            return null;
        }

        // Lấy lịch sử giao dịch
        $transactions = $this->inventoryTransactionRepository->findByCondition(
            [['product_variant_id', '=', $productVariantId]],
            true,
            [],
            ['transaction_date' => 'DESC', 'id' => 'DESC'],
            ['*']
        );

        // Tính giá vốn bình quân hiện tại
        $averageCost = $this->inventoryValuationService->calculateAverageCost(
            $productVariantId,
            Carbon::now()
        );

        $totalInbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            null,
            'inbound'
        );

        $totalOutbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            null,
            'outbound'
        );

        return [
            'product_variant_id' => $productVariantId,
            'current_quantity' => $productVariant->quantity,
            'average_cost' => $averageCost,
            'inventory_value' => $averageCost * $productVariant->quantity,
            'total_inbound_quantity' => $totalInbound['total_quantity'] ?? 0,
            'total_inbound_value' => $totalInbound['total_value'] ?? 0,
            'total_outbound_quantity' => $totalOutbound['total_quantity'] ?? 0,
            'total_outbound_value' => $totalOutbound['total_value'] ?? 0,
            'transactions' => $transactions,
        ];
    }

    /**
     * Hàm riêng để lấy tên product variant sử dụng BaseRepository
     */
    public function getProductNameByVariant($productVariantId, $languageId)
    {
        try {
            $result = $this->productVariantRepository->findByCondition(
                [
                    ['product_variants.id', '=', $productVariantId]
                ],
                false, // lấy 1 record
                [ // joins
                    [
                        'table' => 'products',
                        'on' => [
                            ['products.id', 'product_variants.product_id']
                        ],
                        'type' => 'inner'
                    ],
                    [
                        'table' => 'product_languages',
                        'on' => [
                            ['product_languages.product_id', 'products.id'],
                        ],
                        'type' => 'left'
                    ],
                ],
                [], // orderBy
                [ // select
                    'product_variants.id as product_variant_id',
                    'product_languages.name'
                ]
            );

            if ($result && $result->name) {
                return $result->name;
            }
        } catch (\Exception $e) {
            Log::error('Error in getProductVariantName: ' . $e->getMessage());
        }

        // Fallback: lấy từ productVariant relation
        if (isset($this->productVariant)) {
            return $this->productVariant->sku ?? 'N/A';
        }

        return 'N/A';
    }
    
    /**
     * Lấy danh sách sản phẩm kèm tồn kho và giá vốn
     */
    public function getInventoryList($request)
    {
        $languageId = $request->input('language_id', 1);

        $condition = [
            ['product_variants.publish', '=', 1]
        ];

        if ($request->has('keyword')) {
            $condition['keyword'] = $request->input('keyword');
        }

        $select = [
            'product_variants.id as product_variant_id',
            DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name"),
            'product_variants.quantity',
            'product_variants.sku',
            'product_variants.barcode',
            'units.name as unit_name',
        ];

        $joins = [
            [
                'table' => 'products',
                'on' => [['products.id', 'product_variants.product_id']],
            ],
            [
                'table' => 'product_languages',
                'on' => [
                    ['product_languages.product_id', 'products.id'],
                    ['product_languages.language_id', $languageId],
                ],
            ],
            [
                'table' => 'product_variant_languages',
                'on' => [
                    ['product_variant_languages.product_variant_id', 'product_variants.id'],
                    ['product_variant_languages.language_id', $languageId],
                ],
            ],
            [
                'table' => 'units',
                'on' => [['units.id', 'product_variants.unit_id']],
                'type' => 'left'
            ],
        ];

        $variants = $this->productVariantRepository->findByCondition(
            $condition,
            true,
            $joins,
            ['product_variants.id' => 'DESC'],
            $select
        );

        // Bổ sung thông tin giá vốn và giá trị tồn
        foreach ($variants as $variant) {
            $averageCost = $this->inventoryValuationService->calculateAverageCost(
                $variant->product_variant_id,
                Carbon::now()
            );

            $variant->average_cost = $averageCost;
            $variant->inventory_value = $averageCost * $variant->quantity;
        }

        return $variants;
    }

    private function paginateSelect()
    {
        return [
            'product_variants.id as product_variant_id',
            DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name"),
            'product_variants.quantity',
            'product_variants.publish',
            'product_variants.quantity',
            'units.name as unit_name',
            'product_variants.sku',
            'product_variants.barcode',
            'product_variants.base_price',
        ];
    }
}
