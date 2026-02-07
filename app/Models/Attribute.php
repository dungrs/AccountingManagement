<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\QueryScopes;

class Attribute extends Model
{
    use HasApiTokens, HasFactory, Notifiable, QueryScopes, SoftDeletes;

    protected $fillable = [
        'image',
        'album',
        'publish',
        'order',
        'user_id',
        'follow',
        'attribute_catalogue_id'
    ];

    protected $table = 'attributes';
    
    protected $casts = [
        'album' => 'json'
    ];

    public function languages() {
        return $this->belongsToMany(Language::class, 'attribute_languages', 'attribute_id', 'language_id')
                    ->withPivot('name', 'canonical', 'meta_title', 'meta_keyword', 'meta_description', 'description')
                    ->withTimestamps();
    }

    public function attribute_catalogues() {
        return $this->belongsToMany(AttributeCatalogue::class, 'attribute_catalogue_attributes', 'attribute_id', 'attribute_catalogue_id');
    }
}