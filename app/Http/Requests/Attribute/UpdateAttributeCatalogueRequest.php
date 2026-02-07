<?php

namespace App\Http\Requests\Attribute;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttributeCatalogueRequest extends FormRequest
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
            'canonical' => [
                'required',
                Rule::unique('routers', 'canonical')
                    ->ignore($this->route('id'), 'module_id'),
            ],
        ];
    }

    /**
     * Thông báo lỗi validate (tiếng Việt)
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên nhóm thuộc tính.',

            'canonical.required' => 'Vui lòng nhập slug (đường dẫn tĩnh).',
            'canonical.unique'   => 'Slug (đường dẫn tĩnh) này đã tồn tại, vui lòng chọn giá trị khác.',
        ];
    }
}