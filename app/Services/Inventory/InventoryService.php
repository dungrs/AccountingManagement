<?php

namespace App\Services\Inventory;

use App\Services\BaseService;
use App\Services\Interfaces\Inventory\InventoryServiceInterface;
use App\Repositories\Inventory\InventoryBalanceRepository;
use App\Repositories\Inventory\InventoryTransactionRepository;
use App\Repositories\Product\ProductVariantRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class InventoryService extends BaseService implements InventoryServiceInterface
{
    protected $inventoryBalanceRepository;
    protected $inventoryTransactionRepository;
    protected $productVariantRepository;

    public function __construct(
        InventoryBalanceRepository $inventoryBalanceRepository,
        InventoryTransactionRepository $inventoryTransactionRepository,
        ProductVariantRepository $productVariantRepository
    ) {
        $this->inventoryBalanceRepository = $inventoryBalanceRepository;
        $this->inventoryTransactionRepository = $inventoryTransactionRepository;
        $this->productVariantRepository = $productVariantRepository;
    }

    /**
     * Phân trang danh sách tồn kho - Dùng inventory_balances làm bảng chính
     */
    public function paginateInventory($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page');
        $balanceDate = $request->input('balance_date')
            ? Carbon::parse($request->input('balance_date'))
            : Carbon::now();

        // Xây dựng condition theo đúng format của BaseRepository
        $condition = [
            'where' => [
                ['product_variant_languages.language_id', '=', 1]
            ]
        ];

        // Lọc theo khoảng tồn kho
        if ($request->has('min_quantity')) {
            $condition['where'][] = ['inventory_balances.quantity', '>=', $request->input('min_quantity')];
        }
        if ($request->has('max_quantity')) {
            $condition['where'][] = ['inventory_balances.quantity', '<=', $request->input('max_quantity')];
        }

        // Lọc theo trạng thái tồn
        if ($request->has('stock_status')) {
            $status = $request->input('stock_status');
            if ($status === 'out_of_stock') {
                $condition['where'][] = ['inventory_balances.quantity', '<=', 0];
            } elseif ($status === 'low_stock') {
                $condition['where'][] = ['inventory_balances.quantity', '>', 0];
                $condition['where'][] = ['inventory_balances.quantity', '<', 10];
            } elseif ($status === 'in_stock') {
                $condition['where'][] = ['inventory_balances.quantity', '>=', 10];
            }
        }

        // Keyword search - đúng format để QueryScopes xử lý
        if ($request->has('keyword') && $request->input('keyword')) {
            $condition['keyword'] = addslashes($request->input('keyword'));
        }

        // Joins - đúng format để scopeCustomJoin xử lý
        $joins = [
            [
                'table' => 'product_variants',
                'on' => [
                    ['product_variants.id', 'inventory_balances.product_variant_id'],
                ],
            ],
            [
                'table' => 'products',
                'on' => [
                    ['products.id', 'product_variants.product_id'],
                ],
            ],
            [
                'table' => 'product_languages',
                'on' => [
                    ['product_languages.product_id','products.id'],
                ],
            ],
            [
                'table' => 'product_variant_languages',
                'on' => [
                    ['product_variant_languages.product_variant_id', 'product_variants.id'],
                ],
            ],
            [
                'table' => 'units',
                'on' => [
                    ['units.id', 'product_variants.unit_id'],
                ],
            ],
        ];

        // Extend - chứa path và fieldSearch cho keyword
        $extend = [
            'path' => '/inventory/index',
            'fieldSearch' => [
                'product_languages.name',
                'product_variant_languages.name',
                'product_variants.sku',
                'product_variants.barcode',
            ]
        ];

        // Select - các trường cần lấy
        $select = [
            'inventory_balances.id',
            'inventory_balances.product_variant_id',
            'inventory_balances.balance_date',
            'inventory_balances.quantity',
            'inventory_balances.value',
            'inventory_balances.average_cost',
            'product_variants.sku',
            'product_variants.barcode',
            'product_variants.base_price',
            DB::raw("CONCAT(COALESCE(product_languages.name, ''), ' - ', COALESCE(product_variant_languages.name, '')) as product_name"),
            'units.name as unit_name',
        ];

        // OrderBy - mảng với [cột, hướng]
        $orderBy = ['inventory_balances.id', 'DESC'];

        // Sử dụng InventoryBalanceRepository để paginate
        $inventoryItems = $this->inventoryBalanceRepository->paginate(
            $select,
            $condition,
            $perpage,
            $page,
            $extend,
            $orderBy,
            $joins,
            [] // relations
        );

        // Format lại dữ liệu
        foreach ($inventoryItems as $item) {
            $item->inventory_value = $item->quantity * $item->average_cost;
            $item->stock_status = $this->determineStockStatus($item->quantity);
        }

        return $inventoryItems;
    }

    /**
     * Tăng tồn kho khi nhập hàng
     */
    public function receiveStock($items, $referenceType, $referenceId, $transactionDate = null, $options = [])
    {
        $transactionDate = $transactionDate ?? Carbon::now();
        $inboundDetails = [];

        return DB::transaction(function () use ($items, $referenceType, $referenceId, $transactionDate, $options, &$inboundDetails) {
            foreach ($items as $item) {
                $productVariantId = $item['product_variant_id'] ?? $item->product_variant_id;
                $quantity = $item['quantity'];
                $unitCost = $item['price'] ?? $item->price ?? 0;

                // Lấy tồn kho trước khi nhập
                $beforeBalance = $this->getCurrentBalance($productVariantId, $transactionDate);

                // Tạo giao dịch nhập kho
                $transaction = $this->inventoryTransactionRepository->create([
                    'product_variant_id' => $productVariantId,
                    'transaction_type' => 'inbound',
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $unitCost * $quantity,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'transaction_date' => $transactionDate,
                    'before_quantity' => $beforeBalance['quantity'],
                    'before_value' => $beforeBalance['value'],
                    'after_quantity' => $beforeBalance['quantity'] + $quantity,
                    'after_value' => $beforeBalance['value'] + ($unitCost * $quantity),
                    'note' => $options['note'] ?? 'Nhập kho từ ' . $referenceType . ' #' . $referenceId,
                    'created_by' => Auth::id(),
                ]);

                // Cập nhật inventory_balance
                $this->updateInventoryBalance($productVariantId, $transactionDate);

                $inboundDetails[] = [
                    'product_variant_id' => $productVariantId,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $unitCost * $quantity,
                    'transaction_id' => $transaction->id,
                ];
            }

            return $inboundDetails;
        });
    }

    /**
     * Giảm tồn kho khi xuất hàng
     */
    public function issueStock($items, $referenceType, $referenceId, $transactionDate = null, $options = [])
    {
        $transactionDate = $transactionDate ?? Carbon::now();
        $cogsDetails = [];

        return DB::transaction(function () use ($items, $referenceType, $referenceId, $transactionDate, $options, &$cogsDetails) {
            foreach ($items as $item) {
                $productVariantId = $item['product_variant_id'] ?? $item->product_variant_id;
                $quantity = $item['quantity'];

                // Lấy tồn kho trước khi xuất
                $beforeBalance = $this->getCurrentBalance($productVariantId, $transactionDate);

                // Kiểm tra tồn kho
                if ($beforeBalance['quantity'] < $quantity) {
                    throw new \Exception("Số lượng tồn kho của sản phẩm ID {$productVariantId} không đủ. Yêu cầu: {$quantity}, Tồn kho: {$beforeBalance['quantity']}");
                }

                // Tính giá vốn bình quân
                $averageCost = $beforeBalance['average_cost'];
                $cogs = $averageCost * $quantity;

                // Tạo giao dịch xuất kho
                $transaction = $this->inventoryTransactionRepository->create([
                    'product_variant_id' => $productVariantId,
                    'transaction_type' => 'outbound',
                    'quantity' => $quantity,
                    'unit_cost' => $averageCost,
                    'total_cost' => $cogs,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'transaction_date' => $transactionDate,
                    'before_quantity' => $beforeBalance['quantity'],
                    'before_value' => $beforeBalance['value'],
                    'after_quantity' => $beforeBalance['quantity'] - $quantity,
                    'after_value' => $beforeBalance['value'] - $cogs,
                    'note' => $options['note'] ?? 'Xuất kho từ ' . $referenceType . ' #' . $referenceId,
                    'created_by' => Auth::id(),
                ]);

                // Cập nhật inventory_balance
                $this->updateInventoryBalance($productVariantId, $transactionDate);

                $cogsDetails[] = [
                    'product_variant_id' => $productVariantId,
                    'quantity' => $quantity,
                    'average_cost' => $averageCost,
                    'cogs' => $cogs,
                    'transaction_id' => $transaction->id,
                ];
            }

            return $cogsDetails;
        });
    }

    /**
     * Điều chỉnh tồn kho (kiểm kê)
     */
    public function adjustStock($productVariantId, $newQuantity, $reason, $options = [])
    {
        return DB::transaction(function () use ($productVariantId, $newQuantity, $reason, $options) {
            $adjustmentDate = isset($options['adjustment_date'])
                ? Carbon::parse($options['adjustment_date'])
                : Carbon::now();

            // Lấy tồn kho hiện tại
            $currentBalance = $this->getCurrentBalance($productVariantId, $adjustmentDate);

            if ($currentBalance['quantity'] == $newQuantity) {
                return [
                    'adjusted' => false,
                    'message' => 'Số lượng không thay đổi, không cần điều chỉnh',
                ];
            }

            $difference = $newQuantity - $currentBalance['quantity'];
            $transactionType = $difference > 0 ? 'inbound' : 'outbound';
            $adjustQuantity = abs($difference);

            // Tạo transaction điều chỉnh
            if ($transactionType === 'inbound') {
                $result = $this->receiveStock(
                    [
                        [
                            'product_variant_id' => $productVariantId,
                            'quantity' => $adjustQuantity,
                            'price' => $currentBalance['average_cost']
                        ]
                    ],
                    'adjustment',
                    $options['adjustment_id'] ?? 0,
                    $adjustmentDate,
                    ['note' => "Điều chỉnh tồn kho: {$reason}"]
                );
            } else {
                $result = $this->issueStock(
                    [
                        [
                            'product_variant_id' => $productVariantId,
                            'quantity' => $adjustQuantity
                        ]
                    ],
                    'adjustment',
                    $options['adjustment_id'] ?? 0,
                    $adjustmentDate,
                    ['note' => "Điều chỉnh tồn kho: {$reason}"]
                );
            }

            return [
                'product_variant_id' => $productVariantId,
                'old_quantity' => $currentBalance['quantity'],
                'new_quantity' => $newQuantity,
                'difference' => $difference,
                'adjusted' => true,
                'transaction_id' => $result[0]['transaction_id'] ?? null,
            ];
        });
    }

    /**
     * Lấy tổng quan tồn kho
     */
    public function getInventoryOverview($asOfDate = null)
    {
        $asOfDate = $asOfDate ?? Carbon::now();
        $balanceDate = $asOfDate->format('Y-m-d');

        // Lấy tất cả balance trong ngày
        $balances = $this->inventoryBalanceRepository->findByCondition(
            [['balance_date', '=', $balanceDate]],
            true
        );

        $totalValue = 0;
        $totalQuantity = 0;
        $productWithStock = 0;
        $lowStock = 0;
        $outOfStock = 0;

        foreach ($balances as $balance) {
            $totalValue += $balance->value;
            $totalQuantity += $balance->quantity;

            if ($balance->quantity > 0) {
                $productWithStock++;
            }

            if ($balance->quantity > 0 && $balance->quantity < 10) {
                $lowStock++;
            }

            if ($balance->quantity <= 0) {
                $outOfStock++;
            }
        }

        // Lấy tổng nhập trong tháng
        $startOfMonth = $asOfDate->copy()->startOfMonth();
        $monthlyInbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            0, // 0 để lấy tất cả
            $startOfMonth,
            $asOfDate,
            'inbound'
        );

        // Lấy tổng xuất trong tháng
        $monthlyOutbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            0,
            $startOfMonth,
            $asOfDate,
            'outbound'
        );

        return [
            'total_value' => round($totalValue, 2),
            'total_quantity' => round($totalQuantity, 2),
            'product_with_stock' => $productWithStock,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'monthly_inbound_quantity' => $monthlyInbound['total_quantity'] ?? 0,
            'monthly_inbound_value' => $monthlyInbound['total_value'] ?? 0,
            'monthly_outbound_quantity' => $monthlyOutbound['total_quantity'] ?? 0,
            'monthly_outbound_value' => $monthlyOutbound['total_value'] ?? 0,
            'as_of_date' => $balanceDate,
        ];
    }

    /**
     * Hoàn nhập giao dịch (khi hủy phiếu)
     */
    public function revertTransactions($referenceType, $referenceId)
    {
        return DB::transaction(function () use ($referenceType, $referenceId) {
            // Lấy tất cả giao dịch liên quan
            $transactions = $this->inventoryTransactionRepository->getByReference($referenceType, $referenceId);

            foreach ($transactions as $transaction) {
                // Tạo giao dịch đảo ngược
                $reverseType = $transaction->transaction_type === 'inbound' ? 'outbound' : 'inbound';

                // Lấy tồn kho trước khi hoàn nhập
                $beforeBalance = $this->getCurrentBalance($transaction->product_variant_id, Carbon::now());

                // Tạo giao dịch đảo ngược
                $reverseTransaction = $this->inventoryTransactionRepository->create([
                    'product_variant_id' => $transaction->product_variant_id,
                    'transaction_type' => $reverseType,
                    'quantity' => $transaction->quantity,
                    'unit_cost' => $transaction->unit_cost,
                    'total_cost' => $transaction->total_cost,
                    'reference_type' => 'reversal',
                    'reference_id' => $transaction->id,
                    'transaction_date' => Carbon::now(),
                    'before_quantity' => $beforeBalance['quantity'],
                    'before_value' => $beforeBalance['value'],
                    'after_quantity' => $reverseType === 'inbound'
                        ? $beforeBalance['quantity'] + $transaction->quantity
                        : $beforeBalance['quantity'] - $transaction->quantity,
                    'after_value' => $reverseType === 'inbound'
                        ? $beforeBalance['value'] + $transaction->total_cost
                        : $beforeBalance['value'] - $transaction->total_cost,
                    'note' => 'Hoàn nhập giao dịch #' . $transaction->id,
                    'created_by' => Auth::id(),
                ]);

                // Cập nhật inventory_balance
                $this->updateInventoryBalance($transaction->product_variant_id, Carbon::now());
            }

            return true;
        });
    }

    /**
     * Kiểm tra tồn kho có đủ không
     */
    public function checkStockAvailability($items, $asOfDate = null)
    {
        $asOfDate = $asOfDate ?? Carbon::now();
        $unavailableItems = [];

        foreach ($items as $item) {
            $productVariantId = $item['product_variant_id'] ?? $item->product_variant_id;
            $quantity = $item['quantity'];

            $currentBalance = $this->getCurrentBalance($productVariantId, $asOfDate);

            if ($currentBalance['quantity'] < $quantity) {
                $unavailableItems[] = [
                    'product_variant_id' => $productVariantId,
                    'required' => $quantity,
                    'current' => $currentBalance['quantity'],
                ];
            }
        }

        if (!empty($unavailableItems)) {
            return [
                'available' => false,
                'items' => $unavailableItems
            ];
        }

        return ['available' => true];
    }

    /**
     * Lấy tồn kho hiện tại
     */
    public function getCurrentBalance($productVariantId, Carbon $asOfDate = null)
    {
        $asOfDate = $asOfDate ?? Carbon::now();

        $balance = $this->inventoryBalanceRepository->findByProductAndDate($productVariantId, $asOfDate);

        if ($balance) {
            return [
                'quantity' => (float)$balance->quantity,
                'value' => (float)$balance->value,
                'average_cost' => (float)$balance->average_cost,
            ];
        }

        // Nếu không có balance, tính từ transactions
        return $this->calculateBalanceFromTransactions($productVariantId, $asOfDate);
    }

    /**
     * Lấy chi tiết tồn kho của sản phẩm
     */
    public function getInventoryDetail($productVariantId, $request = null)
    {
        // Kiểm tra nếu $productVariantId không phải số
        if (!is_numeric($productVariantId)) {
            Log::warning('ID sản phẩm không hợp lệ: ' . $productVariantId);
            return null;
        }

        $languageId = $request->input('language_id', 1);
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))
            : Carbon::now();
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))
            : $endDate->copy()->subDays(30);

        // Lấy thông tin sản phẩm - chuyển sang int
        $productVariant = $this->productVariantRepository->findById((int)$productVariantId, ['*'], [], false);

        if (!$productVariant) {
            Log::warning('Không tìm thấy sản phẩm với ID: ' . $productVariantId);
            return null;
        }

        // Lấy tồn kho hiện tại
        $currentBalance = $this->getCurrentBalance((int)$productVariantId, $endDate);

        // Lấy lịch sử giao dịch
        $transactions = $this->inventoryTransactionRepository->getTransactionsByProduct(
            (int)$productVariantId,
            $startDate,
            $endDate
        );

        // Lấy tổng hợp nhập/xuất
        $totalInbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            (int)$productVariantId,
            $startDate,
            $endDate,
            'inbound'
        );

        $totalOutbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            (int)$productVariantId,
            $startDate,
            $endDate,
            'outbound'
        );

        // Lấy tồn đầu kỳ
        $beginningBalance = $this->getCurrentBalance((int)$productVariantId, $startDate->copy()->subDay());

        return [
            'product_variant_id' => (int)$productVariantId,
            'sku' => $productVariant->sku,
            'barcode' => $productVariant->barcode,
            'base_price' => $productVariant->base_price,
            'current_quantity' => $currentBalance['quantity'],
            'current_value' => $currentBalance['value'],
            'average_cost' => $currentBalance['average_cost'],
            'beginning_quantity' => $beginningBalance['quantity'],
            'beginning_value' => $beginningBalance['value'],
            'total_inbound_quantity' => $totalInbound['total_quantity'] ?? 0,
            'total_inbound_value' => $totalInbound['total_value'] ?? 0,
            'total_outbound_quantity' => $totalOutbound['total_quantity'] ?? 0,
            'total_outbound_value' => $totalOutbound['total_value'] ?? 0,
            'transactions' => $transactions,
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ];
    }

    /**
     * Lấy lịch sử giao dịch của sản phẩm
     */
    public function getTransactionHistory($productVariantId, $startDate = null, $endDate = null, $type = null)
    {
        $startDate = $startDate ? Carbon::parse($startDate) : Carbon::now()->subDays(30);
        $endDate = $endDate ? Carbon::parse($endDate) : Carbon::now();

        return $this->inventoryTransactionRepository->getTransactionsByProduct(
            $productVariantId,
            $startDate,
            $endDate,
            $type
        );
    }

    /**
     * Cập nhật inventory_balance
     */
    public function updateInventoryBalance($productVariantId, Carbon $date)
    {
        $balance = $this->calculateBalanceFromTransactions($productVariantId, $date);

        return $this->inventoryBalanceRepository->updateOrCreateBalance(
            $productVariantId,
            $date,
            [
                'quantity' => $balance['quantity'],
                'value' => $balance['value'],
                'average_cost' => $balance['average_cost'],
            ]
        );
    }

    /**
     * Tính tồn kho từ transactions
     */
    protected function calculateBalanceFromTransactions($productVariantId, Carbon $asOfDate)
    {
        $totalInbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            $asOfDate,
            'inbound'
        );

        $totalOutbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            $asOfDate,
            'outbound'
        );

        $quantity = ($totalInbound['total_quantity'] ?? 0) - ($totalOutbound['total_quantity'] ?? 0);
        $value = ($totalInbound['total_value'] ?? 0) - ($totalOutbound['total_value'] ?? 0);
        $averageCost = $quantity > 0 ? round($value / $quantity, 2) : 0;

        return [
            'quantity' => $quantity,
            'value' => $value,
            'average_cost' => $averageCost,
        ];
    }

    /**
     * Xác định trạng thái tồn kho
     */
    protected function determineStockStatus($quantity)
    {
        if ($quantity <= 0) {
            return 'out_of_stock';
        } elseif ($quantity < 10) {
            return 'low_stock';
        }
        return 'in_stock';
    }

    /**
     * Cập nhật số lượng tồn kho tối thiểu (threshold)
     */
    public function updateLowStockThreshold($threshold = 10)
    {
        // Có thể lưu vào setting nếu cần
        return $threshold;
    }
}
