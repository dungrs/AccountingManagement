<?php

namespace App\Http\Controllers\Admin\Report;

use App\Http\Controllers\Admin\Controller;
use App\Services\Report\BusinessResultReportService;
use App\Services\SystemService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusinessResultController extends Controller
{
    protected $businessResultReportService;
    protected $systemService;

    public function __construct(
        BusinessResultReportService $businessResultReportService,
        SystemService $systemService
    ) {
        $this->businessResultReportService = $businessResultReportService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị trang báo cáo kết quả kinh doanh
     */
    public function index()
    {
        $this->authorize('modules', 'report.business-result.index');
        $systems = $this->systemService->getSystemDetails();
        $systemLanguages = $systems
            ->where('language_id', 1)
            ->pluck('content', 'keyword')
            ->toArray();

        return Inertia::render('Report/BusinessResult/Home', [
            'initialFilters' => [
                'year' => now()->year,
            ],
            'systems' => $systemLanguages,
        ]);
    }

    /**
     * Lấy dữ liệu báo cáo
     */
    public function getData(Request $request)
    {
        $this->authorize('modules', 'report.business-result.index');
        try {
            $reportData = $this->businessResultReportService->getBusinessResultReport($request);
            $systems = $this->systemService->getSystemDetails();
            $systemLanguages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $reportData,
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
