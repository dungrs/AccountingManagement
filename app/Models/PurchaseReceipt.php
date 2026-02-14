<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReceipt extends Model
{
    use QueryScopes, SoftDeletes;

    protected $fillable = [
        'code',
        'receipt_date',
        'supplier_id',
        'total_amount',
        'vat_amount',
        'grand_total',
        'status',
        'note',
        'created_by',
        'user_id'
    ];

    /* ================= RELATIONS ================= */

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseReceiptItem::class);
    }

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class, 'reference_id')
            ->where('reference_type', 'purchase_receipt');
    }

    public function supplierDebts()
    {
        return $this->hasMany(SupplierDebt::class, 'reference_id')
            ->where('reference_type', 'purchase_receipt');
    }
}
