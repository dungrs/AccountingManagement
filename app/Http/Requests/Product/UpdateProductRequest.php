<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required',
            'canonical' => "required|unique:routers,canonical,{$this->id},module_id",
            'product_catalogue_id' => 'required|not_in:0',
            'attribute' => 'array|min:1',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Tên sản phẩm không được để trống.',

            'canonical.required' => 'Đường dẫn (canonical) không được để trống.',
            'canonical.unique' => 'Đường dẫn (canonical) đã tồn tại, vui lòng chọn đường dẫn khác.',

            'product_catalogue_id.required' => 'Bạn chưa chọn danh mục sản phẩm.',
            'product_catalogue_id.not_in' => 'Bạn chưa chọn danh mục sản phẩm.',

            'attribute.array' => 'Thuộc tính sản phẩm không hợp lệ.',
            'attribute.min' => 'Bạn phải chọn ít nhất 1 thuộc tính sản phẩm.',
        ];
    }

    /**
     * Kiểm tra nâng cao sau khi các rule mặc định đã được áp dụng.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {

            $attributes = $this->input('attribute');

            // Nếu attribute không tồn tại
            if ($attributes === null) {
                $validator->errors()->add('attribute', 'Bạn phải chọn ít nhất 1 thuộc tính sản phẩm.');
                return;
            }

            // Nếu attribute là mảng
            if (is_array($attributes)) {
                $hasValue = false;

                foreach ($attributes as $values) {
                    if (!empty($values)) {
                        $hasValue = true;
                        break;
                    }
                }

                if (!$hasValue) {
                    $validator->errors()->add('attribute', 'Bạn phải chọn ít nhất 1 thuộc tính sản phẩm.');
                }
            }
        });
    }
}