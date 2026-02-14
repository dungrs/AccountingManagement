<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use Illuminate\Http\Request;

use App\Services\SystemService;
use App\Classes\System as SystemLibrary;
use Inertia\Inertia;

class SystemController extends Controller
{
    protected $systemService;
    protected $systemLibrary;

    public function __construct(
        SystemService $systemService,
        SystemLibrary $systemLibrary
    ) {
        $this->systemService = $systemService;
        $this->systemLibrary = $systemLibrary;
    }

    public function index()
    {
        $this->authorize('modules', 'system.index');

        $systems = $this->systemService->getSystemDetails();
        $systemConfigs = $this->systemLibrary->config();

        $systemLanguage = $systems
            ->where('language_id', 1)
            ->pluck('content', 'keyword')
            ->toArray();

        return Inertia::render('System', [
            'systemConfigs' => $systemConfigs,
            'systemLanguage' => $systemLanguage,
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('modules', 'system.create');

        try {
            $this->systemService->create($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật thông tin công ty thành công.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật thông tin công ty  thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }
}
