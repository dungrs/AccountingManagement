<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

use App\Services\SupplierService;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Repositories\BankRepository;
use App\Repositories\Location\ProvinceRepository;
use Inertia\Inertia;

class SupplierController extends Controller
{
    protected $supplierService;
    protected $provinceRepository;
    protected $bankRepository;

    public function __construct(
        SupplierService $supplierService,
        ProvinceRepository $provinceRepository,
        BankRepository $bankRepository,
    ) {
        $this->supplierService = $supplierService;
        $this->provinceRepository = $provinceRepository;
        $this->bankRepository = $bankRepository;
    }

    public function index()
    {
        $this->authorize('modules', 'supplier.index');
        return Inertia::render('Supplier/Home');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'supplier.index');

        $suppliers = $this->supplierService->paginate($request);
        return response()->json($suppliers);
    }

    public function create()
    {
        $this->authorize('modules', 'supplier.create');
        $provinces = $this->provinceRepository->all();
        $banks = $this->bankRepository->findByCondition([
            ['publish', '=', 1]
        ], true);
        return Inertia::render('Supplier/Form', [
            'banks' => $banks,
            'provinces' => $provinces
        ]);
    }

    public function edit($id)
    {
        $this->authorize('modules', 'supplier.update');
        
        $supplier = $this->supplierService->getSupplier($id);
        $provinces = $this->provinceRepository->all();
        $banks = $this->bankRepository->findByCondition([
            ['publish', '=', 1]
        ], true);

        return Inertia::render('Supplier/Form', [
            'supplier' => $supplier,
            'banks' => $banks,
            'provinces' => $provinces
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        try {
            $this->supplierService->create($request);
            return redirect()
                ->route('admin.supplier.index');
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withInput();
        }
    }

    public function update(UpdateSupplierRequest $request, $id)
    {
        try {
            $this->supplierService->update($request, $id);
            return redirect()
                ->route('admin.supplier.index');
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withInput();
        }
    }

    public function delete($id)
    {
        $this->authorize('modules', 'supplier.destroy');
        try {
            $this->supplierService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa nhà cung cấp thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
