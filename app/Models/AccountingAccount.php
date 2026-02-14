<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class AccountingAccount extends Model
{
    use SoftDeletes, QueryScopes, Notifiable;

    protected $table = 'accounting_accounts';

    protected $fillable = [
        'account_code',
        'parent_id',
        'account_type',
        'normal_balance',
        'level',
        'lft',
        'rgt',
        'publish',
        'user_id',
    ];

    public function languages()
    {
        return $this->belongsToMany(Language::class, 'accounting_account_languages', 'accounting_account_id', 'language_id')
            ->withPivot('name', 'description')
            ->withTimestamps();
    }

    public static function isNodeCheck($id = 0)
    {
        $attributeCatalogue = AccountingAccount::find($id);
        if ($attributeCatalogue->rgt - $attributeCatalogue->lft !== 1) {
            return false;
        }
        return true;
    }
}