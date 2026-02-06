<?php

namespace App\Services;

use App\Services\Interfaces\PermissionServiceInterface;
use App\Services\BaseService;

use App\Repositories\PermissionRepository;

use Illuminate\Support\Facades\DB;

class PermissionService extends BaseService implements PermissionServiceInterface
{
    protected $permissionRepository;

    public function __construct(PermissionRepository $permissionRepository)
    {
        $this->permissionRepository = $permissionRepository;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page');

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
        ];

        $extend['path'] = '/permission/index';
        $extend['fieldSearch'] = ['name', 'canonical'];
        $join = [];

        $permissions = $this->permissionRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC'],
            $join
        );

        return $permissions;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            return $this->createPermission($request);
        });
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {

            $permissionId = $request->input('id');

            $flag = $this->updatePermission($request, $permissionId);

            if (!$flag) {
                throw new \Exception("Cập nhật quyền thất bại.");
            }

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $permission = $this->permissionRepository->findById($id);

            if (!$permission) {
                throw new \Exception("Quyền không tồn tại.");
            }

            $deleted = $this->permissionRepository->delete($id);

            if (!$deleted) {
                throw new \Exception("Xóa quyền thất bại.");
            }

            return true;
        });
    }

    public function getPermissionDetails($id)
    {
        return $this->permissionRepository->findById($id);
    }

    /* ===================== PRIVATE ===================== */

    private function createPermission($request)
    {
        $payload = $request->only($this->payload());
        return $this->permissionRepository->create($payload);
    }

    private function updatePermission($request, $id)
    {
        $payload = $request->only($this->payload());
        return $this->permissionRepository->update($id, $payload);
    }

    private function payload()
    {
        return [
            'name',
            'canonical',
        ];
    }

    private function paginateSelect()
    {
        return [
            'id',
            'name',
            'canonical',
        ];
    }
}