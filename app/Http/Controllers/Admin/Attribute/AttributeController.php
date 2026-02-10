<?php

namespace App\Http\Controllers\Admin\Attribute;

use Illuminate\Http\Request;

use App\Services\Attribute\AttributeService;

use App\Classes\Nestedsetbie;
use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Attribute\StoreAttributeRequest;
use App\Http\Requests\Attribute\UpdateAttributeRequest;
use Inertia\Inertia;

class AttributeController extends Controller
{
    protected $attributeService;
    protected $nestedSet;
    protected $languageId;

    public function __construct(AttributeService $attributeService)
    {
        $this->attributeService = $attributeService;
        $this->middleware(function ($request, $next) {
            $this->languageId = 1; // Tạm thời lấy bằng 1 
            $this->initialize();
            return $next($request);
        });
        $this->initialize();
    }

    public function index()
    {
        $this->authorize('modules', 'attribute.index');
        $dropdown = $this->nestedSet->Dropdown();
        return Inertia::render('Attribute/Home', [
            'dropdown' => $dropdown
        ]);
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'attribute.catalogue.index');

        $attributes = $this->attributeService->paginate($request);
        return response()->json($attributes);
    }

    public function create()
    {
        $this->authorize('modules', 'attribute.create');
        $dropdown = $this->nestedSet->Dropdown();
        return Inertia::render('Attribute/Form', [
            'dropdown' => $dropdown,
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'attribute.update');
        $this->languageId = 1;
        $this->initialize();
        $dropdown = $this->nestedSet->Dropdown();
        $attribute = $this->attributeService->getAttributeDetails($id, $this->languageId);
        $catalogues = $attribute->attribute_catalogues
            ? $attribute->attribute_catalogues->pluck('id')->toArray()
            : [];
        return Inertia::render('Attribute/Form', [
            'dropdown' => $dropdown,
            'attribute' => $attribute,
            'catalogues' => $catalogues
        ]);
    }

    public function store(StoreAttributeRequest $request)
    {
        try {
            $this->attributeService->create($request);

            return redirect()
                ->route('admin.attribute.index');
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withInput();
        }
    }


    public function update(UpdateAttributeRequest $request, $id)
    {
        try {
            $this->attributeService->update($request, $id, $this->languageId);

            return redirect()
                ->route('admin.attribute.index');
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withInput();
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'attribute.destroy');
        try {
            $this->attributeService->delete($id);

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

    public function getAttribute(Request $request)
    {
        $response = $this->attributeService->getAttributeAjax($request);
        return response()->json([
            'status' => 'success',
            'data' => $response,
        ], 201);
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
