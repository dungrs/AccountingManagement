<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasApiTokens, HasFactory, Notifiable, QueryScopes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */

    protected $table = 'languages';

    protected $fillable = [
        'name',
        'canonical',
        'image',
        'description',
        'publish',
        'current'
    ];


    public function languageable()
    {
        return $this->morphTo();
    }
}