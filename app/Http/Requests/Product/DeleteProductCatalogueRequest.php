<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\CheckProductCatalogueChildrenRule;
use Illuminate\Contracts\Validation\Validator;

class DeleteProductCatalogueRequest extends FormRequest
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
        $id = $this->route('id');

        $validator->after(function (Validator $validator) use ($id) {
            (new CheckProductCatalogueChildrenRule($id))
                ->validate('id', $id, function (string $message) use ($validator) {
                    $validator->errors()->add('id', $message);
                });
        });
    }
}