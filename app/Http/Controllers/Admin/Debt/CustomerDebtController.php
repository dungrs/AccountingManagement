<?php

namespace App\Http\Controllers\Admin\Debt;

use App\Http\Controllers\Admin\Controller;
use Illuminate\Http\Request;
use App\Services\Debt\CustomerDebtService;
use App\Services\SystemService;
use Inertia\Inertia;

class CustomerDebtController extends Controller
{
    protected $customerDebtService;
    protected $systemService;

    public function __construct(
        CustomerDebtService $customerDebtService,
        SystemService $systemService
    ) {
        $this->customerDebtService = $customerDebtService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị trang danh sách công nợ
     */
    public function index()
    {
        $this->authorize('modules', 'debt.customer.index');

        return Inertia::render('CustomerDebt/Home', [
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
        $this->authorize('modules', 'debt.customer.index');

        try {
            $customerDebts = $this->customerDebtService->paginate($request);

            return response()->json([
                'success' => true,
                'data' => $customerDebts['data'] ?? [],
                'summary' => $customerDebts['summary'] ?? [],
                'period' => $customerDebts['period'] ?? [],
                'pagination' => $customerDebts['pagination'] ?? [
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
     * Hiển thị chi tiết công nợ của một khách hàng
     */
    public function details($id, Request $request)
    {
        $this->authorize('modules', 'debt.customer.details');

        try {
            $systems = $this->systemService->getSystemDetails();
            $system_languages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            $result = $this->customerDebtService->getCustomerDebtDetails($id, $request);
            return Inertia::render('CustomerDebt/Details', [
                'result' => $result,
                'systems' => $system_languages,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Không thể tải chi tiết công nợ: ' . $e->getMessage());
        }
    }
}