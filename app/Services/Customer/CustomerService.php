<?php

namespace App\Services\Customer;

use App\Services\Interfaces\Customer\CustomerServiceInterface;
use App\Services\BaseService;

use App\Repositories\Customer\CustomerRepository;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CustomerService extends BaseService implements CustomerServiceInterface
{
    protected $customerRepository;

    public function __construct(CustomerRepository $customerRepository)
    {
        $this->customerRepository = $customerRepository;
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
            $condition['where'][] = ['customers.publish', '=', $publish];
        }

        $join = [
            [
                'table' => 'customer_catalogues as uc',
                'on' => [['uc.id', 'customers.customer_catalogue_id']]
            ],
        ];

        $extend['path'] = '/customer/index';
        $extend['fieldSearch'] = [
            'customers.name',
            'customers.phone',
            'customers.description',
            'customers.email'
        ];

        $customers = $this->customerRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['customers.id', 'DESC'],
            $join,
            ['customer_catalogues']
        );

        return $customers;
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

            $member = $this->customerRepository->create($payload);

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
            $customer = $this->customerRepository->findById($id);

            if (!$customer) {
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

            $updated = $this->customerRepository->update($id, $payload);

            if (!$updated) {
                throw new \Exception("Cập nhật thành viên thất bại.");
            }

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $customer = $this->customerRepository->findById($id);

            if (!$customer) {
                throw new \Exception("Thành viên không tồn tại.");
            }

            $deleted = $this->customerRepository->delete($id);

            if (!$deleted) {
                throw new \Exception("Xóa thành viên thất bại.");
            }

            return true;
        });
    }

    public function getCustomerList()
    {
        $suppliers = $this->customerRepository->findByCondition([
            ['publish', '=', 1]
        ], true, [], [], ['id', 'name', 'id', 'phone', 'email', 'address']);

        return $suppliers;
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
            'image',
            'publish',
            'customer_catalogue_id',
            'password'
        ];
    }

    private function paginateSelect()
    {
        return [
            'customers.id',
            'customers.name',
            'customers.description',
            'customers.email',
            'customers.phone',
            'customers.birthday',
            'customers.publish',
            'customers.address',
            'customers.province_id',
            'customers.ward_id',
            'customers.image',
            'customers.customer_catalogue_id',
            'uc.name as customer_catalogue_name'
        ];
    }
}
