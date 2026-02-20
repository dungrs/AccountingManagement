<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Relation::morphMap([
            'payment_voucher' => 'App\Models\PaymentVoucher',
            'purchase_receipt' => 'App\Models\PurchaseReceipt',
            'receipt_voucher' => 'App\Models\ReceiptVoucher',
            'sales_receipt' => 'App\Models\SaleReceipt',
            // Thêm các model khác nếu cần
        ]);
    }
}
