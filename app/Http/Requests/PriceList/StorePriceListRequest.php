<?php

namespace App\Http\Requests\PriceList;

use Illuminate\Foundation\Http\FormRequest;

class StorePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',

            'description' => 'nullable|string',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after_or_equal:start_date',

            'publish' => 'required|integer|in:0,1',

            'price_list_items' => 'required|array|min:1',

            'price_list_items.*.product_variant_id' =>
                'required|integer|exists:product_variants,id',

            'price_list_items.*.sale_price' =>
                'required|numeric|min:0',

            'price_list_items.*.output_tax_id' =>
                'required|integer|exists:vat_taxes,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên bảng giá là bắt buộc.',
            'start_date.required' => 'Ngày bắt đầu là bắt buộc.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',

            'price_list_items.required' => 'Bảng giá phải có ít nhất 1 sản phẩm.',
            'price_list_items.*.product_variant_id.exists' =>
                'Biến thể sản phẩm không tồn tại.',
            'price_list_items.*.sale_price.min' =>
                'Giá bán phải lớn hơn hoặc bằng 0.',
            'price_list_items.*.output_tax_id.exists' =>
                'Thuế đầu ra không hợp lệ.',
        ];
    }
}