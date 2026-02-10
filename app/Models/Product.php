<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\QueryScopes;

class Product extends Model
{
    use HasApiTokens, HasFactory, Notifiable, QueryScopes;

    protected $fillable = [
        'image',
        'album',
        'made_in',
        'publish',
        'order',
        'user_id',
        'follow',
        'product_catalogue_id',
        'attributeCatalogue',
        'attribute',
        'variant'
    ];

    protected $table = 'products';

    protected $casts = [
        'variant' => 'json',
        'attribute' => 'json',
        'album' => 'json'
    ];

    public function languages() {
        return $this->belongsToMany(Language::class, 'product_languages', 'product_id', 'language_id')
                    ->withPivot('name', 'canonical', 'meta_title', 'meta_keyword', 'meta_description', 'description')
                    ->withTimestamps();
    }

    public function product_catalogues() {
        return $this->belongsToMany(ProductCatalogue::class, 'product_catalogue_products', 'product_id', 'product_catalogue_id');
    }

    public function product_variants() {
        return $this->hasMany(ProductVariant::class, 'product_id', 'id');
    }

    // public function promotions() {
    //     return $this->belongsToMany(Promotion::class, 'promotion_product_variant', 'product_id', 'promotion_id')
    //                 ->withPivot('variant_uuid', 'model')->withTimestamps();
    // }

    // public function orders() {
    //     return $this->belongsToMany(Order::class, 'order_products', 'product_id', 'order_id')
    //                 ->withPivot('uuid', 'name', 'qty', 'price', 'price_original', 'option');
    // }
    
    // public function reviews() {
    //     return $this->morphMany(Review::class, 'reviewable');
    // }
}