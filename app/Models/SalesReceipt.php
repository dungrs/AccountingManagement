<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesReceipt extends Model
{
    use QueryScopes, SoftDeletes;

    protected $table = 'sales_receipts';

    protected $fillable = [
        'code',
        'receipt_date',
        'customer_id',
        'user_id',
        'price_list_id',
        'total_amount',
        'vat_amount',
        'grand_total',
        'status',
        'note',
        'created_by'
    ];

    protected $casts = [
        'receipt_date' => 'date',
        'total_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'grand_total' => 'decimal:2'
    ];

    /* ================= RELATIONS ================= */

    /**
     * Khách hàng của phiếu xuất
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
     * Bảng giá áp dụng
     */
    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Chi tiết phiếu xuất
     */
    public function items()
    {
        return $this->hasMany(SalesReceiptItem::class);
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