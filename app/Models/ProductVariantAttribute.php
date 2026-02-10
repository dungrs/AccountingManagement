<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\QueryScopes;

class ProductVariantAttribute extends Model
{
    use HasApiTokens, HasFactory, Notifiable, QueryScopes;

    protected $table = 'product_variant_attributes';

    protected $fillable = [
        'product_variant_id',
        'attribute_id'
    ];
}