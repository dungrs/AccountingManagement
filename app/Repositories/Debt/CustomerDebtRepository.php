<?php

namespace App\Repositories\Debt;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Debt\CustomerDebtRepositoryInterface;
use App\Models\CustomerDebt;
use Illuminate\Support\Facades\DB;

class CustomerDebtRepository extends BaseRepository implements CustomerDebtRepositoryInterface
{
    protected $model;

    public function __construct(CustomerDebt $model)
    {
        $this->model = $model;
    }

    /**
     * Lấy tổng công nợ phải thu
     */
    public function getTotalReceivable(): float
    {
        return (float) $this->model->sum(DB::raw('debit - credit'));
    }

    /**
     * Lấy top khách hàng công nợ
     */
    public function getTopDebtors(int $limit = 5): array
    {
        $topDebtors = $this->model
            ->join('customers', 'customers.id', '=', 'customer_debts.customer_id')
            ->select(
                'customers.id',
                'customers.name',
                DB::raw('SUM(debit - credit) as balance')
            )
            ->groupBy('customers.id', 'customers.name')
            ->having('balance', '>', 0)
            ->orderBy('balance', 'DESC')
            ->limit($limit)
            ->get();

        return $topDebtors->toArray();
    }

    /**
     * Lấy tổng hợp công nợ khách hàng
     */
    public function getCustomerDebtSummary(): array
    {
        return [
            'receivable' => $this->getTotalReceivable(),
            'top_debtors' => $this->getTopDebtors(),
        ];
    }
}