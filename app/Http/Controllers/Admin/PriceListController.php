<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

use App\Services\PriceListService;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\PriceList\StorePriceListRequest;
use App\Http\Requests\PriceList\UpdatePriceListRequest;
use App\Repositories\Location\ProvinceRepository;
use App\Repositories\VatTaxRepository;
use App\Services\Product\ProductVariantService;
use Inertia\Inertia;

class PriceListController extends Controller
{
    protected $priceListService;
    protected $provinceRepository;
    protected $vatTaxRepository;
    protected $productVariantService;

    public function __construct(
        PriceListService $priceListService,
        ProvinceRepository $provinceRepository,
        ProductVariantService $productVariantService,
        VatTaxRepository $vatTaxRepository,
    ) {
        $this->priceListService = $priceListService;
        $this->provinceRepository = $provinceRepository;
        $this->productVariantService = $productVariantService;
        $this->vatTaxRepository = $vatTaxRepository;
    }

    public function index()
    {
        $this->authorize('modules', 'price_list.index');
        return Inertia::render('PriceList/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'price_list.index');

        $priceLists = $this->priceListService->paginate($request);
        return response()->json($priceLists);
    }

    public function create()
    {
        $this->authorize('modules', 'price_list.create');
        $vat_taxes = $this->vatTaxRepository->findByCondition([
            ['direction', '=', 'output'],
            ['publish', '=', 1]
        ], true);
        $productVariants = $this->productVariantService->getListProductVariant();
        return Inertia::render('PriceList/Form', [
            'product_variants' => $productVariants,
            'vat_taxes' => $vat_taxes
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'price_list.update');

        $vat_taxes = $this->vatTaxRepository->findByCondition([
            ['direction', '=', 'output'],
            ['publish', '=', 1]
        ], true);
        $productVariants = $this->productVariantService->getListProductVariant();
        $priceList = $this->priceListService->getPriceList($id);
        return Inertia::render('PriceList/Form', [
            'price_list' => $priceList,
            'product_variants' => $productVariants,
            'vat_taxes' => $vat_taxes
        ]);
    }

    public function store(StorePriceListRequest $request)
    {
        try {
            $this->priceListService->create($request);
            return redirect()->route('admin.price_list.index')->with('success', 'Thêm mới bảng giá thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.price_list.create')->with('error', 'Thêm mới bảng giá thất bại!');
        }
    }

    public function update(UpdatePriceListRequest $request, $id)
    {
        try {
            $this->priceListService->update($request, $id);
            return redirect()->route('admin.price_list.index')->with('success', 'Cập nhật bảng giá thành công!');
        } catch (\Throwable $e) {
            return redirect()->route('admin.price_list.edit', ['id' => $id])->with('error', 'Cập nhật bảng giá thất bại!');
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'price_list.destroy');
        try {
            $this->priceListService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa bảng giá thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
