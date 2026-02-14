<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => [
                'nullable',
                'string',
                'max:255',
                'required_without:barcode',
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:255',
                'required_without:sku',
            ],

            'quantity' => [
                'required',
                'integer',
                'min:0',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.required_without' => 'Vui lòng nhập SKU hoặc Barcode.',
            'barcode.required_without' => 'Vui lòng nhập SKU hoặc Barcode.',
        ];
    }
}