<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use Illuminate\Http\Request;

use App\Services\PermissionService;
use Inertia\Inertia;

class PermissionController extends Controller
{
    protected $permissionService;

    public function __construct(
        PermissionService $permissionService
    ) {
        $this->permissionService = $permissionService;
    }

    public function index()
    {
        $this->authorize('modules', 'permission.index');

        return Inertia::render('Permission');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'permission.index');

        $permissions = $this->permissionService->paginate($request);
        return response()->json($permissions);
    }

    public function store(StorePermissionRequest $request)
    {
        $this->authorize('modules', 'permission.create');

        try {
            $this->permissionService->create($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo quyền thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tạo quyền thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function update(UpdatePermissionRequest $request)
    {
        $this->authorize('modules', 'permission.update');

        try {
            $this->permissionService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật quyền thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật quyền thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        $this->authorize('modules', 'permission.destroy');

        try {
            $id = $request->input('id');

            $this->permissionService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa quyền thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
