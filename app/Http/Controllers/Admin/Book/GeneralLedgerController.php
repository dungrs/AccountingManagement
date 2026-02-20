<?php

namespace App\Http\Controllers\Admin\Book;

use App\Http\Controllers\Admin\Controller;
use Illuminate\Http\Request;
use App\Services\Book\GeneralLedgerService;
use App\Services\SystemService;
use Inertia\Inertia;

class GeneralLedgerController extends Controller
{
    protected $generalLedgerService;
    protected $systemService;

    public function __construct(
        GeneralLedgerService $generalLedgerService,
        SystemService $systemService
    ) {
        $this->generalLedgerService = $generalLedgerService;
        $this->systemService = $systemService;
    }

    /**
     * Hiển thị trang sổ cái
     */
    public function index()
    {
        $this->authorize('modules', 'book.ledger.index');

        // Lấy danh sách tài khoản
        $accounts = $this->generalLedgerService->getAccounts(request());

        return Inertia::render('GeneralLedger/Home', [
            'initialFilters' => [
                'month' => now()->month,
                'year' => now()->year,
                'account_code' => '111'
            ],
            'accounts' => $accounts
        ]);
    }

    /**
     * Lấy dữ liệu sổ cái
     */
    public function filter(Request $request)
    {
        $this->authorize('modules', 'book.ledger.index');

        try {
            $generalLedger = $this->generalLedgerService->getGeneralLedger($request);
            $systems = $this->systemService->getSystemDetails();
            $system_languages = $systems
                ->where('language_id', 1)
                ->pluck('content', 'keyword')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $generalLedger,
                'systems' => $system_languages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải dữ liệu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách tài khoản
     */
    public function getAccounts(Request $request)
    {
        try {
            $accounts = $this->generalLedgerService->getAccounts($request);

            return response()->json([
                'success' => true,
                'data' => $accounts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}