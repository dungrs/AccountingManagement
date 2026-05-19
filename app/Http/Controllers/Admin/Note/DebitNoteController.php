<?php

namespace App\Http\Controllers\Admin\Note;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Note\StoreDebitNoteRequest;
use App\Http\Requests\Note\UpdateDebitNoteRequest;
use App\Services\AccountingAccountService;
use App\Services\SystemService;
use App\Services\Customer\CustomerService;
use App\Services\SupplierService;
use App\Services\User\UserService;
use Illuminate\Http\Request;

use App\Services\Note\DebitNoteService;
use Inertia\Inertia;

class DebitNoteController extends Controller
{
    protected $debitNoteService;
    protected $userService;
    protected $customerService;
    protected $supplierService;
    protected $accountingAccountService;
    protected $systemService;

    public function __construct(
        DebitNoteService $debitNoteService,
        UserService $userService,
        AccountingAccountService $accountingAccountService,
        CustomerService $customerService,
        SupplierService $supplierService,
        SystemService $systemService,
    ) {
        $this->debitNoteService = $debitNoteService;
        $this->userService = $userService;
        $this->accountingAccountService = $accountingAccountService;
        $this->customerService = $customerService;
        $this->supplierService = $supplierService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị danh sách giấy báo nợ
     */
    public function index()
    {
        $this->authorize('modules', 'note.debit.index');
        return Inertia::render('DebitNote/Home');
    }

    /**
     * Lọc danh sách giấy báo nợ
     */
    public function filter(Request $request)
    {
        $this->authorize('modules', 'note.debit.index');

        $debitNotes = $this->debitNoteService->paginate($request);
        return response()->json($debitNotes);
    }

    /**
     * Hiển thị form tạo mới giấy báo nợ
     */
    public function create()
    {
        $this->authorize('modules', 'note.debit.create');
        
        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();
        $suppliers = $this->supplierService->getSupplierList();
        
        $accountingAccount = $this->accountingAccountService->getAccountingAccounts(
            [
                ['language_id', '=', 1]
            ],
            true
        );

        return Inertia::render('DebitNote/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'customers' => $customers,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Hiển thị form chỉnh sửa giấy báo nợ
     */
    public function edit($id)
    {
        $this->authorize('modules', 'note.debit.update');
        
        $debitNote = $this->debitNoteService->getDebitNoteDetail($id);
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

        return Inertia::render('DebitNote/Form', [
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'debit_note' => $debitNote,
            'customers' => $customers,
            'suppliers' => $suppliers,
            'system_languages' => $systemLanguages
        ]);
    }

    /**
     * Lưu giấy báo nợ mới
     */
    public function store(StoreDebitNoteRequest $request)
    {
        try {
            $this->debitNoteService->create($request);
            return redirect()->route('admin.note.debit.index')->with('success', 'Thêm mới giấy báo nợ thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.note.debit.create')->with('error', 'Thêm mới giấy báo nợ thất bại: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật giấy báo nợ
     */
    public function update(UpdateDebitNoteRequest $request, $id)
    {
        try {
            $this->debitNoteService->update($request, $id);
            return redirect()->route('admin.note.debit.index')->with('success', 'Cập nhật giấy báo nợ thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.note.debit.edit', ['id' => $id])->with('error', 'Cập nhật giấy báo nợ thất bại: ' . $e->getMessage());
        }
    }

    /**
     * Xóa giấy báo nợ
     */
    public function delete($id)
    {
        $this->authorize('modules', 'note.debit.destroy');
        
        try {
            $this->debitNoteService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa giấy báo nợ thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Xuất PDF giấy báo nợ
     */
    public function export($id)
    {
        $this->authorize('modules', 'note.debit.export');
        
        try {
            $debitNote = $this->debitNoteService->getDebitNoteDetail($id);
            
            if (!$debitNote) {
                return redirect()->back()->with('error', 'Không tìm thấy giấy báo nợ.');
            }
            
            // TODO: Implement PDF export logic
            // return $pdf->download("debit_note_{$debitNote->code}.pdf");
            
            return redirect()->back()->with('info', 'Chức năng đang phát triển.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Xuất PDF thất bại: ' . $e->getMessage());
        }
    }

    /**
     * In giấy báo nợ
     */
    public function print($id)
    {
        $this->authorize('modules', 'note.debit.print');
        
        try {
            $debitNote = $this->debitNoteService->getDebitNoteDetail($id);
            
            if (!$debitNote) {
                return redirect()->back()->with('error', 'Không tìm thấy giấy báo nợ.');
            }
            
            return Inertia::render('DebitNote/Print', [
                'debit_note' => $debitNote,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'In giấy báo nợ thất bại: ' . $e->getMessage());
        }
    }
}