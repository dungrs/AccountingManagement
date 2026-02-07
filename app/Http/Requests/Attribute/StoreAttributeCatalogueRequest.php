<?php

namespace App\Http\Requests\Attribute;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttributeCatalogueRequest extends FormRequest
{
    /**
     * Xác định quyền thực hiện request
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Các rule validate
     */
    public function rules(): array
    {
        return [
            'name' => 'required',
            'canonical' => 'required|unique:routers,canonical',
        ];
    }

    /**
     * Thông báo lỗi validate (tiếng Việt)
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên danh mục thuộc tính.',

            'canonical.required' => 'Vui lòng nhập đường dẫn (canonical).',
            'canonical.unique'   => 'Đường dẫn (canonical) này đã tồn tại, vui lòng chọn giá trị khác.',
        ];
    }
}