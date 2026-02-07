<?php

namespace App\Services\Attribute;

use App\Classes\Nestedsetbie;

use App\Services\Interfaces\Attribute\AttributeCatalogueServiceInterface;
use App\Services\BaseService;

use App\Repositories\Attribute\AttributeCatalogueRepository;
use App\Repositories\RouterRepository;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AttributeCatalogueService extends BaseService implements AttributeCatalogueServiceInterface
{
    protected $attributeCatalogueRepository;
    protected $routerRepository;
    protected $nestedSet;

    public function __construct(AttributeCatalogueRepository $attributeCatalogueRepository, RouterRepository $routerRepository)
    {
        $this->attributeCatalogueRepository = $attributeCatalogueRepository;
        $this->routerRepository = $routerRepository;
    }

    public function paginate($request)
    {   
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;
        // Tạm thời lấy language_id = 1
        $languageId = 1;
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;
        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' => $publish,
            'where' => [
                ['acl.language_id', '=',  $languageId]
            ]
        ];
        $extend['path'] = '/attribute/catalogue/index';
        $extend['fieldSearch'] = ['name'];
        $join = [
            [
                'table' => 'attribute_catalogue_languages as acl',
                'on' => [['acl.attribute_catalogue_id', 'attribute_catalogues.id']]
            ]
        ];
        $attributeCatalogues = $this->attributeCatalogueRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['attribute_catalogues.lft', 'ASC'],
            $join,
            ['languages']
        );

        return $attributeCatalogues;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $attributeCatalogue = $this->createAttributeCatalogue($request);

            if (!$attributeCatalogue || $attributeCatalogue->id <= 0) {
                throw new \Exception('Tạo loại thuộc tính thất bại.');
            }

            $languageId = 1;
            $controllerName = $this->getControllerMappings();

            $this->updateLanguageForAttributeCatalogue(
                $request,
                $attributeCatalogue,
                $languageId
            );

            $this->createRouter(
                $request,
                $attributeCatalogue,
                $controllerName,
                $languageId
            );

            $this->initialize($languageId);
            $this->nestedSet();

            return $attributeCatalogue;
        });
    }

    public function update($request, $id, $languageId)
    {
        return DB::transaction(function () use ($request, $id, $languageId) {
            $attributeCatalogue = $this->attributeCatalogueRepository->findById($id);

            if (!$attributeCatalogue) {
                throw new \Exception('Loại thuộc tính không tồn tại.');
            }

            $flag = $this->updateAttributeCatalogue($request, $id);

            if (!$flag) {
                throw new \Exception('Cập nhật loại thuộc tính thất bại.');
            }

            $controllerName = $this->getControllerMappings();

            $this->updateLanguageForAttributeCatalogue(
                $request,
                $attributeCatalogue,
                $languageId
            );

            $this->updateRouter(
                $request,
                $attributeCatalogue,
                $controllerName,
                $languageId
            );

            $this->initialize($languageId);
            $this->nestedSet();

            return true;
        });
    }


    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $attributeCatalogue = $this->attributeCatalogueRepository->findById($id);

            if (!$attributeCatalogue) {
                throw new \Exception('Loại thuộc tính không tồn tại.');
            }

            $deleted = $this->attributeCatalogueRepository->delete($id);

            if (!$deleted) {
                throw new \Exception('Xóa loại thuộc tính thất bại.');
            }

            $this->routerRepository->deleteByCondition([
                ['module_id', '=', $id],
                ['controllers', '=', 'App\Http\Controllers\Web\Attribute\AttributeCatalogueController']
            ]);

            $this->initialize(1);
            $this->nestedSet->Get();
            $this->nestedSet->Recursive(0, $this->nestedSet->Set());
            $this->nestedSet->Action();

            return true;
        });
    }


    public function getAttributeCatalogues($conditions, $multiple = false)
    {
        return $this->attributeCatalogueRepository->findByCondition(
            $conditions,
            $multiple,
            [
                [
                    'table' => 'attribute_catalogue_languages as acl',
                    'on' => [['acl.attribute_catalogue_id', 'attribute_catalogues.id']]
                ]
            ],
            ['attribute_catalogues.id' => 'DESC'],
            [
                'attribute_catalogues.*',
                'acl.name',
                'acl.description',
                'acl.content',
                'acl.meta_title',
                'acl.meta_keyword',
                'acl.meta_description',
                'acl.canonical',
                'acl.language_id',
            ]
        );
    }

    public function getAttributeCatalogueDetails($id, $languageId)
    {
        return $this->getAttributeCatalogues([
            ['acl.language_id', '=', $languageId],
            ['attribute_catalogues.id', '=', $id]
        ]);
    }

    public function getAttributeCatalogueOtherLanguages($id, $languageId)
    {
        return $this->getAttributeCatalogues([
            ['acl.language_id', '!=', $languageId],
            ['attribute_catalogues.id', '=', $id]
        ], true);
    }

    public function getAttributeCatalogueLanguages($languageId = 0)
    {
        return $this->getAttributeCatalogues([
            ['acl.language_id', '=', $languageId == 0 ? 1 : $languageId]
        ], true);
    }

    // Web SERVICE
    public function getAttributeCatalogueWeb($attributeCatalogueId, $languageId)
    {
        $attributeCatalogues = $this->attributeCatalogueRepository->findByCondition(
            [
                ['attribute_catalogue_languages.language_id', '=', $languageId],
                ['attribute_catalogues.id', 'IN', $attributeCatalogueId],
                ['publish', '=', 1]
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
                'attribute_catalogues.id',
                'attribute_catalogue_languages.*',
            ]
        );
        return $attributeCatalogues;
    }

    private function createAttributeCatalogue($request)
    {
        $payload = $request->only($this->payload());
        $payload['user_id'] = Auth::id();
        return $this->attributeCatalogueRepository->create($payload);
    }

    private function updateAttributeCatalogue($request, $id)
    {
        $payload = $request->only($this->payload());
        $payload['user_id'] = Auth::id();
        return $this->attributeCatalogueRepository->update($id, $payload);
    }

    private function updateLanguageForAttributeCatalogue($request, $attributeCatalogue, $languageId)
    {
        $payload = $this->formatLanguagePayload($request, $attributeCatalogue->id, $languageId);
        $attributeCatalogue->languages()->detach($languageId, $attributeCatalogue->id);
        return $this->attributeCatalogueRepository->createPivot($attributeCatalogue, $payload, 'languages');
    }

    private function payload()
    {
        return ['parent_id', 'follow', 'publish', 'image', 'album'];
    }

    private function payloadLanguage()
    {
        return ['name', 'description', 'content', 'meta_title', 'meta_keyword', 'meta_description', 'canonical'];
    }

    private function formatLanguagePayload($request, $id, $languageId)
    {
        $payload = $request->only($this->payloadLanguage());
        $payload['attribute_catalogue_id'] = $id;
        $payload['canonical'] = Str::slug($payload['canonical']);
        $payload['language_id'] = $languageId;
        return $payload;
    }

    private function getControllerMappings()
    {
        return [
            'parent' => 'Attribute',
            'child' => 'AttributeCatalogue'
        ];
    }

    private function initialize($languageId)
    {
        $this->nestedSet = new Nestedsetbie([
            'table' => 'attribute_catalogues',
            'foreignkey' => 'attribute_catalogue_id',
            'language_id' => $languageId,
        ]);
    }

    private function paginateSelect()
    {
        return [
            'attribute_catalogues.id',
            'attribute_catalogues.parent_id',
            'attribute_catalogues.publish',
            'attribute_catalogues.image',
            'attribute_catalogues.level',
            'attribute_catalogues.follow',
            'acl.name',
            'acl.canonical',
            'acl.language_id'
        ];
    }
}
