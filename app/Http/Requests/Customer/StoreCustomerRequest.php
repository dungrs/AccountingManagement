<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {   
        return [
            'email' => 'required|string|email|unique:customers,email,NULL,id,deleted_at,NULL|max:250',
            'name' => 'required|string',
            'password' => "required|string|min:6",
            'password_confirmation' => "required|string|same:password",
            'birthday' => "required|date_format:d/m/Y"
        ];
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

            'birthday.required' => 'Ngày sinh không được để trống.',
            'birthday.date_format' => 'Ngày sinh không đúng định dạng (d/m/Y).',

            'password.required' => 'Mật khẩu không được để trống.',
            'password.string' => 'Mật khẩu phải là chuỗi ký tự.',
            'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',

            'password_confirmation.required' => 'Vui lòng nhập lại mật khẩu.',
            'password_confirmation.string' => 'Mật khẩu nhập lại phải là chuỗi ký tự.',
            'password_confirmation.same' => 'Mật khẩu nhập lại không khớp.',
        ];
    }
}