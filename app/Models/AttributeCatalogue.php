<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\QueryScopes;


class AttributeCatalogue extends Model
{
    use HasApiTokens, HasFactory, Notifiable, QueryScopes;

    protected $fillable = [
        'parent_id',
        'lft',
        'rgt',
        'level',
        'image',
        'icon',
        'album',
        'publish',
        'order',
        'user_id',
        'follow'
    ];

    protected $table = 'attribute_catalogues';

    public function languages() {
        return $this->belongsToMany(Language::class, 'attribute_catalogue_languages', 'attribute_catalogue_id', 'language_id')
        ->withPivot('name', 'canonical', 'meta_title', 'meta_keyword', 'meta_description', 'description')
        ->withTimestamps();
    }

    public function attributes() {
        return $this->belongsToMany(Attribute::class, 'attribute_catalogue_attributes', 'attribute_catalogue_id', 'attribute_id');
    }

    public static function isNodeCheck($id = 0) {
        $attributeCatalogue = AttributeCatalogue::find($id);
        if ($attributeCatalogue->rgt - $attributeCatalogue->lft !== 1) {
            return false;
        }
        return true;
    }
}