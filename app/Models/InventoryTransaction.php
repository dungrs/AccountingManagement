<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryTransaction extends Model
{
    use SoftDeletes, QueryScopes;

    protected $table = 'inventory_transactions';

    protected $fillable = [
        'product_variant_id',
        'transaction_type', // inbound, outbound
        'quantity',
        'unit_cost',
        'total_cost',
        'reference_type', // purchase_receipt, sales_receipt, adjustment
        'reference_id',
        'transaction_date',
        'before_quantity',
        'before_value',
        'after_quantity',
        'after_value',
        'note',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_cost' => 'float',
        'total_cost' => 'float',
        'before_quantity' => 'float',
        'before_value' => 'float',
        'after_quantity' => 'float',
        'after_value' => 'float',
        'transaction_date' => 'date',
    ];

    public function productVariant()
    {
        return $this->belongsTo('App\Models\ProductVariant');
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo('App\Models\User', 'created_by');
    }
}
