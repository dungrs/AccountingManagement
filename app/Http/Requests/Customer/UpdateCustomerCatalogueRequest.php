<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerCatalogueRequest extends FormRequest
{
    /**
     * Xác định người dùng có được phép thực hiện request này hay không.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Các rule validate áp dụng cho request cập nhật.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ];
    }

    /**
     * Thông báo lỗi validate tiếng Việt.
     *
     * @return array
     */
    public function messages()
    {
        return [
            // Name
            'name.required' => 'Tên không được để trống.',
            'name.string'   => 'Tên phải là chuỗi ký tự.',
            'name.max'      => 'Tên không được vượt quá 255 ký tự.',

            // Description
            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max'    => 'Mô tả không được vượt quá 500 ký tự.',
        ];
    }
}
