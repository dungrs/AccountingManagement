<?php

namespace App\Http\Controllers\Admin\Product;

use Illuminate\Http\Request;

use App\Services\Product\ProductService;

use App\Classes\Nestedsetbie;
use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Services\Attribute\AttributeCatalogueService;
use App\Services\UnitService;
use Inertia\Inertia;

class ProductController extends Controller
{
    protected $attributeCatalogueService;
    protected $productService;
    protected $unitService;
    protected $nestedSet;
    protected $languageId;

    public function __construct(
        AttributeCatalogueService $attributeCatalogueService,
        ProductService $productService,
        UnitService $unitService
    ) {
        $this->productService = $productService;
        $this->attributeCatalogueService = $attributeCatalogueService;
        $this->unitService = $unitService;
        $this->middleware(function ($request, $next) {
            $this->languageId = 1; // Tạm thời lấy bằng 1 
            $this->initialize();
            return $next($request);
        });
        $this->initialize();
    }

    public function index()
    {
        $this->authorize('modules', 'product.index');
        $dropdown = $this->nestedSet->Dropdown();
        return Inertia::render('Product/Home', [
            'dropdown' => $dropdown
        ]);
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'product.index');

        $products = $this->productService->paginate($request);
        return response()->json($products);
    }

    public function create()
    {
        $this->authorize('modules', 'product.create');
        $dropdown = $this->nestedSet->Dropdown();
        $attributeCatalogues = $this->attributeCatalogueService->getAttributeCatalogueLanguages();
        $units = $this->unitService->getUnitList();
        return Inertia::render('Product/Form', [
            'dropdown' => $dropdown,
            'attributeCatalogues' => $attributeCatalogues,
            'units' => $units,
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'product.update');
        $this->initialize();

        // Dropdown danh mục
        $dropdown = $this->nestedSet->Dropdown();

        // Lấy đơn vị tính
        $units = $this->unitService->getUnitList();

        // Lấy product + load sẵn quan hệ cần dùng
        $product = $this->productService
            ->getProductDetails($id, $this->languageId)
            ->load([
                'product_variants',
                'product_catalogues',
            ]);

        // Biến thể sản phẩm (convert sang array)
        $attributes = $product->product_variants
            ? $product->product_variants->values()->toArray()
            : [];

        // Danh mục thuộc tính
        $attributeCatalogues = $this->attributeCatalogueService
            ->getAttributeCatalogueLanguages($this->languageId)
            ->values()
            ->toArray();

        // Catalogue IDs
        $catalogues = $product->product_catalogues
            ? $product->product_catalogues->pluck('id')->toArray()
            : [];

        return Inertia::render('Product/Form', [
            'dropdown'            => $dropdown,
            'product'             => $product->toArray(),
            'catalogues'          => $catalogues,
            'attribute'          => $attributes,
            'attributeCatalogues' => $attributeCatalogues,
            'units' => $units,
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        try {
            $response = $this->productService->create($request);
            if ($response) {
                return redirect()
                    ->route('admin.product.index')
                    ->with('success', 'Thêm mới sản phẩm thành công!');
            }

            return redirect()
                ->route('admin.product.create')
                ->with('error', 'Thêm mới sản phẩm thất bại!');
        } catch (\Throwable $e) {
            return redirect()
                ->route('admin.product.create')
                ->with('error', 'Có lỗi xảy ra khi thêm sản phẩm!');
        }
    }

    public function update(UpdateProductRequest $request, $id)
    {   
        $this->productService->update($request, $id, $this->languageId);
        try {

            return redirect()
                ->route('admin.product.index')
                ->with('success', 'Cập nhật sản phẩm thành công!');
        } catch (\Throwable $e) {
            return redirect()
                ->route('admin.product.edit', ['id' => $id])
                ->with('error', 'Cập nhật sản phẩm thất bại!');
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'product.destroy');
        try {
            $this->productService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa sản phẩm thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function loadVariant(Request $request)
    {
        try {
            $response = $this->productService->loadVariant($request);

            return response()->json([
                'status' => 'success',
                'data' => $response,
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
