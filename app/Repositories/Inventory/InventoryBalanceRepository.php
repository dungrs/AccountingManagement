<?php

namespace App\Repositories\Inventory;

use App\Repositories\BaseRepository;
use App\Models\InventoryBalance;
use App\Repositories\Interfaces\Inventory\InventoryBalanceRepositoryInterface;
use Carbon\Carbon;

class InventoryBalanceRepository extends BaseRepository implements InventoryBalanceRepositoryInterface
{
    protected $model;

    public function __construct(InventoryBalance $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Tìm inventory balance theo sản phẩm và ngày
     */
    public function findByProductAndDate(int $productVariantId, Carbon $date)
    {
        return $this->findByCondition([
            ['product_variant_id', '=', $productVariantId],
            ['balance_date', '=', $date->format('Y-m-d')],
        ]);
    }

    /**
     * Lấy tồn kho tại thời điểm
     */
    public function getBalanceAtDate(int $productVariantId, Carbon $date): array
    {
        $balance = $this->findByProductAndDate($productVariantId, $date);

        if ($balance) {
            return [
                'quantity' => (float)$balance->quantity,
                'value' => (float)$balance->value,
                'average_cost' => (float)$balance->average_cost,
            ];
        }

        return [
            'quantity' => 0,
            'value' => 0,
            'average_cost' => 0,
        ];
    }

    /**
     * Cập nhật hoặc tạo mới balance
     */
    public function updateOrCreateBalance(int $productVariantId, Carbon $date, array $data)
    {
        return $this->updateOrCreate(
            [
                'product_variant_id' => $productVariantId,
                'balance_date' => $date->format('Y-m-d'),
            ],
            $data
        );
    }

    /**
     * Lấy danh sách tồn kho theo ngày
     */
    public function getBalancesByDate(Carbon $date, array $condition = [])
    {
        $query = $this->model->where('balance_date', $date->format('Y-m-d'));

        if (!empty($condition)) {
            foreach ($condition as $key => $value) {
                $query->where($key, $value);
            }
        }

        return $query->get();
    }
}