<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class PaymentVoucher extends Model
{
    use QueryScopes;

    protected $fillable = [
        'code',
        'voucher_date',
        'supplier_id',
        'user_id',
        'amount',
        'payment_method',
        'supplier_bank_account_id',
        'note',
        'status',
    ];

    /* ================= RELATIONS ================= */

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function journalEntries()
    {
        return $this->morphMany(JournalEntry::class, 'reference');
    }

    public function supplierDebts()
    {
        return $this->morphMany(SupplierDebt::class, 'reference');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function supplierBankAccount()
    {
        return $this->belongsTo(SupplierBankAccount::class);
    }
}
