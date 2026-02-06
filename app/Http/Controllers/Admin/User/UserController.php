<?php

namespace App\Http\Controllers\Admin\User;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use Illuminate\Http\Request;

use App\Services\User\UserService;

use App\Repositories\User\UserRepository;
use App\Repositories\User\UserCatalogueRepository;
use App\Repositories\Location\ProvinceRepository;
use Inertia\Inertia;

class UserController extends Controller
{
    protected $userService;
    protected $userRepository;
    protected $userCatalogueRepository;
    protected $provinceRepository;

    public function __construct(
        UserService $userService,
        UserRepository $userRepository,
        UserCatalogueRepository $userCatalogueRepository,
        ProvinceRepository $provinceRepository
    ) {
        $this->userService = $userService;
        $this->userRepository = $userRepository;
        $this->userCatalogueRepository = $userCatalogueRepository;
        $this->provinceRepository = $provinceRepository;
    }

    public function index()
    {
        $this->authorize('modules', 'user.index');

        $userCatalogues = $this->userCatalogueRepository->all();
        $provinces = $this->provinceRepository->all();

        return Inertia::render('User/User', [
            'userCatalogues' => $userCatalogues,
            'provinces' => $provinces,
        ]);
    }

    public function filter(Request $request)
    {
        // $this->authorize('modules', 'user.index');

        $users = $this->userService->paginate($request);
        return response()->json($users);
    }

    public function store(StoreUserRequest $request)
    {
        $this->authorize('modules', 'user.create');

        try {
            $this->userService->create($request);

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

    public function update(UpdateUserRequest $request)
    {
        $this->authorize('modules', 'user.update');

        try {
            $this->userService->update($request);

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

    public function delete(Request $request)
    {
        $this->authorize('modules', 'user.destroy');

        try {
            $id = $request->input('id');

            $this->userService->delete($id);

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
