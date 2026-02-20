<?php

use App\Http\Controllers\Admin\AccountingAccountController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\Controller;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\Product\ProductController;
use App\Http\Controllers\Admin\User\UserCatalogueController;
use App\Http\Controllers\Admin\User\UserController;
use App\Http\Controllers\Admin\Attribute\AttributeCatalogueController;
use App\Http\Controllers\Admin\Attribute\AttributeController;
use App\Http\Controllers\Admin\BankController;
use App\Http\Controllers\Admin\Customer\CustomerCatalogueController;
use App\Http\Controllers\Admin\Customer\CustomerController;
use App\Http\Controllers\Admin\Debt\CustomerDebtController;
use App\Http\Controllers\Admin\Debt\SupplierDebtController;
use App\Http\Controllers\Admin\PriceListController;
use App\Http\Controllers\Admin\Product\ProductCatalogueController;
use App\Http\Controllers\Admin\Product\ProductVariantController;
use App\Http\Controllers\Admin\Receipt\PurchaseReceiptController;
use App\Http\Controllers\Admin\Receipt\SalesReceiptController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\SystemController;
use App\Http\Controllers\Admin\UnitController;
use App\Http\Controllers\Admin\VatTaxController;
use App\Http\Controllers\Admin\Voucher\PaymentVoucherController;
use App\Http\Controllers\Admin\Voucher\ReceiptVoucherController;
use App\Http\Controllers\LocationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    // DASHBOARD
    Route::get('/dashboard/index', [DashboardController::class, 'index'])->name('admin.dashboard.index');

    // PRODUCT
    Route::prefix('product')->group(function () {
        Route::get('index', [ProductController::class, 'index'])->name('admin.product.index');
        Route::get('create', [ProductController::class, 'create'])->name('admin.product.create');
        Route::get('edit/{id}', [ProductController::class, 'edit'])->name('admin.product.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [ProductController::class, 'filter'])->name('admin.product.filter');
        Route::post('store', [ProductController::class, 'store'])->name('admin.product.store');
        Route::put('update/{id}', [ProductController::class, 'update'])->name('admin.product.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [ProductController::class, 'delete'])->name('admin.product.delete')->where(['id' => '[0-9]+']);
        Route::get('/loadVariant', [ProductController::class, 'loadVariant'])->name('admin.product.loadVariant');
    });

    // PRODUCT CATALOGUE
    Route::prefix('product/catalogue')->group(function () {
        Route::get('index', [ProductCatalogueController::class, 'index'])->name('admin.product.catalogue.index');
        Route::get('create', [ProductCatalogueController::class, 'create'])->name('admin.product.catalogue.create');
        Route::get('edit/{id}', [ProductCatalogueController::class, 'edit'])->name('admin.product.catalogue.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [ProductCatalogueController::class, 'filter'])->name('admin.product.catalogue.filter');
        Route::post('store', [ProductCatalogueController::class, 'store'])->name('admin.product.catalogue.store');
        Route::put('update/{id}', [ProductCatalogueController::class, 'update'])->name('admin.product.catalogue.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [ProductCatalogueController::class, 'delete'])->name('admin.product.catalogue.delete')->where(['id' => '[0-9]+']);
    });

    // PRODUCT VARIANT
    Route::prefix('product/variant')->group(function () {
        Route::get('index', [ProductVariantController::class, 'index'])->name('admin.product.variant.index');

        Route::post('filter', [ProductVariantController::class, 'filter'])->name('admin.product.variant.filter');
        Route::post('update', [ProductVariantController::class, 'update'])->name('admin.product.variant.update');
    });

    // ATTRIBUTE CATALOGUE
    Route::prefix('attribute/catalogue')->group(function () {
        Route::get('index', [AttributeCatalogueController::class, 'index'])->name('admin.attribute.catalogue.index');
        Route::get('create', [AttributeCatalogueController::class, 'create'])->name('admin.attribute.catalogue.create');
        Route::get('edit/{id}', [AttributeCatalogueController::class, 'edit'])->name('admin.attribute.catalogue.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [AttributeCatalogueController::class, 'filter'])->name('admin.attribute.catalogue.filter');
        Route::post('store', [AttributeCatalogueController::class, 'store'])->name('admin.attribute.catalogue.store');
        Route::put('update/{id}', [AttributeCatalogueController::class, 'update'])->name('admin.attribute.catalogue.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [AttributeCatalogueController::class, 'delete'])->name('admin.attribute.catalogue.delete')->where(['id' => '[0-9]+']);
    });

    // ATTRIBUTE
    Route::prefix('attribute')->group(function () {
        Route::get('index', [AttributeController::class, 'index'])->name('admin.attribute.index');
        Route::get('create', [AttributeController::class, 'create'])->name('admin.attribute.create');
        Route::get('edit/{id}', [AttributeController::class, 'edit'])->name('admin.attribute.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [AttributeController::class, 'filter'])->name('admin.attribute.filter');
        Route::post('store', [AttributeController::class, 'store'])->name('admin.attribute.store');
        Route::put('update/{id}', [AttributeController::class, 'update'])->name('admin.attribute.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [AttributeController::class, 'delete'])->name('admin.attribute.delete')->where(['id' => '[0-9]+']);
        Route::get('getAttribute', [AttributeController::class, 'getAttribute'])->name('admin.attribute.getAttribute');
    });

    // CUSTOMER CATALOGUE
    Route::prefix('customer/catalogue')->group(function () {
        Route::get('index', [CustomerCatalogueController::class, 'index'])->name('admin.customer.catalogue.index');

        Route::post('filter', [CustomerCatalogueController::class, 'filter'])->name('admin.customer.catalogue.filter');
        Route::post('store', [CustomerCatalogueController::class, 'store'])->name('admin.customer.catalogue.store');
        Route::post('update', [CustomerCatalogueController::class, 'update'])->name('admin.customer.catalogue.update');
        Route::post('delete', [CustomerCatalogueController::class, 'delete'])->name('admin.customer.catalogue.delete');
        Route::get('permission', [CustomerCatalogueController::class, 'permission'])->name('admin.customer.catalogue.permission');
    });

    // CUSTOMER
    Route::prefix('customer')->group(function () {
        Route::get('index', [CustomerController::class, 'index'])->name('admin.customer.index');

        Route::post('filter', [CustomerController::class, 'filter'])->name('admin.customer.filter');
        Route::post('store', [CustomerController::class, 'store'])->name('admin.customer.store');
        Route::post('update', [CustomerController::class, 'update'])->name('admin.customer.update');
        Route::post('delete', [CustomerController::class, 'delete'])->name('admin.customer.delete');
    });

    // SUPPLIER
    Route::prefix('supplier')->group(function () {
        Route::get('index', [SupplierController::class, 'index'])->name('admin.supplier.index');
        Route::get('create', [SupplierController::class, 'create'])->name('admin.supplier.create');
        Route::get('edit/{id}', [SupplierController::class, 'edit'])->name('admin.supplier.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [SupplierController::class, 'filter'])->name('admin.supplier.filter');
        Route::post('store', [SupplierController::class, 'store'])->name('admin.supplier.store');
        Route::put('update/{id}', [SupplierController::class, 'update'])->name('admin.supplier.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [SupplierController::class, 'delete'])->name('admin.supplier.delete')->where(['id' => '[0-9]+']);
    });

    // USER CATALOGUE
    Route::prefix('user/catalogue')->group(function () {
        Route::get('index', [UserCatalogueController::class, 'index'])->name('admin.user.catalogue.index');

        Route::post('filter', [UserCatalogueController::class, 'filter'])->name('admin.user.catalogue.filter');
        Route::post('store', [UserCatalogueController::class, 'store'])->name('admin.user.catalogue.store');
        Route::post('update', [UserCatalogueController::class, 'update'])->name('admin.user.catalogue.update');
        Route::post('delete', [UserCatalogueController::class, 'delete'])->name('admin.user.catalogue.delete');
        Route::get('permission', [UserCatalogueController::class, 'permission'])->name('admin.user.catalogue.permission');
    });

    // USER
    Route::prefix('user')->group(function () {
        Route::get('index', [UserController::class, 'index'])->name('admin.user.index');

        Route::post('filter', [UserController::class, 'filter'])->name('admin.user.filter');
        Route::post('store', [UserController::class, 'store'])->name('admin.user.store');
        Route::post('update', [UserController::class, 'update'])->name('admin.user.update');
        Route::post('delete', [UserController::class, 'delete'])->name('admin.user.delete');
    });

    // BANK
    Route::prefix('bank')->group(function () {
        Route::get('index', [BankController::class, 'index'])->name('admin.bank.index');

        Route::post('filter', [BankController::class, 'filter'])->name('admin.bank.filter');
        Route::post('store', [BankController::class, 'store'])->name('admin.bank.store');
        Route::post('update', [BankController::class, 'update'])->name('admin.bank.update');
        Route::post('delete', [BankController::class, 'delete'])->name('admin.bank.delete');
    });

    // PERMISSION
    Route::prefix('permission')->group(function () {
        Route::get('index', [PermissionController::class, 'index'])->name('admin.permission.index');

        Route::post('filter', [PermissionController::class, 'filter'])->name('admin.permission.filter');
        Route::post('store', [PermissionController::class, 'store'])->name('admin.permission.store');
        Route::post('update', [PermissionController::class, 'update'])->name('admin.permission.update');
        Route::post('delete', [PermissionController::class, 'delete'])->name('admin.permission.delete');
        Route::post('updatePermission', [UserCatalogueController::class, 'updatePermission'])->name('admin.user.catalogue.updatePermission');
    });

    // VAT TAX
    Route::prefix('vattax')->group(function () {
        Route::get('index', [VatTaxController::class, 'index'])->name('admin.vattax.index');

        Route::post('filter', [VatTaxController::class, 'filter'])->name('admin.vattax.filter');
        Route::post('store', [VatTaxController::class, 'store'])->name('admin.vattax.store');
        Route::post('update', [VatTaxController::class, 'update'])->name('admin.vattax.update');
        Route::post('delete', [VatTaxController::class, 'delete'])->name('admin.vattax.delete');
    });

    // ACCCOUNTING ACCOUNT
    Route::prefix('accounting_account')->group(function () {
        Route::get('index', [AccountingAccountController::class, 'index'])->name('admin.accounting_account.index');

        Route::post('filter', [AccountingAccountController::class, 'filter'])->name('admin.accounting_account.filter');
        Route::post('store', [AccountingAccountController::class, 'store'])->name('admin.accounting_account.store');
        Route::post('update', [AccountingAccountController::class, 'update'])->name('admin.accounting_account.update');
        Route::post('delete', [AccountingAccountController::class, 'delete'])->name('admin.accounting_account.delete');
    });

    // PRICE LIST
    Route::prefix('price-list')->group(function () {
        Route::get('index', [PriceListController::class, 'index'])->name('admin.price.list.index');
        Route::get('create', [PriceListController::class, 'create'])->name('admin.price.list.create');
        Route::get('edit/{id}', [PriceListController::class, 'edit'])->name('admin.price.list.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [PriceListController::class, 'filter'])->name('admin.price.list.filter');
        Route::post('store', [PriceListController::class, 'store'])->name('admin.price.list.store');
        Route::put('update/{id}', [PriceListController::class, 'update'])->name('admin.price.list.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [PriceListController::class, 'delete'])->name('admin.price.list.delete')->where(['id' => '[0-9]+']);
        Route::post('getDetails/{id}', [PriceListController::class, 'getDetails'])->name('admin.price.list.getDetails')->where(['id' => '[0-9]+']);
    });

    // PURCHASE RECEIPT
    Route::prefix('receipt/purchase')->group(function () {
        Route::get('index', [PurchaseReceiptController::class, 'index'])->name('admin.receipt.purchase.index');
        Route::get('create', [PurchaseReceiptController::class, 'create'])->name('admin.receipt.purchase.create');
        Route::get('edit/{id}', [PurchaseReceiptController::class, 'edit'])->name('admin.receipt.purchase.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [PurchaseReceiptController::class, 'filter'])->name('admin.receipt.purchase.filter');
        Route::post('store', [PurchaseReceiptController::class, 'store'])->name('admin.receipt.purchase.store');
        Route::put('update/{id}', [PurchaseReceiptController::class, 'update'])->name('admin.receipt.purchase.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [PurchaseReceiptController::class, 'delete'])->name('admin.receipt.purchase.delete')->where(['id' => '[0-9]+']);
    });

    // SALES RECEIPT
    Route::prefix('receipt/sales')->group(function () {
        Route::get('index', [SalesReceiptController::class, 'index'])->name('admin.receipt.sales.index');
        Route::get('create', [SalesReceiptController::class, 'create'])->name('admin.receipt.sales.create');
        Route::get('edit/{id}', [SalesReceiptController::class, 'edit'])->name('admin.receipt.sales.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [SalesReceiptController::class, 'filter'])->name('admin.receipt.sales.filter');
        Route::post('store', [SalesReceiptController::class, 'store'])->name('admin.receipt.sales.store');
        Route::put('update/{id}', [SalesReceiptController::class, 'update'])->name('admin.receipt.sales.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [SalesReceiptController::class, 'delete'])->name('admin.receipt.sales.delete')->where(['id' => '[0-9]+']);
    });


    // PAYMENT VOUCHER
    Route::prefix('voucher/payment')->group(function () {
        Route::get('index', [PaymentVoucherController::class, 'index'])->name('admin.voucher.payment.index');
        Route::get('create', [PaymentVoucherController::class, 'create'])->name('admin.voucher.payment.create');
        Route::get('edit/{id}', [PaymentVoucherController::class, 'edit'])->name('admin.voucher.payment.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [PaymentVoucherController::class, 'filter'])->name('admin.voucher.payment.filter');
        Route::post('store', [PaymentVoucherController::class, 'store'])->name('admin.voucher.payment.store');
        Route::put('update/{id}', [PaymentVoucherController::class, 'update'])->name('admin.voucher.payment.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [PaymentVoucherController::class, 'delete'])->name('admin.voucher.payment.delete')->where(['id' => '[0-9]+']);
    });

    // RECEIPT VOUCHER
    Route::prefix('voucher/receipt')->group(function () {
        Route::get('index', [ReceiptVoucherController::class, 'index'])->name('admin.voucher.receipt.index');
        Route::get('create', [ReceiptVoucherController::class, 'create'])->name('admin.voucher.receipt.create');
        Route::get('edit/{id}', [ReceiptVoucherController::class, 'edit'])->name('admin.voucher.receipt.edit')->where(['id' => '[0-9]+']);

        Route::post('filter', [ReceiptVoucherController::class, 'filter'])->name('admin.voucher.receipt.filter');
        Route::post('store', [ReceiptVoucherController::class, 'store'])->name('admin.voucher.receipt.store');
        Route::put('update/{id}', [ReceiptVoucherController::class, 'update'])->name('admin.voucher.receipt.update')->where(['id' => '[0-9]+']);
        Route::post('delete/{id}', [ReceiptVoucherController::class, 'delete'])->name('admin.voucher.receipt.delete')->where(['id' => '[0-9]+']);
    });

    // DEBT SUPPLIER
    Route::prefix('debt/supplier')->group(function () {
        Route::get('index', [SupplierDebtController::class, 'index'])->name('admin.debt.supplier.index');
        Route::post('filter', [SupplierDebtController::class, 'filter'])->name('admin.debt.supplier.filter');
        Route::get('details/{supplier_id}', [SupplierDebtController::class, 'details'])->name('admin.debt.supplier.details')->where(['supplier_id' => '[0-9]+']);
    });

    // DEBT CUSTOMER
    Route::prefix('debt/customer')->group(function () {
        Route::get('index', [CustomerDebtController::class, 'index'])->name('admin.debt.customer.index');
        Route::post('filter', [CustomerDebtController::class, 'filter'])->name('admin.debt.customer.filter');
        Route::get('details/{customer_id}', [CustomerDebtController::class, 'details'])->name('admin.debt.customer.details')->where(['customer_id' => '[0-9]+']);
    });

    // UNIT
    Route::prefix('unit')->group(function () {
        Route::get('index', [UnitController::class, 'index'])->name('admin.unit.index');

        Route::post('filter', [UnitController::class, 'filter'])->name('admin.unit.filter');
        Route::post('store', [UnitController::class, 'store'])->name('admin.unit.store');
        Route::post('update', [UnitController::class, 'update'])->name('admin.unit.update');
        Route::post('delete', [UnitController::class, 'delete'])->name('admin.unit.delete');
    });

    // SYSTEM
    Route::prefix('system')->group(function () {
        Route::get('index', [SystemController::class, 'index'])->name('admin.system.index');
        Route::post('create', [SystemController::class, 'create'])->name('admin.system.create');
    });

    Route::post('/changeStatus/{id}', [Controller::class, 'changeStatus'])->name('admin.changeStatus');
    Route::post('/changeStatusAll', [Controller::class, 'changeStatusAll'])->name('admin.changeStatusAll');
});

Route::get('admin', [AuthController::class, 'login'])
    ->name('admin');

Route::post('login', [AuthController::class, 'store'])
    ->name('admin.login');

Route::post('logout', [AuthController::class, 'destroy'])
    ->name('admin.logout');

Route::post('/location/getLocation', [LocationController::class, 'getLocation'])->name('location.getLocation');

require __DIR__ . '/auth.php';
