<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use App\Traits\QueryScopes;


class Bank extends Model
{
    use HasFactory, Notifiable, QueryScopes;

    protected $table = 'banks';

    protected $fillable = [
        'id',
        'bank_code',
        'name',
        'short_name',
        'swift_code',
        'bin_code',
        'logo',
        'user_id',
        'publish'
    ];

    // Bank thuộc về 1 user
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // 1 bank có nhiều tài khoản supplier
    public function supplierAccounts()
    {
        return $this->hasMany(
            SupplierBankAccount::class,
            'bank_code',    // FK trong supplier_bank_accounts
            'bank_code'     // key trong banks
        );
    }

    // Bank có nhiều supplier thông qua supplier_bank_accounts
    public function suppliers()
    {
        return $this->belongsToMany(
            Supplier::class,
            'supplier_bank_accounts',
            'bank_code',       // pivot.bank_code
            'supplier_code',   // pivot.supplier_code
            'bank_code',       // banks.bank_code
            'supplier_code'    // suppliers.supplier_code
        )->withPivot(['account_number'])
            ->withTimestamps();
    }
}
