<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use App\Traits\QueryScopes;

class SupplierBankAccount extends Model
{
    use HasFactory, Notifiable, QueryScopes;

    protected $table = 'supplier_bank_accounts';

    protected $fillable = [
        'supplier_id',
        'bank_id',
        'account_number',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_code', 'id');
    }

    public function bank()
    {
        return $this->belongsTo(Bank::class, 'bank_id', 'id');
    }
}
