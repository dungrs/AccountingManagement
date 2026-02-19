<?php

namespace App\Http\Controllers\Admin\Receipt;

use Illuminate\Http\Request;

use App\Services\Receipt\SalesReceiptService;
use App\Services\Product\ProductVariantService;
use App\Repositories\VatTaxRepository;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Receipt\StoreSalesReceiptRequest;
use App\Http\Requests\Receipt\UpdateSalesReceiptRequest;
use App\Services\AccountingAccountService;
use App\Services\SystemService;
use App\Services\Customer\CustomerService;
use App\Services\User\UserService;
use App\Services\PriceListService;
use Inertia\Inertia;

class SalesReceiptController extends Controller
{
    protected $salesReceiptService;
    protected $vatTaxRepository;
    protected $productVariantService;
    protected $accountingAccountService;
    protected $userService;
    protected $systemService;
    protected $customerService;
    protected $priceListService;

    public function __construct(
        SalesReceiptService $salesReceiptService,
        ProductVariantService $productVariantService,
        VatTaxRepository $vatTaxRepository,
        AccountingAccountService $accountingAccountService,
        UserService $userService,
        SystemService $systemService,
        CustomerService $customerService,
        PriceListService $priceListService
    ) {
        $this->salesReceiptService = $salesReceiptService;
        $this->productVariantService = $productVariantService;
        $this->vatTaxRepository = $vatTaxRepository;
        $this->accountingAccountService = $accountingAccountService;
        $this->userService = $userService;
        $this->systemService = $systemService;
        $this->customerService = $customerService;
        $this->priceListService = $priceListService;
    }

    public function index()
    {
        $this->authorize('modules', 'receipt.sales.index');
        return Inertia::render('SalesReceipt/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'receipt.sales.index');

        $salesReceipts = $this->salesReceiptService->paginate($request);
        return response()->json($salesReceipts);
    }

    public function create()
    {
        $this->authorize('modules', 'receipt.sales.create');

        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();
        $priceLists = $this->priceListService->getPriceList();

        // Lọc thuế đầu ra (output)
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


        return Inertia::render('SalesReceipt/Form', [
            'product_variants' => $productVariants,
            'vat_taxes' => $vatTaxes,
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'customers' => $customers,
            'price_lists' => $priceLists
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'receipt.sales.update');

        $salesReceipt = $this->salesReceiptService->getSalesReceiptDetail($id);

        if (!$salesReceipt) {
            return redirect()->route('admin.receipt.sales.index')
                ->with('error', 'Phiếu xuất kho không tồn tại!');
        }

        $users = $this->userService->getUserList();
        $customers = $this->customerService->getCustomerList();
        $priceLists = $this->priceListService->getPriceList();

        // Lọc thuế đầu ra (output)
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

        return Inertia::render('SalesReceipt/Form', [
            'product_variants' => $productVariants,
            'vat_taxes' => $vatTaxes,
            'accounting_accounts' => $accountingAccount,
            'users' => $users,
            'customers' => $customers,
            'sales_receipt' => $salesReceipt,
            'system_languages' => $system_languages,
            'price_lists' => $priceLists
        ]);
    }

    public function store(StoreSalesReceiptRequest $request)
    {
        try {
            $this->salesReceiptService->create($request);
            return redirect()->route('admin.receipt.sales.index')
                ->with('success', 'Thêm mới phiếu xuất kho thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.receipt.sales.create')
                ->with('error', 'Thêm mới phiếu xuất kho thất bại: ' . $e->getMessage());
        }
    }

    public function update(UpdateSalesReceiptRequest $request, $id)
    {
        try {
            $this->salesReceiptService->update($request, $id);
            return redirect()->route('admin.receipt.sales.index')
                ->with('success', 'Cập nhật phiếu xuất kho thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.receipt.sales.edit', ['id' => $id])
                ->with('error', 'Cập nhật phiếu xuất kho thất bại: ' . $e->getMessage());
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'receipt.sales.destroy');

        try {
            $this->salesReceiptService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa phiếu xuất kho thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}