<?php

namespace App\Http\Requests\Receipt;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(
            $this->baseRules(),
            $this->itemRules()
        );
    }

    protected function baseRules(): array
    {
        return [
            'user_id'      => ['required', 'exists:users,id'],
            'supplier_id'  => ['required', 'exists:suppliers,id'],
            'receipt_date' => ['required', 'date'],
            'status'       => ['required', 'in:draft,confirmed'],
            'note'         => ['nullable', 'string', 'max:1000'],
        ];
    }

    protected function itemRules(): array
    {
        return [
            'items'                      => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.quantity'           => ['required', 'numeric', 'min:0.01'],
            'items.*.price'              => ['required', 'numeric', 'min:0'],
            'items.*.vat_id'             => ['nullable', 'exists:taxes,id'],
            'items.*.vat_amount'         => ['nullable', 'numeric', 'min:0'],
            'items.*.subtotal'           => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required'     => 'Người tạo phiếu không được để trống.',
            'supplier_id.required' => 'Nhà cung cấp không được để trống.',
            'items.required'       => 'Phiếu nhập phải có ít nhất 1 sản phẩm.',
            'items.min'            => 'Phiếu nhập phải có ít nhất 1 sản phẩm.',
            'status.in'            => 'Trạng thái không hợp lệ.',
        ];
    }
}