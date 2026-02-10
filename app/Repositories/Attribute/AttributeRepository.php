<?php

namespace App\Repositories\Attribute;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Attribute\AttributeRepositoryInterface;
use App\Models\Attribute;
use Illuminate\Support\Facades\DB;

class AttributeRepository extends BaseRepository implements AttributeRepositoryInterface {
    protected $model;

    public function __construct(Attribute $model) {
        $this->model = $model;
    }

    public function whereRaw($request, $languageId) {
        $rawCondition = [];
    
        $attributeCatalogueId = $request->integer('attribute_catalogue_id');
        
        if ($attributeCatalogueId > 0) {
            $rawCondition['whereRaw'] = [
                [
                    "psp.attribute_catalogue_id IN (
                        SELECT pc1.id
                        FROM attribute_catalogues AS pc1
                        JOIN attribute_catalogue_languages AS pcl 
                            ON pc1.id = pcl.attribute_catalogue_id
                        JOIN attribute_catalogues AS pc2 
                            ON pc2.id = ?
                        WHERE pc1.lft >= pc2.lft
                            AND pc1.rgt <= pc2.rgt
                            AND pcl.language_id = ?
                    )",
                    [$attributeCatalogueId, $languageId]
                ]
            ];
        }
    
        return $rawCondition;
    }

    public function searchAttributes(int $attributeCatalogueId, int $languageId) {
        return DB::table('attributes')
            ->join('attribute_catalogue_attributes', 'attributes.id', '=', 'attribute_catalogue_attributes.attribute_id')
            ->join('attribute_languages', 'attributes.id', '=', 'attribute_languages.attribute_id')
            ->where('attribute_catalogue_attributes.attribute_catalogue_id', $attributeCatalogueId)
            ->where('attributes.publish', '=', 1)
            ->where('attribute_languages.language_id', $languageId)
            ->select('attributes.id', 'attribute_languages.name')
            ->get();
    }
    
    public function findAttributeByIdArray(array $attributeArray = [], int $languageId = 1) {
        return $this->model->select([
            'attributes.id',
            'attribute_languages.name',
            'attributes.attribute_catalogue_id'
        ])
        ->join('attribute_languages as attribute_languages', 'attribute_languages.attribute_id', '=', 'attributes.id')
        ->where('attribute_languages.language_id', $languageId)
        ->whereIn('attribute_languages.attribute_id', $attributeArray)
        ->get();
    }
}