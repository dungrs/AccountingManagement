<?php

namespace App\Http\Controllers\Admin\Receipt;

use Illuminate\Http\Request;

use App\Services\Receipt\PurchaseReceiptService;
use App\Services\Product\ProductVariantService;
use App\Repositories\VatTaxRepository;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Receipt\StorePurchaseReceiptRequest;
use App\Http\Requests\Receipt\UpdatePurchaseReceiptRequest;
use App\Services\AccountingAccountService;
use App\Services\SupplierService;
use App\Services\SystemService;
use App\Services\User\UserService;
use Inertia\Inertia;

class PurchaseReceiptController extends Controller
{
    protected $purchaseReceiptService;
    protected $vatTaxRepository;
    protected $productVariantService;
    protected $accountingAccountService;
    protected $userService;
    protected $systemService;
    protected $supplierService;

    public function __construct(
        PurchaseReceiptService $purchaseReceiptService,
        ProductVariantService $productVariantService,
        VatTaxRepository $vatTaxRepository,
        AccountingAccountService $accountingAccountService,
        UserService $userService,
        SystemService $systemService,
        SupplierService $supplierService
    ) {
        $this->purchaseReceiptService = $purchaseReceiptService;
        $this->productVariantService = $productVariantService;
        $this->vatTaxRepository = $vatTaxRepository;
        $this->accountingAccountService = $accountingAccountService;
        $this->userService = $userService;
        $this->systemService = $systemService;
        $this->supplierService = $supplierService;
    }

    public function index()
    {
        $this->authorize('modules', 'receipt.purchase.index');
        return Inertia::render('PurchaseReceipt/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'receipt.purchase.index');

        $purchaseReceipts = $this->purchaseReceiptService->paginate($request);
        return response()->json($purchaseReceipts);
    }

    public function create()
    {
        $this->authorize('modules', 'receipt.purchase.create');
        $users = $this->userService->getUserList();
        $suppliers = $this->supplierService->getSupplierList();
        $vatTaxes = $this->vatTaxRepository->findByCondition([
            ['direction', '=', 'output'],
            ['publish', '=', 1]
        ], true);
        $productVariants = $this->productVariantService->getListProductVariant();
        $accountingAccount = $this->accountingAccountService->getAccountingAccounts(
            [
                ['language_id', '=', 1]
            ],
            true
        );

        return Inertia::render('PurchaseReceipt/Form', [
            'product_variants' => $productVariants,
            'vat_taxes' => $vatTaxes,
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'suppliers' => $suppliers
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'receipt.purchase.update');
        $purchaseReceipt = $this->purchaseReceiptService->getPurchaseReceiptDetail($id);
        $users = $this->userService->getUserList();
        // Phiếu nhập kho chi tiết
        $suppliers = $this->supplierService->getSupplierList();
        $vatTaxes = $this->vatTaxRepository->findByCondition([
            ['direction', '=', 'output'],
            ['publish', '=', 1]
        ], true);
        // Danh sách biến thể sản phẩm
        $productVariants = $this->productVariantService->getListProductVariant();
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


        return Inertia::render('PurchaseReceipt/Form', [
            'product_variants' => $productVariants,
            'vat_taxes' => $vatTaxes,
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'purchase_receipt' => $purchaseReceipt,
            'suppliers' => $suppliers,
            'system_languages' => $system_languages
        ]);
    }

    public function store(StorePurchaseReceiptRequest $request)
    {   
        $this->purchaseReceiptService->create($request);
        try {
            return redirect()->route('admin.receipt.purchase.index')->with('success', 'Thêm mới phiếu nhập kho thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.receipt.purchase.create')->with('error', 'Thêm mới phiếu nhập kho thất bại!');
        }
    }

    public function update(UpdatePurchaseReceiptRequest $request, $id)
    {
        $this->purchaseReceiptService->update($request, $id);
        try {
            return redirect()->route('admin.receipt.purchase.index')->with('success', 'Cập nhật phiếu nhập kho thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.receipt.purchase.edit', ['id' => $id])->with('error', 'Cập nhật phiếu nhập kho thất bại!');
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'receipt.purchase.destroy');
        try {
            $this->purchaseReceiptService->delete($id);

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
