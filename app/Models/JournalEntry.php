<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use QueryScopes;

    protected $fillable = [
        'code',
        'entry_date',
        'reference_type',
        'reference_id',
        'note',
        'created_by',
    ];

    /* ================= RELATIONS ================= */

    public function details()
    {
        return $this->hasMany(JournalEntryDetail::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
