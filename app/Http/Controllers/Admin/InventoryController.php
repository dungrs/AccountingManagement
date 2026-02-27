<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\Inventory\UpdateInventoryRequest;
use App\Http\Requests\Inventory\AdjustStockRequest;
use Illuminate\Http\Request;

use App\Services\Inventory\InventoryService;
use App\Services\Product\ProductVariantService;
use Inertia\Inertia;

class InventoryController extends Controller
{
    protected $inventoryService;
    protected $productVariantService;

    public function __construct(
        InventoryService $inventoryService,
        ProductVariantService $productVariantService
    ) {
        $this->inventoryService = $inventoryService;
        $this->productVariantService = $productVariantService;
    }

    /**
     * Hiển thị trang danh sách tồn kho
     */
    public function index()
    {
        // $this->authorize('modules', 'inventory.index');

        return Inertia::render('Inventory/Home');
    }

    /**
     * Lấy danh sách tồn kho phân trang
     */
    public function filter(Request $request)
    {
        // $this->authorize('modules', 'inventory.index');

        $inventoryItems = $this->inventoryService->paginateInventory($request);
        try {
            return response()->json($inventoryItems);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi khi lấy danh sách tồn kho: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xem chi tiết tồn kho của một sản phẩm
     */
    public function show($id)
    {
        // $this->authorize('modules', 'inventory.show');

        try {
            $detail = $this->inventoryService->getInventoryDetail($id, request());

            if (!$detail) {
                return redirect()
                    ->route('admin.inventory.index')
                    ->with('error', 'Không tìm thấy thông tin tồn kho.');
            }

            return Inertia::render('Inventory/Form', [
                'inventory' => $detail
            ]);
        } catch (\Exception $e) {
            return redirect()
                ->route('admin.inventory.index')
                ->with('error', 'Lỗi: ' . $e->getMessage());
        }
    }

    /**
     * Điều chỉnh tồn kho (kiểm kê)
     */
    public function adjust(UpdateInventoryRequest $request)
    {
        // $this->authorize('modules', 'inventory.adjust');

        try {
            $result = $this->inventoryService->adjustStock(
                $request->input('product_variant_id'),
                $request->input('new_quantity'),
                $request->input('reason', 'Điều chỉnh từ form'),
                [
                    'adjustment_date' => $request->input('adjustment_date'),
                    'adjustment_id' => $request->input('adjustment_id', 0),
                    'note' => $request->input('note')
                ]
            );

            if ($result['adjusted']) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Điều chỉnh tồn kho thành công.',
                    'data' => $result
                ], 200);
            } else {
                return response()->json([
                    'status'  => 'info',
                    'message' => $result['message'],
                ], 200);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Điều chỉnh tồn kho thất bại: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy tổng quan tồn kho
     */
    public function overview()
    {
        // $this->authorize('modules', 'inventory.overview');

        try {
            $overview = $this->inventoryService->getInventoryOverview();
            return response()->json($overview);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi khi lấy tổng quan tồn kho: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy lịch sử giao dịch của sản phẩm
     */
    public function transactions($id, Request $request)
    {
        // $this->authorize('modules', 'inventory.transactions');

        try {
            // Lấy thông tin sản phẩm
            $productDetail = $this->inventoryService->getInventoryDetail($id, $request);

            if (!$productDetail) {
                return redirect()
                    ->route('admin.inventory.index')
                    ->with('error', 'Không tìm thấy thông tin sản phẩm.');
            }

            // Lấy lịch sử giao dịch
            $transactions = $this->inventoryService->getTransactionHistory(
                $id,
                $request->input('start_date'),
                $request->input('end_date'),
                $request->input('type')
            );

            return Inertia::render('Inventory/Transactions', [
                'product' => $productDetail,
                'transactions' => $transactions,
                'filters' => $request->only(['start_date', 'end_date', 'type']),
            ]);
        } catch (\Exception $e) {
            return redirect()
                ->route('admin.inventory.index')
                ->with('error', 'Có lỗi xảy ra: ' . $e->getMessage());
        }
    }

    public function updateProduct(Request $request)
    {
        try {
            $this->productVariantService->update($request);

            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật sản phẩm thành công.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật sản phẩm thất bại. Vui lòng thử lại.',
            ], 500);
        }
    }
}
