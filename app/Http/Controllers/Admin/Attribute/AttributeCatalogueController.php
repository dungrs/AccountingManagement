<?php

namespace App\Http\Controllers\Admin\Attribute;

use Illuminate\Http\Request;

use App\Services\Attribute\AttributeCatalogueService;

use App\Classes\Nestedsetbie;
use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Attribute\DeleteAttributeCatalogueRequest;
use App\Http\Requests\Attribute\StoreAttributeCatalogueRequest;
use App\Http\Requests\Attribute\UpdateAttributeCatalogueRequest;
use Inertia\Inertia;

class AttributeCatalogueController extends Controller
{
    protected $attributeCatalogueService;
    protected $nestedSet;
    protected $languageId;

    public function __construct(AttributeCatalogueService $attributeCatalogueService)
    {
        $this->attributeCatalogueService = $attributeCatalogueService;
        $this->middleware(function ($request, $next) {
            $this->languageId = 1; // Tạm thời lấy bằng 1
            $this->initialize();
            return $next($request);
        });
        $this->initialize();
    }

    public function index()
    {
        $this->authorize('modules', 'attribute.catalogue.index');
        return Inertia::render('AttributeCatalogue/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'attribute.catalogue.index');

        $attributeCatalogues = $this->attributeCatalogueService->paginate($request);
        return response()->json($attributeCatalogues);
    }

    public function create()
    {
        $this->authorize('modules', 'attribute.catalogue.create');
        $dropdown = $this->nestedSet->Dropdown();
        return Inertia::render('AttributeCatalogue/Form', [
            'dropdown' => $dropdown,
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'attribute.catalogue.update');
        $this->languageId = 1;
        $this->initialize();
        $dropdown = $this->nestedSet->Dropdown();
        $attributeCatalogue = $this->attributeCatalogueService->getAttributeCatalogueDetails($id, $this->languageId);

        return Inertia::render('AttributeCatalogue/Form', [
            'dropdown' => $dropdown,
            'attributeCatalogue' => $attributeCatalogue
        ]);
    }


    public function store(StoreAttributeCatalogueRequest $request)
    {
        $this->attributeCatalogueService->create($request);
        try {

            return redirect()
                ->route('admin.attribute.catalogue.index')
                ->with('success', 'Thêm mới nhóm thuộc tính thành công!');
        } catch (\Throwable $e) {
            return redirect()
                ->route('admin.attribute.catalogue.create')
                ->with('error', 'Thêm mới nhóm thuộc tính thất bại!');
        }
    }


    public function update(UpdateAttributeCatalogueRequest $request, $id)
    {
        try {
            $this->attributeCatalogueService->update($request, $id, $this->languageId);

            return redirect()
                ->route('admin.attribute.catalogue.index')
                ->with('success', 'Cập nhật nhóm thuộc tính thành công!');
        } catch (\Throwable $e) {
            return redirect()
                ->route('admin.attribute.catalogue.edit', ['id' => $id])
                ->with('error', 'Cập nhật nhóm thuộc tính thất bại!');
        }
    }


    public function delete(DeleteAttributeCatalogueRequest $request, $id)
    {
        $this->authorize('modules', 'attribute.catalogue.destroy');
        try {
            $this->attributeCatalogueService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa loại thuộc tính thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function initialize()
    {
        $this->nestedSet = new Nestedsetbie([
            'table' => 'attribute_catalogues',
            'foreignkey' => 'attribute_catalogue_id',
            'language_id' => $this->languageId,
        ]);
    }
}
