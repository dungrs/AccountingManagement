<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryBalance extends Model
{
    use SoftDeletes, QueryScopes;

    protected $table = 'inventory_balances';

    protected $fillable = [
        'product_variant_id',
        'balance_date',
        'quantity',
        'value',
        'average_cost',
    ];

    protected $casts = [
        'balance_date' => 'date',
        'quantity' => 'float',
        'value' => 'float',
        'average_cost' => 'float',
    ];

    public function productVariant()
    {
        return $this->belongsTo('App\Models\ProductVariant');
    }
}