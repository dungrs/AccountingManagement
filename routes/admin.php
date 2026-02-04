<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MessageController;
use App\Http\Controllers\Admin\ProfileController;


use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {

    Route::get('/dashboard/index', [DashboardController::class, 'index'])->name('admin.dashboard.index');

    Route::get('/user/{user}', [MessageController::class, 'byUser'])->name('admin.chat.user');
    Route::get('/group/{group}', [MessageController::class, 'byGroup'])->name('admin.chat.group');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('admin.profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('admin.profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('admin.profile.destroy');
});

Route::get('admin', [AuthController::class, 'login'])
    ->name('admin');

Route::post('login', [AuthController::class, 'store'])
    ->name('admin.login');

Route::post('logout', [AuthController::class, 'destroy'])
    ->name('admin.logout');


require __DIR__.'/auth.php';
