<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use QueryScopes;

    protected $fillable = ['name', 'code', 'description', 'publish'];

    public function productVariants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
