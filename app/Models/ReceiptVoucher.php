<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class ReceiptVoucher extends Model
{
    use QueryScopes;

    protected $table = 'receipt_vouchers';

    protected $fillable = [
        'code',
        'voucher_date',
        'customer_id',
        'user_id',
        'amount',
        'payment_method',
        'customer_bank_account_id',
        'note',
        'status',
    ];

    protected $casts = [
        'voucher_date' => 'date',
        'amount' => 'decimal:2'
    ];

    /* ================= RELATIONS ================= */

    /**
     * Khách hàng
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Người tạo phiếu
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Các bút toán liên quan
     */
    public function journalEntries()
    {
        return $this->morphMany(JournalEntry::class, 'reference');
    }

    /**
     * Công nợ khách hàng liên quan
     */
    public function customerDebts()
    {
        return $this->morphMany(CustomerDebt::class, 'reference');
    }
}