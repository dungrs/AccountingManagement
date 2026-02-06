<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserCatalogueRequest extends FormRequest
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

        if ($this->has('email')) {
            $rules['email'] = 'required|string|email|unique:user_catalogues|max:250';
        }

        if ($this->has('phone')) {
            $rules['phone'] = 'required|string|max:20';
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

            // Email
            'email.required' => 'Email không được để trống.',
            'email.string'   => 'Email phải là chuỗi ký tự.',
            'email.email'    => 'Email không đúng định dạng.',
            'email.unique'   => 'Email này đã tồn tại trong hệ thống.',
            'email.max'      => 'Email không được vượt quá 250 ký tự.',

            // Phone
            'phone.required' => 'Số điện thoại không được để trống.',
            'phone.string'   => 'Số điện thoại phải là chuỗi ký tự.',
            'phone.max'      => 'Số điện thoại không được vượt quá 20 ký tự.',

            // Description (nếu có validate thì mới cần)
            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max'    => 'Mô tả không được vượt quá số ký tự cho phép.',
        ];
    }
}