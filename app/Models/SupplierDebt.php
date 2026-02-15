<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class SupplierDebt extends Model
{
    use QueryScopes;

    protected $fillable = [
        'supplier_id',
        'reference_type',
        'reference_id',
        'debit',
        'credit',
        'transaction_date',
    ];

    /* ================= RELATIONS ================= */

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
