<?php

namespace App\Http\Controllers\Admin\Product;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Inventory\UpdateInventoryRequest;
use Illuminate\Http\Request;

use App\Services\Product\ProductVariantService;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    protected $productVariantService;

    public function __construct(
        ProductVariantService $productVariantService,
    ) {
        $this->productVariantService = $productVariantService;
    }


    public function index()
    {
        $this->authorize('modules', 'product.variant.index');

        return Inertia::render('Inventory');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'product.variant.index');

        $productVariants = $this->productVariantService->paginate($request);
        return response()->json($productVariants);
    }

    public function update(UpdateInventoryRequest $request)
    {
        $this->authorize('modules', 'product.variant.update');

        try {
            $this->productVariantService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật số lượng thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật số lượng thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }
}
