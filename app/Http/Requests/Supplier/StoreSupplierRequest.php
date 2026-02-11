<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    /**
     * Authorize the request.
     */
    public function authorize(): bool
    {
        return true; // bạn có thể thêm permission ở đây nếu cần
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [
            // ===== Thông tin cơ bản =====
            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'tax_code' => [
                'required',
                'string',
                'max:13',
                'min:10',
                'unique:suppliers,tax_code',
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
            ],

            'fax' => [
                'nullable',
                'string',
                'max:20',
            ],

            'email' => [
                'nullable',
                'email',
                'max:150',
                'unique:suppliers,email',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'avatar' => [
                'nullable',
                'string',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            // ===== Bank Accounts =====
            'bank_accounts' => [
                'nullable',
                'array',
            ],

            'bank_accounts.*.bank_code' => [
                'required_with:bank_accounts',
                'exists:banks,bank_code',
            ],

            'bank_accounts.*.account_number' => [
                'required_with:bank_accounts',
                'string',
                'max:50',
            ],
        ];
    }

    /**
     * Custom error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Tên nhà cung cấp là bắt buộc.',
            'phone.required' => 'Số điện thoại là bắt buộc.',
            'tax_code.required' => 'Mã số thuế là bắt buộc.',
            'tax_code.unique' => 'Mã số thuế đã tồn tại.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã tồn tại.',
            'bank_accounts.*.bank_code.required_with' => 'Vui lòng chọn ngân hàng.',
            'bank_accounts.*.bank_code.exists' => 'Ngân hàng không hợp lệ.',
            'bank_accounts.*.account_number.required_with' => 'Vui lòng nhập số tài khoản.',
        ];
    }
}
