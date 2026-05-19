<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;
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
            // Chứng từ thanh toán
            'payment_voucher' => 'App\Models\PaymentVoucher',
            'receipt_voucher' => 'App\Models\ReceiptVoucher',
            
            // Chứng từ mua bán
            'purchase_receipt' => 'App\Models\PurchaseReceipt',
            'sales_receipt' => 'App\Models\SalesReceipt',
            
            // Chứng từ điều chỉnh
            'sales_receipt_cogs' => 'App\Models\SalesReceipt',
            'sales_receipt_cancellation' => 'App\Models\SalesReceipt',
            
            // Giấy báo nợ và báo có
            'debit_note' => 'App\Models\DebitNote',
            'credit_note' => 'App\Models\CreditNote',
        ]);

        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }
}