<?php

namespace App\Http\Controllers\Admin\Product;

use Illuminate\Http\Request;

use App\Services\Product\ProductCatalogueService;

use App\Classes\Nestedsetbie;
use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Product\DeleteProductCatalogueRequest;
use App\Http\Requests\Product\StoreProductCatalogueRequest;
use App\Http\Requests\Product\UpdateProductCatalogueRequest;
use Inertia\Inertia;

class ProductCatalogueController extends Controller
{
    protected $productCatalogueService;
    protected $nestedSet;
    protected $languageId;

    public function __construct(ProductCatalogueService $productCatalogueService)
    {
        $this->productCatalogueService = $productCatalogueService;
        $this->middleware(function ($request, $next) {
            $this->languageId = 1; // Tạm thời lấy bằng 1
            $this->initialize();
            return $next($request);
        });
        $this->initialize();
    }

    public function index()
    {
        $this->authorize('modules', 'product.catalogue.index');
        return Inertia::render('ProductCatalogue/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'user.catalogue.index');

        $productCatalogues = $this->productCatalogueService->paginate($request);
        return response()->json($productCatalogues);
    }

    public function create()
    {
        $this->authorize('modules', 'product.catalogue.create');
        $dropdown = $this->nestedSet->Dropdown();
        return Inertia::render('ProductCatalogue/Form', [
            'dropdown' => $dropdown,
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'product.catalogue.update');
        $this->languageId = 1;
        $this->initialize();
        $dropdown = $this->nestedSet->Dropdown();
        $productCatalogue = $this->productCatalogueService->getProductCatalogueDetails($id, $this->languageId);

        return Inertia::render('ProductCatalogue/Form', [
            'dropdown' => $dropdown,
            'productCatalogue' => $productCatalogue
        ]);
    }

    public function store(StoreProductCatalogueRequest $request)
    {
        try {
            $this->productCatalogueService->create($request);

            return redirect()
                ->route('admin.product.catalogue.index');
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withInput();
        }
    }


    public function update(UpdateProductCatalogueRequest $request, $id)
    {
        try {
            $this->productCatalogueService->update($request, $id, $this->languageId);

            return redirect()
                ->route('admin.product.catalogue.index');
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withInput();
        }
    }

    public function delete(DeleteProductCatalogueRequest $request, $id)
    {   
        $this->authorize('modules', 'product.catalogue.destroy');
        try {
            $this->productCatalogueService->delete($id);

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
            'table' => 'product_catalogues',
            'foreignkey' => 'product_catalogue_id',
            'language_id' => $this->languageId,
        ]);
    }
}