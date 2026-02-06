<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    use HasFactory;

    protected $table = 'provinces';

    protected $fillable = [
        'province_code',
        'name',
        'short_name',
        'code',
        'place_type',
        'country',
    ];

    /**
     * Province has many Wards
     * provinces.province_code -> wards.province_code
     */
    public function wards()
    {
        return $this->hasMany(
            Ward::class,
            'province_code',   // FK on wards table
            'province_code'    // local key on provinces table
        );
    }
}