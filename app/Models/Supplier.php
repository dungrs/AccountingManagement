<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\QueryScopes;

class Supplier extends Model
{   
    use HasFactory, QueryScopes;
    
    protected $table = 'suppliers';

    protected $fillable = [
        'id',
        'supplier_code',
        'name',
        'tax_code',
        'province_id',
        'ward_id',
        'avatar',
        'phone',
        'email',
        'description',
        'address',
        'fax',
        'user_id',
        'publish',
    ];

    // Supplier thuộc về 1 user
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // 1 supplier có nhiều tài khoản ngân hàng
    public function bankAccounts()
    {
        return $this->hasMany(
            SupplierBankAccount::class,
            'supplier_code',     // FK bên supplier_bank_accounts
            'supplier_code'      // key bên suppliers
        );
    }

    // Supplier có nhiều ngân hàng thông qua bảng supplier_bank_accounts
    public function banks()
    {
        return $this->belongsToMany(
            Bank::class,
            'supplier_bank_accounts',
            'supplier_code', // pivot.supplier_code
            'bank_code',     // pivot.bank_code
            'supplier_code', // suppliers.supplier_code
            'bank_code'      // banks.bank_code
        )->withPivot(['account_number'])
            ->withTimestamps();
    }
}
