<?php
// app/Http/Requests/Inventory/UpdateInventoryRequest.php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'new_quantity' => 'required|numeric|min:0',
            'reason' => 'required|string|max:255',
            'adjustment_date' => 'nullable|date',
            'adjustment_id' => 'nullable|integer',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'product_variant_id.required' => 'Vui lòng chọn sản phẩm',
            'product_variant_id.exists' => 'Sản phẩm không tồn tại',
            'new_quantity.required' => 'Vui lòng nhập số lượng mới',
            'new_quantity.numeric' => 'Số lượng phải là số',
            'new_quantity.min' => 'Số lượng không được nhỏ hơn 0',
            'reason.required' => 'Vui lòng nhập lý do điều chỉnh',
        ];
    }
}