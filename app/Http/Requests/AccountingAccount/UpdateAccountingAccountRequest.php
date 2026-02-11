<?php

namespace App\Http\Requests\AccountingAccount;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\AccountTypeEnum;
use App\Models\AccountingAccount;

class UpdateAccountingAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Lấy ID từ route parameter
        $accountId = $this->route('id') ?? $this->id;

        return [
            /* ========= CORE ========= */

            // Số hiệu tài khoản (không trùng, trừ chính nó)
            'account_code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('accounting_accounts', 'account_code')->ignore($accountId),
            ],

            // Tài khoản cha
            'parent_id' => [
                'nullable',
                'integer',
                'exists:accounting_accounts,id',
                Rule::notIn([$accountId]), // không cho làm cha của chính nó
            ],

            // Loại tài khoản
            'account_type' => [
                'required',
                Rule::in(array_column(AccountTypeEnum::cases(), 'value')),
            ],

            // Bên nợ/có (debit/credit)
            'normal_balance' => [
                'nullable',
                'string',
                'in:debit,credit',
            ],

            // Trạng thái publish
            'publish' => [
                'nullable',
                'integer',
                'in:0,1,2',
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

            /* parent */
            'parent_id.exists' => 'Tài khoản cha không tồn tại.',
            'parent_id.not_in' => 'Không thể chọn chính tài khoản này làm tài khoản cha.',

            /* account_type */
            'account_type.required' => 'Vui lòng chọn loại tài khoản.',
            'account_type.in'       => 'Loại tài khoản không hợp lệ.',

            /* normal_balance */
            'normal_balance.in' => 'Bên cân đối phải là debit hoặc credit.',

            /* publish */
            'publish.in' => 'Trạng thái không hợp lệ.',

            /* name */
            'name.required' => 'Vui lòng nhập tên tài khoản.',
            'name.max'      => 'Tên tài khoản không được vượt quá 255 ký tự.',
        ];
    }

    /**
     * Validate nâng cao (nghiệp vụ kế toán)
     */
    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            
            $accountId   = $this->route('id') ?? $this->id;
            $parentId    = $this->input('parent_id');

            $account = AccountingAccount::find($accountId);

            if (!$account) {
                $validator->errors()->add('id', 'Tài khoản không tồn tại.');
                return;
            }

            /* Không cho đổi loại nếu đã phát sinh bút toán */
            // if ($account->journalLines()->exists()
            //     && $account->account_type->value !== $accountType) {
            //     $validator->errors()->add(
            //         'account_type',
            //         'Không thể thay đổi loại tài khoản khi đã phát sinh hạch toán.'
            //     );
            // }

            /* Kiểm tra tài khoản con */
            // $hasChildren = AccountingAccount::where('parent_id', $accountId)->exists();
            // if ($hasChildren && $parentId != $account->parent_id) {
            //     $validator->errors()->add(
            //         'parent_id',
            //         'Không thể thay đổi tài khoản cha khi đã có tài khoản con.'
            //     );
            // }

            /* Nếu có cha → phải cùng loại */
            if ($parentId && $parentId > 0) {
                $parent = AccountingAccount::find($parentId);

                if (!$parent) {
                    $validator->errors()->add('parent_id', 'Tài khoản cha không tồn tại.');
                    return;
                }

                // if ($parent->account_type->value !== $accountType) {
                //     $validator->errors()->add(
                //         'parent_id',
                //         'Tài khoản con phải cùng loại với tài khoản cha.'
                //     );
                // }

                /* Không cho chọn con làm cha */
                if ($parent->lft > $account->lft && $parent->rgt < $account->rgt) {
                    $validator->errors()->add(
                        'parent_id',
                        'Không thể chọn tài khoản con làm tài khoản cha.'
                    );
                }
            }
        });
    }
}