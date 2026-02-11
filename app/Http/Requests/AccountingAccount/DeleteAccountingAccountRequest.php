<?php

namespace App\Http\Requests\AccountingAccount;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\CheckAccountingAccountChildrenRule;
use Illuminate\Contracts\Validation\Validator;

class DeleteAccountingAccountRequest extends FormRequest
{
    /**
     * Xác định quyền thực hiện request
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Không cần rules vì delete không submit field
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * Validate bổ sung sau khi rules chạy
     */
    public function withValidator(Validator $validator): void
    {
        $id = $this->id;

        $validator->after(function (Validator $validator) use ($id) {
            (new CheckAccountingAccountChildrenRule($id))
                ->validate('id', $id, function (string $message) use ($validator) {
                    $validator->errors()->add('id', $message);
                });
        });
    }
}