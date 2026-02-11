<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $rules = [
            'email' => 'required|string|email|unique:customers,email,' . $this->id . '|max:250',
            'name' => 'required|string',
            'birthday' => 'required|date_format:d/m/Y',
        ];

        if (
            $this->filled('password') || 
            $this->filled('password_confirmation')
        ) {
            $rules['password'] = 'required|string|min:6';
            $rules['password_confirmation'] = 'required|same:password';
        }

        return $rules;
    }

    public function messages()
    {
        return [
            'email.required' => 'Email không được để trống.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã tồn tại trong hệ thống.',
            'email.string' => 'Email phải là chuỗi ký tự.',
            'email.max' => 'Email không được vượt quá 250 ký tự.',

            'name.required' => 'Họ và tên không được để trống.',
            'name.string' => 'Họ và tên phải là chuỗi ký tự.',

            'user_catalogue_id.required' => 'Vui lòng chọn nhóm người dùng.',
            'user_catalogue_id.integer' => 'Nhóm người dùng không hợp lệ.',
            'user_catalogue_id.gt' => 'Vui lòng chọn nhóm người dùng hợp lệ.',

            'birthday.required' => 'Ngày sinh không được để trống.',
            'birthday.date_format' => 'Ngày sinh không đúng định dạng (d/m/Y).',

            'password.required' => 'Mật khẩu không được để trống.',
            'password.string' => 'Mật khẩu phải là chuỗi ký tự.',
            'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',

            'password_confirmation.required' => 'Vui lòng nhập lại mật khẩu.',
            'password_confirmation.same' => 'Mật khẩu nhập lại không khớp.',
        ];
    }
}