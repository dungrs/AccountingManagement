<?php

namespace App\Repositories\Debt;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Debt\SupplierDebtRepositoryInterface;
use App\Models\SupplierDebt;
use Illuminate\Support\Facades\DB;

class SupplierDebtRepository extends BaseRepository implements SupplierDebtRepositoryInterface
{
    protected $model;

    public function __construct(SupplierDebt $model)
    {
        $this->model = $model;
    }

    /**
     * Lấy tổng công nợ phải trả
     */
    public function getTotalPayable(): float
    {
        return (float) $this->model->sum(DB::raw('credit - debit'));
    }

    /**
     * Lấy top nhà cung cấp công nợ
     */
    public function getTopCreditors(int $limit = 5): array
    {
        $topCreditors = $this->model
            ->join('suppliers', 'suppliers.id', '=', 'supplier_debts.supplier_id')
            ->select(
                'suppliers.id',
                'suppliers.name',
                DB::raw('SUM(credit - debit) as balance')
            )
            ->groupBy('suppliers.id', 'suppliers.name')
            ->having('balance', '>', 0)
            ->orderBy('balance', 'DESC')
            ->limit($limit)
            ->get();

        return $topCreditors->toArray();
    }

    /**
     * Lấy tổng hợp công nợ nhà cung cấp
     */
    public function getSupplierDebtSummary(): array
    {
        return [
            'payable' => $this->getTotalPayable(),
            'top_creditors' => $this->getTopCreditors(),
        ];
    }
}