<?php

namespace App\Http\Controllers\Admin\Debt;

use App\Http\Controllers\Admin\Controller;
use Illuminate\Http\Request;
use App\Services\Debt\SupplierDebtService;
use App\Services\SystemService;
use Inertia\Inertia;

class SupplierDebtController extends Controller
{
    protected $supplierDebtService;
    protected $systemService;

    public function __construct(
        SupplierDebtService $supplierDebtService,
        SystemService $systemService
    ) {
        $this->supplierDebtService = $supplierDebtService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị trang danh sách công nợ
     */
    public function index()
    {
        $this->authorize('modules', 'debt.supplier.index');

        return Inertia::render('SupplierDebt/Home', [
            'initialFilters' => [
                'month' => now()->month,
                'year' => now()->year,
                'perpage' => 20
            ]
        ]);
    }

    /**
     * Lấy dữ liệu công nợ với phân trang và bộ lọc
     */
    public function filter(Request $request)
    {
        $this->authorize('modules', 'debt.supplier.index');

        try {
            $supplierDebts = $this->supplierDebtService->paginate($request);

            return response()->json([
                'success' => true,
                'data' => $supplierDebts['data'] ?? [],
                'summary' => $supplierDebts['summary'] ?? [],
                'period' => $supplierDebts['period'] ?? [],
                'pagination' => $supplierDebts['pagination'] ?? [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => (int)($request->input('perpage') ?? 20),
                    'total' => 0,
                    'from' => 0,
                    'to' => 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải dữ liệu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hiển thị chi tiết công nợ của một nhà cung cấp
     */
    public function details($id, Request $request)
    {
        $this->authorize('modules', 'debt.supplier.details');

        try {
            $systems = $this->systemService->getSystemDetails();
            $system_languages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            $result = $this->supplierDebtService->getSupplierDebtDetails($id, $request);
            return Inertia::render('SupplierDebt/Details', [
                'result' => $result,
                'systems' => $system_languages,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Không thể tải chi tiết công nợ: ' . $e->getMessage());
        }
    }

    /**
     * Xuất báo cáo công nợ ra Excel
     */
    public function export(Request $request)
    {
        $this->authorize('modules', 'debt.supplier.export');

        try {
            // Logic xuất Excel sẽ được thêm sau
            return response()->json([
                'success' => true,
                'message' => 'Đang xử lý xuất báo cáo...'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xuất báo cáo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * In báo cáo công nợ
     */
    public function print(Request $request)
    {
        $this->authorize('modules', 'debt.supplier.print');

        try {
            $supplierDebts = $this->supplierDebtService->paginate($request);

            return Inertia::render('SupplierDebt/Print', [
                'data' => $supplierDebts['data'] ?? [],
                'summary' => $supplierDebts['summary'] ?? [],
                'period' => $supplierDebts['period'] ?? [],
                'filters' => $request->all()
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Không thể in báo cáo: ' . $e->getMessage());
        }
    }
}
