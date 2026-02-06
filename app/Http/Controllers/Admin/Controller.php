<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Http\Request;

class Controller
{   
    use AuthorizesRequests, DispatchesJobs;

    public function changeStatus(Request $request, $id)
    {
        try {
            $payload = $request->all();

            $serviceClass = resolveInstance(
                $payload['model'],
                $payload['modelParent'] ?? ''
            );

            $result = $serviceClass->updateStatus($payload, $id);

            if (!$result) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cập nhật trạng thái không thành công!'
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Cập nhật trạng thái thành công!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Có lỗi xảy ra! Vui lòng thử lại!'
            ], 500);
        }
    }

    public function changeStatusAll(Request $request)
    {
        try {
            $payload = $request->all();

            $serviceClass = resolveInstance(
                $payload['model'],
                $payload['modelParent'] ?? ''
            );

            $result = $serviceClass->updateStatusAll($payload);

            if (!$result) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cập nhật trạng thái không thành công!'
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Cập nhật trạng thái thành công!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Có lỗi xảy ra! Vui lòng thử lại!'
            ], 500);
        }
    }
}