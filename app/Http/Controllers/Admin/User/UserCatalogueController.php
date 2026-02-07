<?php

namespace App\Http\Controllers\Admin\User;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\User\StoreUserCatalogueRequest;
use App\Http\Requests\User\UpdateUserCatalogueRequest;
use App\Repositories\PermissionRepository;
use App\Repositories\User\UserCatalogueRepository;
use Illuminate\Http\Request;

use App\Services\User\UserCatalogueService;
use Inertia\Inertia;

class UserCatalogueController extends Controller
{
    protected $userCatalogueService;
    protected $userCatalogueRepository;
    protected $permissionRepository;

    public function __construct(
        UserCatalogueService $userCatalogueService,
        UserCatalogueRepository $userCatalogueRepository,
        PermissionRepository $permissionRepository,
    ) {
        $this->userCatalogueService = $userCatalogueService;
        $this->userCatalogueRepository = $userCatalogueRepository;
        $this->permissionRepository = $permissionRepository;
    }


    public function index()
    {
        $this->authorize('modules', 'user.catalogue.index');

        return Inertia::render('UserCatalogue/Home');
    }

    public function permission()
    {
        $this->authorize('modules', 'permission.index');

        $userCatalogues = $this->userCatalogueRepository->all(['permissions']);
        $permissions = $this->permissionRepository->all();

        return Inertia::render('UserCatalogue/Permission', [
            'userCatalogues' => $userCatalogues,
            'permissions' => $permissions
        ]);
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'user.catalogue.index');

        $userCatalogues = $this->userCatalogueService->paginate($request);
        return response()->json($userCatalogues);
    }

    public function store(StoreUserCatalogueRequest $request)
    {
        $this->authorize('modules', 'user.catalogue.create');

        try {
            $this->userCatalogueService->create($request);

            return response()->json([
                'status' => 'success',
                'message' => 'Tạo nhóm thành viên thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tạo nhóm thành viên thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function update(UpdateUserCatalogueRequest $request)
    {
        $this->authorize('modules', 'user.catalogue.update');

        try {
            $this->userCatalogueService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật nhóm thành viên thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật nhóm thành viên thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function updatePermission(Request $request)
    {
        $this->authorize('modules', 'user.catalogue.permission.update');

        try {
            $result = $this->userCatalogueService->setPermission($request);

            if (!$result) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Cập nhật quyền thất bại. Vui lòng thử lại.',
                ], 500);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật quyền thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Có lỗi xảy ra trong quá trình xử lý.',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        $this->authorize('modules', 'user.catalogue.destroy');

        try {
            $id = $request->input('id');

            $this->userCatalogueService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa nhóm thành viên thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
