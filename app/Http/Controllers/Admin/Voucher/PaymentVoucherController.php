<?php

namespace App\Http\Controllers\Admin\Voucher;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Voucher\StorePaymentVoucherRequest;
use App\Http\Requests\Voucher\UpdatePaymentVoucherRequest;
use App\Services\AccountingAccountService;
use App\Services\SupplierService;
use App\Services\SystemService;
use App\Services\User\UserService;
use Illuminate\Http\Request;

use App\Services\Voucher\PaymentVoucherService;
use Inertia\Inertia;

class PaymentVoucherController extends Controller
{
    protected $paymentVoucherService;
    protected $userService;
    protected $supplierService;
    protected $accountingAccountService;
    protected $systemService;

    public function __construct(
        PaymentVoucherService $paymentVoucherService,
        UserService $userService,
        AccountingAccountService $accountingAccountService,
        SupplierService $supplierService,
        SystemService $systemService,
    ) {
        $this->paymentVoucherService = $paymentVoucherService;
        $this->userService = $userService;
        $this->accountingAccountService = $accountingAccountService;
        $this->supplierService = $supplierService;
        $this->systemService = $systemService;
    }


    public function index()
    {
        $this->authorize('modules', 'voucher.payment.index');
        return Inertia::render('PaymentVoucher/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'voucher.payment.index');

        $paymentVouchers = $this->paymentVoucherService->paginate($request);
        return response()->json($paymentVouchers);
    }

    public function create()
    {
        $this->authorize('modules', 'voucher.payment.create');
        $users = $this->userService->getUserList();
        $suppliers = $this->supplierService->getSupplierList();
        $accountingAccount = $this->accountingAccountService->getAccountingAccounts(
            [
                ['language_id', '=', 1]
            ],
            true
        );

        return Inertia::render('PaymentVoucher/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'suppliers' => $suppliers
        ]);
    }

    public function edit($id)
    {   
        $this->authorize('modules', 'voucher.payment.update');
        $paymentVoucher = $this->paymentVoucherService->getPaymentVoucherDetail($id);
        $users = $this->userService->getUserList();
        $suppliers = $this->supplierService->getSupplierList();

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
        
        return Inertia::render('PaymentVoucher/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'payment_voucher' => $paymentVoucher,
            'suppliers' => $suppliers,
            'system_languages' => $system_languages
        ]);
    }

    public function store(StorePaymentVoucherRequest $request)
    {   
        try {
            $this->paymentVoucherService->create($request);
            return redirect()->route('admin.voucher.payment.index')->with('success', 'Thêm mới phiếu nhập kho thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.voucher.payment.create')->with('error', 'Thêm mới phiếu nhập kho thất bại!');
        }
    }

    public function update(UpdatePaymentVoucherRequest $request, $id)
    {      
        try {
            $this->paymentVoucherService->update($request, $id);
            return redirect()->route('admin.voucher.payment.index')->with('success', 'Cập nhật phiếu nhập kho thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.voucher.payment.edit', ['id' => $id])->with('error', 'Cập nhật phiếu nhập kho thất bại!');
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'voucher.payment.destroy');
        try {
            $this->paymentVoucherService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa phiếu nhập kho thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
