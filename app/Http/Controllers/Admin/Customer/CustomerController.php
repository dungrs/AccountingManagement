<?php

namespace App\Http\Controllers\Admin\Customer;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use Illuminate\Http\Request;

use App\Services\Customer\CustomerService;

use App\Repositories\Customer\CustomerRepository;
use App\Repositories\Customer\CustomerCatalogueRepository;
use App\Repositories\Location\ProvinceRepository;
use Inertia\Inertia;

class CustomerController extends Controller
{
    protected $customerService;
    protected $customerRepository;
    protected $customerCatalogueRepository;
    protected $provinceRepository;

    public function __construct(
        CustomerService $customerService,
        CustomerRepository $customerRepository,
        CustomerCatalogueRepository $customerCatalogueRepository,
        ProvinceRepository $provinceRepository
    ) {
        $this->customerService = $customerService;
        $this->customerRepository = $customerRepository;
        $this->customerCatalogueRepository = $customerCatalogueRepository;
        $this->provinceRepository = $provinceRepository;
    }

    public function index()
    {
        $this->authorize('modules', 'customer.index');

        $customerCatalogues = $this->customerCatalogueRepository->findByCondition([
            ['publish', '=', 1]
        ], true);

        $provinces = $this->provinceRepository->all();

        return Inertia::render('Customer', [
            'customerCatalogues' => $customerCatalogues,
            'provinces' => $provinces,
        ]);
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'customer.index');
        $customers = $this->customerService->paginate($request);
        return response()->json($customers);
    }

    public function store(StoreCustomerRequest $request)
    {
        $this->authorize('modules', 'customer.create');

        try {
            $this->customerService->create($request);

            return response()->json([
                'status' => 'success',
                'message' => 'Tạo nhóm khách hàng thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tạo nhóm khách hàng thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function update(UpdateCustomerRequest $request)
    {
        $this->authorize('modules', 'customer.update');

        try {
            $this->customerService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật nhóm khách hàng thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật nhóm khách hàng thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        $this->authorize('modules', 'customer.destroy');

        try {
            $id = $request->input('id');

            $this->customerService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa nhóm khách hàng thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}