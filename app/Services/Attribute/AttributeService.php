<?php

namespace App\Services\Attribute;

use App\Services\Interfaces\Attribute\AttributeServiceInterface;
use App\Services\BaseService;

use App\Repositories\Attribute\AttributeRepository;
use App\Repositories\Attribute\AttributeCatalogueRepository;
use App\Repositories\RouterRepository;

use App\Services\Attribute\AttributeCatalogueService;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AttributeService extends BaseService implements AttributeServiceInterface
{
    protected $attributeCatalogueRepository;
    protected $attributeRepository;
    protected $routerRepository;
    protected $attributeCatalogueService;

    public function __construct(
        AttributeCatalogueService $attributeCatalogueService,
        AttributeCatalogueRepository $attributeCatalogueRepository,
        AttributeRepository $attributeRepository,
        RouterRepository $routerRepository
    ) {
        $this->attributeRepository = $attributeRepository;
        $this->attributeCatalogueRepository = $attributeCatalogueRepository;
        $this->routerRepository = $routerRepository;
        $this->attributeCatalogueService = $attributeCatalogueService;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage');
        $page = $request->integer('page');
        $languageId = 1; // Tạm thời lấy language = 1
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;
        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' =>  $publish,
            'where' => [
                ['al.language_id', '=',  $languageId]
            ]
        ];
        $extend['path'] = '/attribute/index';
        $extend['fieldSearch'] = ['name'];

        $join = [
            [
                'table' => 'attribute_languages as al',
                'on' => [['al.attribute_id', 'attributes.id']]
            ],
        ];

        return $this->attributeRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['attributes.id', 'ASC'],
            $join,
            ['languages', 'attribute_catalogues'],
        );
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {

            $attribute = $this->createAttribute($request);

            if (!$attribute) {
                throw new \Exception("Tạo thuộc tính thất bại.");
            }

            $languageId     = 1;
            $controllerName = $this->getControllerMappings();

            $this->updateLanguageForAttribute($request, $attribute, $languageId);
            $this->ualoadCatalogueForAttribute($attribute, $request);
            $this->createRouter($request, $attribute, $controllerName, $languageId);

            return $attribute;
        });
    }

    public function update($request, $id, $languageId)
    {
        return DB::transaction(function () use ($request, $id, $languageId) {
            $attribute = $this->attributeRepository->findById($id);

            if (!$attribute) {
                throw new \Exception("Thuộc tính không tồn tại.");
            }

            $flag = $this->updateAttribute($request, $id);

            if (!$flag) {
                throw new \Exception("Cập nhật thuộc tính thất bại.");
            }

            $controllerName = $this->getControllerMappings();

            $this->updateLanguageForAttribute($request, $attribute, $languageId);
            $this->ualoadCatalogueForAttribute($attribute, $request);
            $this->updateRouter($request, $attribute, $controllerName, $languageId);

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $attribute = $this->attributeRepository->findById($id);

            if (!$attribute) {
                throw new \Exception("Thuộc tính không tồn tại.");
            }

            $this->attributeRepository->delete($id);

            $this->routerRepository->deleteByCondition([
                ['module_id', '=', $id],
                ['controllers', '=', 'App\Http\Controllers\Web\Attribute\AttributeController']
            ]);

            return true;
        });
    }

    public function getAttributes($conditions, $multiple = false)
    {
        return $this->attributeRepository->findByCondition(
            $conditions,
            $multiple,
            [
                [
                    'table' => 'attribute_languages as al',
                    'on' => [['al.attribute_id', 'attributes.id']]
                ]
            ],
            ['attributes.id' => 'DESC'],
            [
                'attributes.*',
                'al.name',
                'al.description',
                'al.content',
                'al.meta_title',
                'al.meta_keyword',
                'al.meta_description',
                'al.canonical',
                'al.language_id',
            ]
        );
    }

    public function getAttributeDetails($id, $languageId)
    {
        return $this->getAttributes([
            ['al.language_id', '=', $languageId],
            ['attributes.id', '=', $id]
        ]);
    }

    public function getAttributeOtherLanguages($id, $languageId)
    {
        return $this->getAttributes([
            ['al.language_id', '!=', $languageId],
            ['attributes.id', '=', $id]
        ], true);
    }

    public function getAttributeIn($attributeList, $languageId)
    {
        return $this->getAttributes([
            ['al.language_id', '=', $languageId],
            ['attributes.id', 'IN', $attributeList]
        ], true);
    }

    public function getAttributeAjax($request)
    {
        $payload = $request->input();
        $languageId = 1;
        $attributes = $this->attributeRepository->searchAttributes($payload['attribute_catalogue_id'], $languageId);
        return $attributes;
    }

    public function loadAttributeAjax($request, $languageId)
    {
        $payload = [
            'attribute' => json_decode(base64_decode($request->input('attribute')), TRUE),
            'attributeCatalogueId' => $request->input('attributeCatalogueId'),
        ];

        $attributeList = $payload['attribute'][$payload['attributeCatalogueId']];
        $attributes = [];
        if (count($attributeList)) {
            $attributes = $this->getAttributeIn($attributeList, $languageId);
        }

        $temp = [];
        if (count($attributes)) {
            foreach ($attributes as $value) {
                $temp[] = [
                    'id' => $value->id,
                    'name' => $value->name
                ];
            }
        }
        return response()->json([
            'status' => 'success',
            'data' => $temp,
        ], 201);
    }

    // WEB SERVICE
    public function getAttributeWeb($product, $languageId)
    {
        $attributeCatalogueId = array_keys(json_decode($product->attribute, true));
        $attrCatalogues = $this->attributeCatalogueService->getAttributeCatalogueWeb($attributeCatalogueId, $languageId);

        $attributeId = array_merge(...json_decode($product->attribute, true));
        $attrs = $this->attributeRepository->findAttributeByIdArray($attributeId, $languageId);
        if (!is_null($attrCatalogues)) {
            foreach ($attrCatalogues as $key => $val) {
                $tempAttributes = [];
                foreach ($attrs as $attr) {
                    if ($val->attribute_catalogue_id  == $attr->attribute_catalogue_id) {
                        $tempAttributes[] = $attr;
                    }
                }
                $val->attributes = $tempAttributes;
            }
        }

        $product->attributeCatalogue = $attrCatalogues;
        return $product;
    }

    public function getFilterList(array $attribute = [], $languageId)
    {
        $attributeCatalogueId = array_keys($attribute);
        $attributeId = array_unique(array_merge(...$attribute));
        $attributeCatalogues = $this->attributeCatalogueRepository->findByCondition(
            [
                ['attribute_catalogue_languages.language_id', '=', $languageId],
                ['attribute_catalogues.id', 'IN', $attributeCatalogueId],
                ['publish', '=', 2],
            ],
            true,
            [
                [
                    'table' => 'attribute_catalogue_languages',
                    'on' => [['attribute_catalogue_languages.attribute_catalogue_id', 'attribute_catalogues.id']]
                ]
            ],

            ['attribute_catalogues.id' => 'ASC'],
            [
                'attribute_catalogue_languages.*',
            ]
        );

        $attributes = $this->attributeRepository->findByCondition(
            [
                ['attribute_languages.language_id', '=', $languageId],
                ['attributes.id', 'IN', $attributeId],
                ['publish', '=', 2],
            ],
            true,
            [
                [
                    'table' => 'attribute_languages',
                    'on' => [['attribute_languages.attribute_id', 'attributes.id']]
                ]
            ],

            ['attributes.id' => 'ASC'],
            [
                'attributes.attribute_catalogue_id',
                'attribute_languages.*',
            ]
        );
        $attributesGrouped = [];
        foreach ($attributes as $attribute) {
            $attributesGrouped[$attribute->attribute_catalogue_id][] = $attribute;
        }

        foreach ($attributeCatalogues as $catalogue) {
            $catalogue->attributes = $attributesGrouped[$catalogue->attribute_catalogue_id] ?? [];
        }

        return $attributeCatalogues;
    }

    private function createAttribute($request)
    {
        $payload = $request->only($this->payload());
        $payload['album'] = $this->formatJson($request, 'album');
        $payload['user_id'] = Auth::id();
        return $this->attributeRepository->create($payload);
    }

    private function updateAttribute($request, $id)
    {
        $payload = $request->only($this->payload());
        $payload['album'] = $this->formatJson($request, 'album');
        $payload['user_id'] = Auth::id();
        return $this->attributeRepository->update($id, $payload);
    }

    private function updateLanguageForAttribute($request, $attribute, $languageId)
    {
        $payload = $this->formatLanguagePayload($request, $attribute->id, $languageId);
        $attribute->languages()->detach($languageId, $attribute->id);
        return $this->attributeRepository->createPivot($attribute, $payload, 'languages');
    }

    private function ualoadCatalogueForAttribute($attribute, $request)
    {
        $attribute->attribute_catalogues()->sync($this->catalogue($request));
    }

    private function catalogue($request)
    {
        if ($request->input('catalogues') != null) {
            return array_unique(
                array_merge(
                    $request->input('catalogues'),
                    [$request->attribute_catalogue_id]
                )
            );
        }

        return [$request->attribute_catalogue_id];
    }

    private function payload()
    {
        return ['attribute_catalogue_id', 'follow', 'publish', 'image', 'album'];
    }

    private function payloadLanguage()
    {
        return ['name', 'description', 'content', 'meta_title', 'meta_keyword', 'meta_description', 'canonical'];
    }

    private function formatLanguagePayload($request, $id, $languageId)
    {
        $payload = $request->only($this->payloadLanguage());
        $payload['attribute_id'] = $id;
        $payload['language_id'] = $languageId;
        return $payload;
    }

    private function getControllerMappings()
    {
        return [
            'parent' => 'Attribute',
            'child' => 'Attribute'
        ];
    }

    private function paginateSelect()
    {
        return [
            'attributes.id',
            'attributes.attribute_catalogue_id',
            'attributes.publish',
            'attributes.image',
            'attributes.follow',
            'al.name',
            'al.canonical',
            'al.language_id'
        ];
    }
}
