<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\Controller;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\User\UserCatalogueController;
use App\Http\Controllers\Admin\User\UserController;
use App\Http\Controllers\Admin\Attribute\AttributeCatalogueController;
use App\Http\Controllers\Admin\Attribute\AttributeController;
use App\Http\Controllers\LocationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    // DASHBOARD
    Route::get('/dashboard/index', [DashboardController::class, 'index'])->name('admin.dashboard.index');



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

    // PERMISSION
    Route::prefix('permission')->group(function () {
        Route::get('index', [PermissionController::class, 'index'])->name('admin.permission.index');

        Route::post('filter', [PermissionController::class, 'filter'])->name('admin.permission.filter');
        Route::post('store', [PermissionController::class, 'store'])->name('admin.permission.store');
        Route::post('update', [PermissionController::class, 'update'])->name('admin.permission.update');
        Route::post('delete', [PermissionController::class, 'delete'])->name('admin.permission.delete');
        Route::post('updatePermission', [UserCatalogueController::class, 'updatePermission'])->name('admin.user.catalogue.updatePermission');
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
