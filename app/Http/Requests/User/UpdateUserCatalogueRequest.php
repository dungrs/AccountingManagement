<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserCatalogueRequest extends FormRequest
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
            'email'       => 'required|string|email|unique:user_catalogues,email,' . $this->id . '|max:250',
            'phone'       => 'required|string|max:20',
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

            // Description
            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max'    => 'Mô tả không được vượt quá 500 ký tự.',
        ];
    }
}
