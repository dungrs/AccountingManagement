<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class PaymentVoucher extends Model
{
    use QueryScopes;

    protected $fillable = [
        'code',
        'payment_date',
        'supplier_id',
        'amount',
        'payment_method',
        'note',
        'status',
    ];

    /* ================= RELATIONS ================= */

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function journalEntry()
    {
        return $this->morphOne(JournalEntry::class, 'reference');
    }
}
