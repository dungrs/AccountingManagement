<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceList extends Model
{
    use QueryScopes, HasFactory;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'publish',
        'description',
        'user_id',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Bảng giá có nhiều dòng giá
    public function items()
    {
        return $this->hasMany(PriceListItem::class);
    }

    // Bảng giá áp dụng cho nhiều variant
    public function productVariants()
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'price_list_items'
        )->withPivot('sale_price', 'output_tax_id', 'status')
         ->withTimestamps();
    }

    // Người tạo bảng giá
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
