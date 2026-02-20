<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Models\AccountingAccount;
use Illuminate\Support\Facades\DB;

class AccountingAccountRepository extends BaseRepository
{
    protected $model;

    public function __construct(AccountingAccount $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy danh sách tài khoản kèm ngôn ngữ
     */
    public function getAccountsWithLanguages(int $languageId = 1): array
    {
        $accounts = DB::table('accounting_accounts as aa')
            ->leftJoin('accounting_account_languages as aal', function ($join) use ($languageId) {
                $join->on('aa.id', '=', 'aal.accounting_account_id')
                    ->where('aal.language_id', '=', $languageId);
            })
            ->where('aa.publish', 1)
            ->select(
                'aa.id',
                'aa.account_code',
                'aal.name',
                'aa.normal_balance'
            )
            ->orderBy('aa.account_code', 'ASC')
            ->get();

        return $accounts->map(function ($account) {
            return [
                'id' => $account->id,
                'code' => $account->account_code,
                'name' => $account->name ?? $account->account_code,
                'normal_balance' => $account->normal_balance ?? 'debit',
                'display_name' => $account->account_code . ' - ' . ($account->name ?? $account->account_code)
            ];
        })->toArray();
    }

    /**
     * Lấy thông tin tài khoản theo ID hoặc code
     */
    public function getAccountInfo($accountId, $accountCode): ?array
    {
        $query = DB::table('accounting_accounts as aa')
            ->leftJoin('accounting_account_languages as aal', function ($join) {
                $join->on('aa.id', '=', 'aal.accounting_account_id')
                    ->where('aal.language_id', '=', 1);
            })
            ->select(
                'aa.id',
                'aa.account_code',
                'aal.name',
                'aa.normal_balance',
                'aa.parent_id',
                'aa.level'
            );

        if ($accountId) {
            $query->where('aa.id', $accountId);
        } elseif ($accountCode) {
            $query->where('aa.account_code', $accountCode);
        } else {
            $query->where('aa.account_code', '111');
        }

        $account = $query->first();

        if (!$account) {
            return null;
        }

        return [
            'id' => $account->id,
            'code' => $account->account_code,
            'name' => $account->name ?? $account->account_code,
            'normal_balance' => $account->normal_balance ?? 'debit',
            'parent_id' => $account->parent_id,
            'level' => $account->level
        ];
    }
}