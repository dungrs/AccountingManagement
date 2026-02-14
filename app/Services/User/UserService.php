<?php

namespace App\Services\User;

use App\Services\Interfaces\User\UserServiceInterface;
use App\Services\BaseService;

use App\Repositories\User\UserRepository;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService implements UserServiceInterface
{
    protected $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
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
            'where' => []
        ];

        if (!is_null($publish)) {
            $condition['where'][] = ['users.publish', '=', $publish];
        }

        $join = [
            [
                'table' => 'user_catalogues as uc',
                'on' => [['uc.id', 'users.user_catalogue_id']]
            ],
        ];

        $extend['path'] = '/user/index';
        $extend['fieldSearch'] = [
            'users.name',
            'users.phone',
            'users.description',
            'users.email'
        ];

        $users = $this->userRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['users.id', 'DESC'],
            $join,
            ['user_catalogues']
        );

        return $users;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {

            $payload = $request->only($this->payload());

            if (!empty($payload['birthday'])) {
                $payload['birthday'] = convertDateToDatabaseFormat($payload['birthday']);
            }

            if (!empty($payload['password'])) {
                $payload['password'] = Hash::make($payload['password']);
            }

            $member = $this->userRepository->create($payload);

            if (!$member) {
                throw new \Exception("Thêm thành viên thất bại.");
            }

            return $member;
        });
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {
            $id = $request->input('id');
            $user = $this->userRepository->findById($id);

            if (!$user) {
                throw new \Exception("Thành viên không tồn tại.");
            }

            $payload = $request->only($this->payload());

            if (!empty($payload['birthday'])) {
                $payload['birthday'] = convertDateToDatabaseFormat($payload['birthday']);
            }

            if ($request->filled('password')) {
                $payload['password'] = Hash::make($request->input('password'));
            } else {
                unset($payload['password']);
            }

            $updated = $this->userRepository->update($id, $payload);

            if (!$updated) {
                throw new \Exception("Cập nhật thành viên thất bại.");
            }

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $user = $this->userRepository->findById($id);

            if (!$user) {
                throw new \Exception("Thành viên không tồn tại.");
            }

            $deleted = $this->userRepository->delete($id);

            if (!$deleted) {
                throw new \Exception("Xóa thành viên thất bại.");
            }

            return true;
        });
    }

    public function getUserList()
    {
        return $this->userRepository->findByCondition([
            ['publish', '=', 1]
        ], true, [], [], ['id', 'name']);
    }

    private function payload()
    {
        return [
            'name',
            'description',
            'email',
            'phone',
            'birthday',
            'address',
            'province_id',
            'ward_id',
            'avatar',
            'publish',
            'user_catalogue_id',
            'password'
        ];
    }

    private function paginateSelect()
    {
        return [
            'users.id',
            'users.name',
            'users.description',
            'users.email',
            'users.phone',
            'users.birthday',
            'users.publish',
            'users.address',
            'users.province_id',
            'users.ward_id',
            'users.avatar',
            'users.user_catalogue_id',
            'uc.name as user_catalogue_name'
        ];
    }
}
