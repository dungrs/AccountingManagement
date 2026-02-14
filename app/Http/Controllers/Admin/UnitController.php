<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Unit\StoreUnitRequest;
use App\Http\Requests\Unit\UpdateUnitRequest;
use Illuminate\Http\Request;

use App\Services\UnitService;
use Inertia\Inertia;

class UnitController extends Controller
{
    protected $unitService;

    public function __construct(
        UnitService $unitService
    ) {
        $this->unitService = $unitService;
    }

    public function index()
    {
        $this->authorize('modules', 'unit.index');

        return Inertia::render('Unit');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'unit.index');

        $unites = $this->unitService->paginate($request);

        return response()->json($unites);
    }

    public function store(StoreUnitRequest $request)
    {
        $this->authorize('modules', 'unit.create');

        try {
            $this->unitService->create($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo đơn vị tính thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tạo đơn vị tính thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function update(UpdateUnitRequest $request)
    {
        $this->authorize('modules', 'unit.update');

        try {
            $this->unitService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật đơn vị tính thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật đơn vị tính thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        $this->authorize('modules', 'unit.destroy');

        try {
            $id = $request->input('id');

            $this->unitService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa đơn vị tính thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}