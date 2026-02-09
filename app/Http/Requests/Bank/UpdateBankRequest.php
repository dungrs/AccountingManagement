<?php

namespace App\Http\Requests\Bank;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateBankRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'id' => 'required|exists:banks,id',

            'name' => 'required|string|max:150',
            'short_name' => 'nullable|string|max:50',
            'swift_code' => 'nullable|string|max:20',
            'bin_code' => 'nullable|string|max:10',
            'logo' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'id.required' => 'Không tìm thấy ID ngân hàng.',
            'id.exists' => 'Ngân hàng không tồn tại.',

            'name.required' => 'Tên ngân hàng không được để trống.',
            'name.max' => 'Tên ngân hàng tối đa 150 ký tự.',

            'short_name.max' => 'Tên viết tắt tối đa 50 ký tự.',
            'swift_code.max' => 'Swift code tối đa 20 ký tự.',
            'bin_code.max' => 'BIN code tối đa 10 ký tự.',
        ];
    }
}