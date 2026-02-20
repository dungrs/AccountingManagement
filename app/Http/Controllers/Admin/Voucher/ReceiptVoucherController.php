<?php

namespace App\Http\Controllers\Admin\Voucher;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Voucher\StoreReceiptVoucherRequest;
use App\Http\Requests\Voucher\UpdateReceiptVoucherRequest;
use App\Services\AccountingAccountService;
use App\Services\SystemService;
use App\Services\Customer\CustomerService;
use App\Services\User\UserService;
use Illuminate\Http\Request;

use App\Services\Voucher\ReceiptVoucherService;
use Inertia\Inertia;

class ReceiptVoucherController extends Controller
{
    protected $receiptVoucherService;
    protected $userService;
    protected $customerService;
    protected $accountingAccountService;
    protected $systemService;

    public function __construct(
        ReceiptVoucherService $receiptVoucherService,
        UserService $userService,
        AccountingAccountService $accountingAccountService,
        CustomerService $customerService,
        SystemService $systemService,
    ) {
        $this->receiptVoucherService = $receiptVoucherService;
        $this->userService = $userService;
        $this->accountingAccountService = $accountingAccountService;
        $this->customerService = $customerService;
        $this->systemService = $systemService;
    }


    public function index()
    {
        $this->authorize('modules', 'voucher.receipt.index');
        return Inertia::render('ReceiptVoucher/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'voucher.receipt.index');

        $receiptVouchers = $this->receiptVoucherService->paginate($request);
        return response()->json($receiptVouchers);
    }

    public function create()
    {
        $this->authorize('modules', 'voucher.receipt.create');
        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();
        $accountingAccount = $this->accountingAccountService->getAccountingAccounts(
            [
                ['language_id', '=', 1]
            ],
            true
        );

        return Inertia::render('ReceiptVoucher/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'customers' => $customers
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'voucher.receipt.update');
        $receiptVoucher = $this->receiptVoucherService->getReceiptVoucherDetail($id);
        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();

        // Danh sách tài khoản kế toán
        $accountingAccount = $this->accountingAccountService->getAccountingAccounts(
            [
                ['language_id', '=', 1]
            ],
            true
        );

        // Lấy thông tin công ty lập phiếu
        $systems = $this->systemService->getSystemDetails();

        $system_languages = $systems
            ->where('language_id', 1)
            ->pluck('content', 'keyword')
            ->toArray();

        return Inertia::render('ReceiptVoucher/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'receipt_voucher' => $receiptVoucher,
            'customers' => $customers,
            'system_languages' => $system_languages
        ]);
    }

    public function store(StoreReceiptVoucherRequest $request)
    {
        try {
            $this->receiptVoucherService->create($request);
            return redirect()->route('admin.voucher.receipt.index')->with('success', 'Thêm mới phiếu thu thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.voucher.receipt.create')->with('error', 'Thêm mới phiếu thu thất bại: ' . $e->getMessage());
        }
    }

    public function update(UpdateReceiptVoucherRequest $request, $id)
    {
        try {
            $this->receiptVoucherService->update($request, $id);
            return redirect()->route('admin.voucher.receipt.index')->with('success', 'Cập nhật phiếu thu thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.voucher.receipt.edit', ['id' => $id])->with('error', 'Cập nhật phiếu thu thất bại: ' . $e->getMessage());
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'voucher.receipt.destroy');
        try {
            $this->receiptVoucherService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa phiếu thu thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}