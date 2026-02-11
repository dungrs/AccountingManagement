<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\VatTax\StoreVatTaxRequest;
use App\Http\Requests\VatTax\UpdateVatTaxRequest;
use Illuminate\Http\Request;

use App\Services\VatTaxService;
use Inertia\Inertia;

class VatTaxController extends Controller
{
    protected $vatTaxService;

    public function __construct(
        VatTaxService $vatTaxService
    ) {
        $this->vatTaxService = $vatTaxService;
    }

    public function index()
    {
        $this->authorize('modules', 'vattax.index');

        return Inertia::render('VatTax');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'vattax.index');

        $vatTaxes = $this->vatTaxService->paginate($request);

        return response()->json($vatTaxes);
    }

    public function store(StoreVatTaxRequest $request)
    {
        $this->authorize('modules', 'vattax.create');

        try {
            $this->vatTaxService->create($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo thuế VAT thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tạo thuế VAT thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function update(UpdateVatTaxRequest $request)
    {
        $this->authorize('modules', 'vattax.update');

        try {
            $this->vatTaxService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật thuế VAT thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật thuế VAT thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        $this->authorize('modules', 'vattax.destroy');

        try {
            $id = $request->input('id');

            $this->vatTaxService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa thuế VAT thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}