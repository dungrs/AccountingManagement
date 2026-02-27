<?php
// app/Http/Requests/Inventory/IssueStockRequest.php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class IssueStockRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'reference_type' => 'nullable|string|max:50',
            'reference_id' => 'nullable|integer',
            'transaction_date' => 'nullable|date',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'items.required' => 'Vui lòng nhập danh sách sản phẩm',
            'items.*.product_variant_id.required' => 'Mã sản phẩm không được để trống',
            'items.*.quantity.required' => 'Số lượng không được để trống',
            'items.*.quantity.min' => 'Số lượng phải lớn hơn 0',
        ];
    }
}