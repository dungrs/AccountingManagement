<?php

namespace App\Http\Controllers\Admin\Customer;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Customer\StoreCustomerCatalogueRequest;
use App\Http\Requests\Customer\UpdateCustomerCatalogueRequest;
use App\Repositories\PermissionRepository;
use App\Repositories\Customer\CustomerCatalogueRepository;
use Illuminate\Http\Request;

use App\Services\Customer\CustomerCatalogueService;
use Inertia\Inertia;

class CustomerCatalogueController extends Controller
{
    protected $customerCatalogueService;
    protected $customerCatalogueRepository;

    public function __construct(
        CustomerCatalogueService $customerCatalogueService,
        CustomerCatalogueRepository $customerCatalogueRepository,
    ) {
        $this->customerCatalogueService = $customerCatalogueService;
        $this->customerCatalogueRepository = $customerCatalogueRepository;
    }

    public function index()
    {
        $this->authorize('modules', 'customer.catalogue.index');

        return Inertia::render('CustomerCatalogue');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'customer.catalogue.index');

        $customerCatalogues = $this->customerCatalogueService->paginate($request);
        return response()->json($customerCatalogues);
    }

    public function store(StoreCustomerCatalogueRequest $request)
    {
        $this->authorize('modules', 'customer.catalogue.create');

        try {
            $this->customerCatalogueService->create($request);

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

    public function update(UpdateCustomerCatalogueRequest $request)
    {
        $this->authorize('modules', 'customer.catalogue.update');

        try {
            $this->customerCatalogueService->update($request);

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
        $this->authorize('modules', 'customer.catalogue.destroy');

        try {
            $id = $request->input('id');

            $this->customerCatalogueService->delete($id);

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