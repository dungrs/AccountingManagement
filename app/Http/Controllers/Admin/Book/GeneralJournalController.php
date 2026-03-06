<?php

namespace App\Http\Controllers\Admin\Book;

use App\Http\Controllers\Admin\Controller;
use Illuminate\Http\Request;
use App\Services\Book\GeneralJournalService;
use App\Services\SystemService;
use Inertia\Inertia;

class GeneralJournalController extends Controller
{
    protected $generalJournalService;
    protected $systemService;

    public function __construct(
        GeneralJournalService $generalJournalService,
        SystemService $systemService
    ) {
        $this->generalJournalService = $generalJournalService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị trang sổ nhật ký chung
     */
    public function index()
    {
        // $this->authorize('modules', 'book.journal.index');

        // Mặc định lấy tháng hiện tại
        $now = now();
        $startDate = $now->copy()->startOfMonth()->format('Y-m-d');
        $endDate = $now->copy()->endOfMonth()->format('Y-m-d');

        return Inertia::render('Book/GeneralJournal', [
            'initialFilters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'account_code' => 'all'
            ]
        ]);
    }

    /**
     * Lấy dữ liệu sổ nhật ký chung
     */
    public function filter(Request $request)
    {
        // $this->authorize('modules', 'book.journal.index');

        try {
            $generalJournal = $this->generalJournalService->getGeneralJournal($request);
            $systems = $this->systemService->getSystemDetails();
            $system_languages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $generalJournal,
                'systems' => $system_languages,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải dữ liệu: ' . $e->getMessage()
            ], 500);
        }
    }
}