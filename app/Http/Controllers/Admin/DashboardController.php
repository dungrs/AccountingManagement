<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Services\DashboardService;
use App\Services\SystemService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $dashboardService;
    protected $systemService;

    public function __construct(
        DashboardService $dashboardService,
        SystemService $systemService
    ) {
        $this->dashboardService = $dashboardService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị dashboard
     */
    public function index()
    {
        return Inertia::render('Dashboard', [
            'initialFilters' => [
                'month' => now()->month,
                'year' => now()->year,
            ]
        ]);
    }

    /**
     * Lấy dữ liệu dashboard
     */
    public function getData(Request $request)
    {
        try {
            $dashboardData = $this->dashboardService->getDashboardData($request);
            $systems = $this->systemService->getSystemDetails();
            $systemLanguages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $dashboardData,
                'systems' => $systemLanguages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}