<?php

namespace App\Services\Customer;

use App\Services\Interfaces\Customer\CustomerCatalogueServiceInterface;
use App\Services\BaseService;

use App\Repositories\Customer\CustomerCatalogueRepository;

use Illuminate\Support\Facades\DB;

class CustomerCatalogueService extends BaseService implements CustomerCatalogueServiceInterface
{

    protected $customerCatalogueRepository;

    public function __construct(CustomerCatalogueRepository $customerCatalogueRepository)
    {
        $this->customerCatalogueRepository = $customerCatalogueRepository;
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
        $extend['path'] = '/customer/catalogue/index';
        $extend['fieldSearch'] = ['name', 'description'];
        $join = [];
        $customerCatalogues = $this->customerCatalogueRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC'],
            $join,
            ['customers']
        );

        return $customerCatalogues;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            return $this->createCustomerCatalogue($request);
        });
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {

            $customerCatalogueId = $request->input('id');

            $flag = $this->updateCustomerCatalogue($request, $customerCatalogueId);

            if (!$flag) {
                throw new \Exception("Cập nhật nhóm khách hàng thất bại.");
            }

            return true;
        });
    }


    private function createCustomerCatalogue($request)
    {
        $payload = $request->only($this->payload());
        return $this->customerCatalogueRepository->create($payload);
    }

    private function updateCustomerCatalogue($request, $id)
    {
        $payload = $request->only($this->payload());
        return $this->customerCatalogueRepository->update($id, $payload);
    }

    private function payload()
    {
        return ['email', 'name', 'description'];
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $customerCatalogue = $this->customerCatalogueRepository->findById($id);

            if (!$customerCatalogue) {
                throw new \Exception("Nhóm khách hàng không tồn tại.");
            }

            if ($customerCatalogue->customers()->count() > 0) {
                throw new \Exception("Không thể xóa nhóm khách hàng vì vẫn còn khách hàng trong nhóm.");
            }

            $deleted = $this->customerCatalogueRepository->delete($id);

            if (!$deleted) {
                throw new \Exception("Xóa nhóm khách hàng thất bại.");
            }

            return true;
        });
    }

    private function paginateSelect()
    {
        return [
            'id',
            'name',
            'description',
            'publish',
        ];
    }
}