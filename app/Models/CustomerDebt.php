<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class CustomerDebt extends Model
{
    use QueryScopes;

    protected $table = 'customer_debts';

    protected $fillable = [
        'customer_id',
        'reference_type',
        'reference_id',
        'debit',
        'credit',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2'
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
     * Chứng từ gốc (đa hình)
     */
    public function reference()
    {
        return $this->morphTo();
    }
}