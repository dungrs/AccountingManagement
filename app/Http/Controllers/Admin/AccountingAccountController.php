<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

use App\Services\AccountingAccountService;

use App\Classes\Nestedsetbie;
use App\Enums\AccountTypeEnum;
use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\AccountingAccount\DeleteAccountingAccountRequest;
use App\Http\Requests\AccountingAccount\StoreAccountingAccountRequest;
use App\Http\Requests\AccountingAccount\UpdateAccountingAccountRequest;
use Inertia\Inertia;

class AccountingAccountController extends Controller
{
    protected $accountingAccountService;
    protected $nestedSet;
    protected $languageId;

    public function __construct(AccountingAccountService $accountingAccountService)
    {
        $this->accountingAccountService = $accountingAccountService;
        $this->middleware(function ($request, $next) {
            $this->languageId = 1; // Tạm thời lấy bằng 1
            $this->initialize();
            return $next($request);
        });
        $this->initialize();
    }

    public function index()
    {
        $this->authorize('modules', 'accounting_account.index');
        $dropdown = $this->nestedSet->Dropdown();
        $accountTypes = AccountTypeEnum::options();
        return Inertia::render('AccountingAccount', [
            'dropdown' => $dropdown,
            'accountTypes' => $accountTypes
        ]);
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'accounting_account.index');
        $accountingAccounts = $this->accountingAccountService->paginate($request);
        return response()->json($accountingAccounts);
    }

    public function store(StoreAccountingAccountRequest $request)
    {   
        $this->authorize('modules', 'accounting_account.create');
        $this->accountingAccountService->create($request);

        try {

            return response()->json([
                'status' => 'success',
                'message' => 'Tạo tài khoản thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tạo tài khoản thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }


    public function update(UpdateAccountingAccountRequest $request)
    {   
        $this->authorize('modules', 'accounting_account.update');

        try {
            $id = $request->input('id');
            $this->accountingAccountService->update($request, $id, $this->languageId);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật tài khoản thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật tài khoản thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function delete(DeleteAccountingAccountRequest $request)
    {
        $this->authorize('modules', 'accounting_account.destroy');
        try {
            $id = $request->input('id');
            $this->accountingAccountService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa tài khoản thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function initialize()
    {
        $this->nestedSet = new Nestedsetbie([
            'table' => 'accounting_accounts',
            'foreignkey' => 'accounting_account_id',
            'language_id' => $this->languageId,
            'customLanguageTable' => true,  // Bật chế độ custom language table
            'languageTableName' => 'accounting_account_languages',
        ]);
    }
}
