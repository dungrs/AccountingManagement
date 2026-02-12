<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class PriceListItem extends Model
{
    use QueryScopes, Notifiable;

    protected $fillable = [
        'price_list_id',
        'product_variant_id',
        'sale_price',
        'output_tax_id',
        'publish',
    ];

    protected $casts = [
        'sale_price' => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    // Liên kết với bảng vat_taxes
    public function outputTax()
    {
        return $this->belongsTo(VatTax::class, 'output_tax_id');
    }
}
