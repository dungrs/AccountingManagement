<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Bank\StoreBankRequest;
use App\Http\Requests\Bank\UpdateBankRequest;
use Illuminate\Http\Request;

use App\Services\BankService;
use Inertia\Inertia;

class BankController extends Controller
{
    protected $bankService;

    public function __construct(
        BankService $bankService
    ) {
        $this->bankService = $bankService;
    }

    public function index()
    {
        $this->authorize('modules', 'bank.index');

        return Inertia::render('Bank');
    }

    public function filter(Request $request)
    {
        $this->authorize('modules', 'bank.index');

        $banks = $this->bankService->paginate($request);
        return response()->json($banks);
    }

    public function store(StoreBankRequest $request)
    {
        $this->authorize('modules', 'bank.create');

        try {
            $this->bankService->create($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo quyền thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tạo quyền thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function update(UpdateBankRequest $request)
    {
        $this->authorize('modules', 'bank.update');

        try {
            $this->bankService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật quyền thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật quyền thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        $this->authorize('modules', 'bank.destroy');

        try {
            $id = $request->input('id');

            $this->bankService->delete($id);

            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa quyền thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}