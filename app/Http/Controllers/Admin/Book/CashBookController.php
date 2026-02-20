<?php

namespace App\Http\Controllers\Admin\Book;

use App\Http\Controllers\Admin\Controller;
use Illuminate\Http\Request;
use App\Services\Book\CashBookService;
use App\Services\SystemService;
use Inertia\Inertia;

class CashBookController extends Controller
{
    protected $cashBookService;
    protected $systemService;

    public function __construct(
        CashBookService $cashBookService,
        SystemService $systemService
    ) {
        $this->cashBookService = $cashBookService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị trang sổ quỹ
     */
    public function index()
    {
        $this->authorize('modules', 'book.cash.index');

        return Inertia::render('CashBook/Home', [
            'initialFilters' => [
                'month' => now()->month,
                'year' => now()->year,
                'payment_method' => 'cash'
            ]
        ]);
    }

    /**
     * Lấy dữ liệu sổ quỹ
     */
    public function filter(Request $request)
    {
        $this->authorize('modules', 'book.cash.index');

        try {
            $cashBook = $this->cashBookService->getCashBook($request);
            $systems = $this->systemService->getSystemDetails();
            $system_languages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $cashBook,
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
