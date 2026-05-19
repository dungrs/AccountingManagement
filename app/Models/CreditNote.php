<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreditNote extends Model
{
    use QueryScopes, SoftDeletes;

    protected $table = 'credit_notes';

    protected $fillable = [
        'code',
        'issue_date',
        'customer_id',
        'supplier_id',
        'amount',
        'vat_rate',
        'vat_amount',
        'total_amount',
        'reason',
        'note',
        'type',
        'reference_type',
        'reference_id',
        'status',
        'created_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'amount' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /* ================= RELATIONS ================= */

    /**
     * Khách hàng (nếu báo có cho khách hàng)
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Nhà cung cấp (nếu báo có cho nhà cung cấp)
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Người tạo phiếu
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Tham chiếu đến chứng từ gốc (đa hình)
     */
    public function reference()
    {
        return $this->morphTo();
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

    /**
     * Công nợ nhà cung cấp liên quan
     */
    public function supplierDebts()
    {
        return $this->morphMany(SupplierDebt::class, 'reference');
    }
}