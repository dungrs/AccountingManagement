<?php

namespace App\Repositories\Journal;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Journal\JournalEntryDetailRepositoryInterface;
use App\Models\JournalEntryDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class JournalEntryDetailRepository extends BaseRepository implements JournalEntryDetailRepositoryInterface
{
    protected $model;

    public function __construct(JournalEntryDetail $model)
    {
        $this->model = $model;
    }

    /**
     * Lấy tổng số dư theo tài khoản trong khoảng thời gian
     */
    public function getTotalByAccountCode(string $accountCode, Carbon $startDate, Carbon $endDate, string $type = 'credit'): float
    {
        $field = ($type === 'credit') ? 'credit' : 'debit';

        $query = $this->model
            ->join('journal_entries as je', 'je.id', '=', 'journal_entry_details.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'journal_entry_details.account_id')
            ->where('aa.account_code', $accountCode)
            ->whereBetween('je.entry_date', [$startDate, $endDate]);

        if ($type === 'credit') {
            return (float) $query->sum('journal_entry_details.credit');
        } else {
            return (float) $query->sum('journal_entry_details.debit');
        }
    }

    /**
     * Lấy số dư tiền mặt và ngân hàng
     */
    public function getCashBalance(array $accountCodes = ['111', '112']): float
    {
        $totalDebit = $this->model
            ->join('journal_entries as je', 'je.id', '=', 'journal_entry_details.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'journal_entry_details.account_id')
            ->whereIn('aa.account_code', $accountCodes)
            ->sum('journal_entry_details.debit');

        $totalCredit = $this->model
            ->join('journal_entries as je', 'je.id', '=', 'journal_entry_details.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'journal_entry_details.account_id')
            ->whereIn('aa.account_code', $accountCodes)
            ->sum('journal_entry_details.credit');

        return (float) ($totalDebit - $totalCredit);
    }

    /**
     * Lấy tổng doanh thu
     */
    public function getTotalRevenue(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('5111', $startDate, $endDate, 'credit');
    }

    /**
     * Lấy tổng giảm trừ doanh thu
     */
    public function getTotalRevenueReduction(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('521', $startDate, $endDate, 'debit');
    }

    /**
     * Lấy tổng giá vốn
     */
    public function getTotalCOGS(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('632', $startDate, $endDate, 'debit');
    }

    /**
     * Lấy tổng chi phí bán hàng
     */
    public function getTotalSellingExpense(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('641', $startDate, $endDate, 'debit');
    }

    /**
     * Lấy tổng chi phí quản lý
     */
    public function getTotalAdminExpense(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('642', $startDate, $endDate, 'debit');
    }

    /**
     * Lấy tổng thu nhập khác
     */
    public function getTotalOtherIncome(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('711', $startDate, $endDate, 'credit');
    }

    /**
     * Lấy tổng chi phí khác
     */
    public function getTotalOtherExpense(Carbon $startDate, Carbon $endDate): float
    {
        return $this->getTotalByAccountCode('811', $startDate, $endDate, 'debit');
    }
}