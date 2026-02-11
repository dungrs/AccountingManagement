<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerCatalogueRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $rules = [];

        if ($this->has('name')) {
            $rules['name'] = 'required|string|max:255';
        }

        return $rules;
    }

    public function messages()
    {
        return [
            // Name
            'name.required' => 'Tên không được để trống.',
            'name.string'   => 'Tên phải là chuỗi ký tự.',
            'name.max'      => 'Tên không được vượt quá 255 ký tự.',

            // Description (nếu có validate thì mới cần)
            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max'    => 'Mô tả không được vượt quá số ký tự cho phép.',
        ];
    }
}