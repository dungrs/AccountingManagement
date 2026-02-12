<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Model;

class VatTax extends Model
{
    use HasFactory, Notifiable, QueryScopes;
    protected $table = 'vat_taxes';
    protected $fillable = [
        'code',        // R10, V8...
        'name',        // VAT đầu ra 10%
        'rate',        // 10.00
        'direction',   // input | output
        'description',
        'publish',
    ];

    // Thuế đầu ra được dùng trong bảng giá
    public function priceListItems()
    {
        return $this->hasMany(PriceListItem::class, 'output_tax_id');
    }
}
