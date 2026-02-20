<?php

namespace App\Services\Inventory;

use App\Repositories\Product\ProductVariantRepository;
use App\Repositories\Inventory\InventoryTransactionRepository;
use App\Repositories\Inventory\InventoryBalanceRepository;
use App\Services\BaseService;
use App\Services\Interfaces\Inventory\InventoryValuationServiceInterface;
use Carbon\Carbon;

class InventoryValuationService extends BaseService implements InventoryValuationServiceInterface
{
    protected $productVariantRepository;
    protected $inventoryTransactionRepository;
    protected $inventoryBalanceRepository;

    public function __construct(
        ProductVariantRepository $productVariantRepository,
        InventoryTransactionRepository $inventoryTransactionRepository,
        InventoryBalanceRepository $inventoryBalanceRepository
    ) {
        $this->productVariantRepository = $productVariantRepository;
        $this->inventoryTransactionRepository = $inventoryTransactionRepository;
        $this->inventoryBalanceRepository = $inventoryBalanceRepository;
    }

    /**
     * Tính đơn giá bình quân cho sản phẩm tại thời điểm
     */
    public function calculateAverageCost(int $productVariantId, Carbon $transactionDate): float
    {
        // Lấy tồn đầu kỳ (trước ngày giao dịch)
        $openingBalance = $this->getOpeningBalance($productVariantId, $transactionDate);
        
        // Lấy tổng nhập trong kỳ (từ đầu kỳ đến ngày giao dịch)
        $periodPurchases = $this->getPeriodPurchases($productVariantId, $openingBalance['date'], $transactionDate);
        
        // Tính tổng số lượng và tổng giá trị
        $totalQuantity = $openingBalance['quantity'] + $periodPurchases['total_quantity'];
        $totalValue = $openingBalance['value'] + $periodPurchases['total_value'];
        
        // Nếu không có tồn kho, giá vốn = 0
        if ($totalQuantity <= 0) {
            return 0;
        }
        
        // Đơn giá bình quân = Tổng giá trị / Tổng số lượng
        return round($totalValue / $totalQuantity, 2);
    }

    /**
     * Tính giá vốn cho phiếu xuất
     */
    public function calculateCostOfGoodsSold(int $productVariantId, float $quantity, Carbon $transactionDate): array
    {
        $averageCost = $this->calculateAverageCost($productVariantId, $transactionDate);
        $cogs = round($averageCost * $quantity, 2);
        
        return [
            'average_cost' => $averageCost,
            'quantity' => $quantity,
            'cogs' => $cogs,
        ];
    }

    /**
     * Ghi nhận giao dịch xuất kho vào inventory_transactions
     */
    public function recordInventoryOutbound(
        int $productVariantId, 
        float $quantity, 
        float $unitCost, 
        string $referenceType, 
        int $referenceId,
        Carbon $transactionDate
    ) {
        // Lấy tồn kho hiện tại trước khi xuất
        $currentBalance = $this->getCurrentBalance($productVariantId);
        
        // Tạo giao dịch xuất
        $transaction = $this->inventoryTransactionRepository->create([
            'product_variant_id' => $productVariantId,
            'transaction_type' => 'outbound',
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost * $quantity,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'transaction_date' => $transactionDate,
            'before_quantity' => $currentBalance['quantity'],
            'before_value' => $currentBalance['value'],
            'after_quantity' => $currentBalance['quantity'] - $quantity,
            'after_value' => $currentBalance['value'] - ($unitCost * $quantity),
        ]);
        
        // Cập nhật inventory_balance
        $this->updateInventoryBalance($productVariantId, $transactionDate);
        
        return $transaction;
    }

    /**
     * Lấy tồn đầu kỳ (đầu tháng hoặc đầu năm)
     */
    protected function getOpeningBalance(int $productVariantId, Carbon $transactionDate): array
    {
        // Xác định đầu kỳ (đầu tháng)
        $startOfMonth = $transactionDate->copy()->startOfMonth();
        
        // Lấy tổng nhập trước đầu tháng
        $beforeMonth = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            $startOfMonth->copy()->subSecond()
        );
        
        // Lấy tổng xuất trước đầu tháng
        $outboundBeforeMonth = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            $startOfMonth->copy()->subSecond(),
            'outbound'
        );
        
        $openingQuantity = ($beforeMonth['total_quantity'] ?? 0) - ($outboundBeforeMonth['total_quantity'] ?? 0);
        $openingValue = ($beforeMonth['total_value'] ?? 0) - ($outboundBeforeMonth['total_value'] ?? 0);
        
        return [
            'date' => $startOfMonth,
            'quantity' => $openingQuantity,
            'value' => $openingValue,
        ];
    }

    /**
     * Lấy tổng nhập trong kỳ
     */
    public function getPeriodPurchases(int $productVariantId, Carbon $startDate, Carbon $endDate): array
    {
        $purchases = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            $startDate,
            $endDate,
            'inbound'
        );
        
        return [
            'total_quantity' => $purchases['total_quantity'] ?? 0,
            'total_value' => $purchases['total_value'] ?? 0,
        ];
    }

    /**
     * Lấy tồn kho hiện tại
     */
    public function getCurrentBalance(int $productVariantId): array
    {
        $inbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            null,
            'inbound'
        );
        
        $outbound = $this->inventoryTransactionRepository->getAggregatedByProduct(
            $productVariantId,
            null,
            null,
            'outbound'
        );
        
        $quantity = ($inbound['total_quantity'] ?? 0) - ($outbound['total_quantity'] ?? 0);
        $value = ($inbound['total_value'] ?? 0) - ($outbound['total_value'] ?? 0);
        
        return [
            'quantity' => $quantity,
            'value' => $value,
            'average_cost' => $quantity > 0 ? round($value / $quantity, 2) : 0,
        ];
    }

    /**
     * Cập nhật inventory_balance
     */
    public function updateInventoryBalance(int $productVariantId, Carbon $date)
    {
        $currentBalance = $this->getCurrentBalance($productVariantId);
        
        // Tìm hoặc tạo mới inventory_balance cho ngày
        $balance = $this->inventoryBalanceRepository->findByProductAndDate($productVariantId, $date);
        
        if ($balance) {
            $balance->update([
                'quantity' => $currentBalance['quantity'],
                'value' => $currentBalance['value'],
                'average_cost' => $currentBalance['average_cost'],
            ]);
        } else {
            $this->inventoryBalanceRepository->create([
                'product_variant_id' => $productVariantId,
                'balance_date' => $date,
                'quantity' => $currentBalance['quantity'],
                'value' => $currentBalance['value'],
                'average_cost' => $currentBalance['average_cost'],
            ]);
        }
    }
}