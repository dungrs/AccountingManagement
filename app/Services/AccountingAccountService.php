<?php

namespace App\Services;

use App\Classes\Nestedsetbie;
use App\Services\Interfaces\AccountingAccountServiceInterface;
use App\Services\BaseService;
use App\Repositories\AccountingAccountRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AccountingAccountService extends BaseService implements AccountingAccountServiceInterface
{
    protected $accountingAccountRepository;
    protected $nestedSet;

    public function __construct(AccountingAccountRepository $accountingAccountRepository)
    {
        $this->accountingAccountRepository = $accountingAccountRepository;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;
        $languageId = 1;
        
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;
            
        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' => $publish,
            'where' => [
                ['aal.language_id', '=', $languageId]
            ]
        ];
        
        $extend['path'] = '/accounting_account/index';
        $extend['fieldSearch'] = ['name', 'account_code'];
        
        $join = [
            [
                'table' => 'accounting_account_languages as aal',
                'on' => [['aal.accounting_account_id', 'accounting_accounts.id']]
            ]
        ];
        
        $accountingAccounts = $this->accountingAccountRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['accounting_accounts.lft', 'ASC'],
            $join,
            ['languages']
        );

        return $accountingAccounts;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $languageId = 1;
            
            $accountingAccount = $this->createAccountingAccount($request);

            if (!$accountingAccount || $accountingAccount->id <= 0) {
                throw new \Exception('Tạo tài khoản kế toán thất bại.');
            }

            $this->updateLanguageForAccountingAccount(
                $request,
                $accountingAccount,
                $languageId
            );

            $this->initialize($languageId);
            $this->nestedSet();

            return $accountingAccount;
        });
    }

    public function update($request, $id, $languageId)
    {
        return DB::transaction(function () use ($request, $id, $languageId) {
            $accountingAccount = $this->accountingAccountRepository->findById($id);

            if (!$accountingAccount) {
                throw new \Exception('Tài khoản kế toán không tồn tại.');
            }

            $flag = $this->updateAccountingAccount($request, $id);

            if (!$flag) {
                throw new \Exception('Cập nhật tài khoản kế toán thất bại.');
            }

            $this->updateLanguageForAccountingAccount(
                $request,
                $accountingAccount,
                $languageId
            );

            $this->initialize($languageId);
            $this->nestedSet();

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $accountingAccount = $this->accountingAccountRepository->findById($id);

            if (!$accountingAccount) {
                throw new \Exception('Tài khoản kế toán không tồn tại.');
            }

            // Xóa language pivot
            $accountingAccount->languages()->detach();

            $deleted = $this->accountingAccountRepository->delete($id);

            if (!$deleted) {
                throw new \Exception('Xóa tài khoản kế toán thất bại.');
            }

            $this->initialize(1);
            $this->nestedSet->Get();
            $this->nestedSet->Recursive(0, $this->nestedSet->Set());
            $this->nestedSet->Action();

            return true;
        });
    }

    public function getAccountingAccounts($conditions, $multiple = false)
    {
        return $this->accountingAccountRepository->findByCondition(
            $conditions,
            $multiple,
            [
                [
                    'table' => 'accounting_account_languages as aal',
                    'on' => [['aal.accounting_account_id', '=', 'accounting_accounts.id']]
                ]
            ],
            ['accounting_accounts.lft' => 'ASC'],
            [
                'accounting_accounts.*',
                'aal.name',
                'aal.description',
                'aal.language_id',
            ]
        );
    }

    public function getAccountingAccountDetails($id, $languageId)
    {
        return $this->getAccountingAccounts([
            ['aal.language_id', '=', $languageId],
            ['accounting_accounts.id', '=', $id]
        ]);
    }

    public function getAccountingAccountOtherLanguages($id, $languageId)
    {
        return $this->getAccountingAccounts([
            ['aal.language_id', '!=', $languageId],
            ['accounting_accounts.id', '=', $id]
        ], true);
    }

    public function getAccountingAccountLanguages($languageId = 0)
    {
        return $this->getAccountingAccounts([
            ['aal.language_id', '=', $languageId == 0 ? 1 : $languageId]
        ], true);
    }

    // PRIVATE METHODS

    private function createAccountingAccount($request)
    {
        $payload = $request->only($this->payload());
        $payload['user_id'] = Auth::id();
        $payload['parent_id'] = $request->input('parent_id') ?? 0;
        return $this->accountingAccountRepository->create($payload);
    }

    private function updateAccountingAccount($request, $id)
    {
        $payload = $request->only($this->payload());
        $payload['user_id'] = Auth::id();
        $payload['parent_id'] = $request->input('parent_id') ?? 0;
        return $this->accountingAccountRepository->update($id, $payload);
    }

    private function updateLanguageForAccountingAccount($request, $accountingAccount, $languageId)
    {
        $payload = $this->formatLanguagePayload($request, $accountingAccount->id, $languageId);
        $accountingAccount->languages()->detach([$languageId]);
        return $this->accountingAccountRepository->createPivot($accountingAccount, $payload, 'languages');
    }

    private function payload()
    {
        return [
            'parent_id',
            'account_code',
            'account_type',
            'normal_balance',
            'publish',
        ];
    }

    private function payloadLanguage()
    {
        return ['name', 'description'];
    }

    private function formatLanguagePayload($request, $id, $languageId)
    {
        $payload = $request->only($this->payloadLanguage());
        $payload['accounting_account_id'] = $id;
        $payload['language_id'] = $languageId;
        return $payload;
    }

    private function initialize($languageId)
    {
        $this->nestedSet = new Nestedsetbie([
            'table' => 'accounting_accounts',
            'foreignkey' => 'accounting_account_id',
            'language_id' => $languageId,
            'customLanguageTable' => true,  // Bật chế độ custom language table
            'languageTableName' => 'accounting_account_languages',
        ]);
    }

    private function paginateSelect()
    {
        return [
            'accounting_accounts.id',
            'accounting_accounts.parent_id',
            'accounting_accounts.account_code',
            'accounting_accounts.account_type',
            'accounting_accounts.normal_balance',
            'accounting_accounts.level',
            'accounting_accounts.lft',
            'accounting_accounts.rgt',
            'accounting_accounts.publish',
            'aal.name',
            'aal.description',
            'aal.language_id',
        ];
    }
}