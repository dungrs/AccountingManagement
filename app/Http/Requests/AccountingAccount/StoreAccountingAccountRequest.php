<?php

namespace App\Http\Requests\AccountingAccount;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\AccountTypeEnum;

class StoreAccountingAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            /* ========= CORE ========= */

            // Số hiệu tài khoản: không trùng
            'account_code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('accounting_accounts', 'account_code')
            ],

            // Loại tài khoản (Enum)
            'account_type' => [
                'required',
                Rule::in(array_column(AccountTypeEnum::cases(), 'value')),
            ],

            /* ========= LANGUAGE ========= */

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            /* account_code */
            'account_code.required' => 'Vui lòng nhập số hiệu tài khoản.',
            'account_code.unique'   => 'Số hiệu tài khoản này đã tồn tại.',
            'account_code.max'      => 'Số hiệu tài khoản không được vượt quá 20 ký tự.',

            /* account_type */
            'account_type.required' => 'Vui lòng chọn loại tài khoản.',
            'account_type.in'       => 'Loại tài khoản không hợp lệ.',

            /* name */
            'name.required' => 'Vui lòng nhập tên tài khoản.',
            'name.max'      => 'Tên tài khoản không được vượt quá 255 ký tự.',
        ];
    }

    /**
     * Validate nâng cao sau rule
     */
    // protected function withValidator($validator)
    // {
    //     $validator->after(function ($validator) {

    //         $parentId = $this->input('parent_id');
    //         $accountType = $this->input('account_type');

    //         // Nếu có tài khoản cha → kiểm tra cùng loại
    //         if ($parentId) {
    //             $parent = \App\Models\AccountingAccount::find($parentId);

    //             if ($parent && $parent->account_type->value !== $accountType) {
    //                 $validator->errors()->add(
    //                     'parent_id',
    //                     'Tài khoản con phải cùng loại với tài khoản cha.'
    //                 );
    //             }
    //         }
    //     });
    // }
}