<?php

namespace App\Http\Controllers\Admin\Note;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Note\StoreCreditNoteRequest;
use App\Http\Requests\Note\UpdateCreditNoteRequest;
use App\Services\AccountingAccountService;
use App\Services\SystemService;
use App\Services\Customer\CustomerService;
use App\Services\SupplierService;
use App\Services\User\UserService;
use Illuminate\Http\Request;

use App\Services\Note\CreditNoteService;
use Inertia\Inertia;

class CreditNoteController extends Controller
{
    protected $creditNoteService;
    protected $userService;
    protected $customerService;
    protected $supplierService;
    protected $accountingAccountService;
    protected $systemService;

    public function __construct(
        CreditNoteService $creditNoteService,
        UserService $userService,
        AccountingAccountService $accountingAccountService,
        CustomerService $customerService,
        SupplierService $supplierService,
        SystemService $systemService,
    ) {
        $this->creditNoteService = $creditNoteService;
        $this->userService = $userService;
        $this->accountingAccountService = $accountingAccountService;
        $this->customerService = $customerService;
        $this->supplierService = $supplierService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị danh sách giấy báo có
     */
    public function index()
    {
        $this->authorize('modules', 'note.credit.index');
        return Inertia::render('CreditNote/Home');
    }

    /**
     * Lọc danh sách giấy báo có
     */
    public function filter(Request $request)
    {
        $this->authorize('modules', 'note.credit.index');

        $creditNotes = $this->creditNoteService->paginate($request);
        return response()->json($creditNotes);
    }

    /**
     * Hiển thị form tạo mới giấy báo có
     */
    public function create()
    {
        $this->authorize('modules', 'note.credit.create');
        
        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();
        $suppliers = $this->supplierService->getSupplierList();
        
        $accountingAccount = $this->accountingAccountService->getAccountingAccounts(
            [
                ['language_id', '=', 1]
            ],
            true
        );

        return Inertia::render('CreditNote/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'customers' => $customers,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Hiển thị form chỉnh sửa giấy báo có
     */
    public function edit($id)
    {
        $this->authorize('modules', 'note.credit.update');
        
        $creditNote = $this->creditNoteService->getCreditNoteDetail($id);
        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();
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

        $systemLanguages = $systems
            ->where('language_id', 1)
            ->pluck('content', 'keyword')
            ->toArray();

        return Inertia::render('CreditNote/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'credit_note' => $creditNote,
            'customers' => $customers,
            'suppliers' => $suppliers,
            'system_languages' => $systemLanguages
        ]);
    }

    /**
     * Lưu giấy báo có mới
     */
    public function store(StoreCreditNoteRequest $request)
    {
        try {
            $this->creditNoteService->create($request);
            return redirect()->route('admin.note.credit.index')->with('success', 'Thêm mới giấy báo có thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.note.credit.create')->with('error', 'Thêm mới giấy báo có thất bại: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật giấy báo có
     */
    public function update(UpdateCreditNoteRequest $request, $id)
    {
        try {
            $this->creditNoteService->update($request, $id);
            return redirect()->route('admin.note.credit.index')->with('success', 'Cập nhật giấy báo có thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.note.credit.edit', ['id' => $id])->with('error', 'Cập nhật giấy báo có thất bại: ' . $e->getMessage());
        }
    }

    /**
     * Xóa giấy báo có
     */
    public function delete($id)
    {
        $this->authorize('modules', 'note.credit.destroy');
        
        try {
            $this->creditNoteService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa giấy báo có thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Xuất PDF giấy báo có
     */
    public function export($id)
    {
        $this->authorize('modules', 'note.credit.export');
        
        try {
            $creditNote = $this->creditNoteService->getCreditNoteDetail($id);
            
            if (!$creditNote) {
                return redirect()->back()->with('error', 'Không tìm thấy giấy báo có.');
            }
            
            // TODO: Implement PDF export logic
            // return $pdf->download("credit_note_{$creditNote->code}.pdf");
            
            return redirect()->back()->with('info', 'Chức năng đang phát triển.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Xuất PDF thất bại: ' . $e->getMessage());
        }
    }

    /**
     * In giấy báo có
     */
    public function print($id)
    {
        $this->authorize('modules', 'note.credit.print');
        
        try {
            $creditNote = $this->creditNoteService->getCreditNoteDetail($id);
            
            if (!$creditNote) {
                return redirect()->back()->with('error', 'Không tìm thấy giấy báo có.');
            }
            
            return Inertia::render('CreditNote/Print', [
                'credit_note' => $creditNote,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'In giấy báo có thất bại: ' . $e->getMessage());
        }
    }
}