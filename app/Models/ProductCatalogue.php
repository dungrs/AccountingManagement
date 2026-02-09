<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class ProductCatalogue extends Model
{
    use HasFactory, QueryScopes, Notifiable;

    protected $table = 'product_catalogues';

    protected $fillable = [
        'parent_id',
        'lft',
        'rgt',
        'level',
        'image',
        'icon',
        'album',
        'publish',
        'order',
        'user_id',
        'follow',
        'attribute',
    ];

    protected $casts = [
        'album' => 'json'
    ];

    public function languages() {
        return $this->belongsToMany(Language::class, 'product_catalogue_languages', 'product_catalogue_id', 'language_id')
                    ->withPivot('name', 'canonical', 'meta_title', 'meta_keyword', 'meta_description', 'description')
                    ->withTimestamps();
    }

    // public function products() {
    //     return $this->belongsToMany(Product::class, 'product_catalogue_products', 'product_catalogue_id', 'product_id')
    //                 ->with('languages');
    // }

    public static function isNodeCheck($id = 0) {
        $productCatalogue = ProductCatalogue::find($id);
        if ($productCatalogue->rgt - $productCatalogue->lft !== 1) {
            return false;
        }

        return true;
    }
}