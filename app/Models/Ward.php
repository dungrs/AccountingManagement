<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ward extends Model
{
    use HasFactory;

    protected $table = 'wards';

    protected $fillable = [
        'ward_code',
        'name',
        'province_code',
    ];

    /**
     * Ward belongs to Province
     * wards.province_code -> provinces.province_code
     */
    public function province()
    {
        return $this->belongsTo(
            Province::class,
            'province_code',   // FK on wards table
            'province_code'    // owner key on provinces table
        );
    }
}