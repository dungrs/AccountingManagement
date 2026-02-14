<?php

namespace App\Services\User;

use App\Services\Interfaces\User\UserCatalogueServiceInterface;
use App\Services\BaseService;

use App\Repositories\User\UserCatalogueRepository;

use Illuminate\Support\Facades\DB;

class UserCatalogueService extends BaseService implements UserCatalogueServiceInterface
{

    protected $userCatalogueRepository;

    public function __construct(UserCatalogueRepository $userCatalogueRepository)
    {
        $this->userCatalogueRepository = $userCatalogueRepository;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page');
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;
        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' => $publish,
        ];
        $extend['path'] = '/user/catalogue/index';
        $extend['fieldSearch'] = ['name', 'phone', 'description', 'email'];
        $join = [];
        $userCatalogues = $this->userCatalogueRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC'],
            $join,
            ['users']
        );

        return $userCatalogues;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            return $this->createUserCatalogue($request);
        });
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {

            $userCatalogueId = $request->input('id');

            $flag = $this->updateUserCatalogue($request, $userCatalogueId);

            if (!$flag) {
                throw new \Exception("Cập nhật số lượng thất bại.");
            }

            return true;
        });
    }


    private function createUserCatalogue($request)
    {
        $payload = $request->only($this->payload());
        return $this->userCatalogueRepository->create($payload);
    }

    private function updateUserCatalogue($request, $id)
    {
        $payload = $request->only($this->payload());
        return $this->userCatalogueRepository->update($id, $payload);
    }

    private function payload()
    {
        return ['phone', 'email', 'name', 'description'];
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $userCatalogue = $this->userCatalogueRepository->findById($id);

            if (!$userCatalogue) {
                throw new \Exception("Nhóm thành viên không tồn tại.");
            }

            if ($userCatalogue->users()->count() > 0) {
                throw new \Exception("Không thể xóa nhóm thành viên vì vẫn còn thành viên trong nhóm.");
            }

            $deleted = $this->userCatalogueRepository->delete($id);

            if (!$deleted) {
                throw new \Exception("Xóa nhóm thành viên thất bại.");
            }

            return true;
        });
    }


    public function setPermission($request)
    {
        DB::beginTransaction();

        try {
            $permissions = $request->input("permissions");
            foreach ($permissions as $key => $val) {
                $userCatalogue = $this->userCatalogueRepository->findById($key);
                $userCatalogue->permissions()->sync($val);
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    private function paginateSelect()
    {
        return [
            'id',
            'name',
            'description',
            'email',
            'phone',
            'publish',
        ];
    }
}
