<?php

namespace App\Http\Requests\Receipt;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = $this->baseRules();

        // Nếu không phải hủy phiếu thì validate sản phẩm và bút toán
        if ($this->input('status') !== 'cancel') {
            $rules = array_merge(
                $rules, 
                $this->productVariantRules(),
                $this->journalEntryRules()
            );
        }

        return $rules;
    }

    protected function baseRules(): array
    {
        return [
            'user_id'       => ['required', 'exists:users,id'],
            'supplier_id'   => ['required', 'exists:suppliers,id'],
            'receipt_date'  => ['required', 'date'],
            'status'        => ['required', 'in:draft,confirmed,cancelled'],
            'note'          => ['nullable', 'string', 'max:1000'],
            'code'          => ['nullable', 'string', 'max:50'],
        ];
    }

    protected function productVariantRules(): array
    {
        return [
            'product_variants'                      => ['required', 'array', 'min:1'],
            'product_variants.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'product_variants.*.quantity'           => ['required', 'numeric', 'min:0.01'],
            'product_variants.*.price'              => ['required', 'numeric', 'min:0'],
            'product_variants.*.vat_id'             => ['nullable', 'exists:vat_taxes,id'],
            'product_variants.*.vat_amount'          => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function journalEntryRules(): array
    {
        return [
            'journal_entries'          => ['nullable', 'array'],
            'journal_entries.*.account_code' => ['required', 'string', 'exists:accounting_accounts,account_code'],
            'journal_entries.*.debit'  => ['required', 'numeric', 'min:0'],
            'journal_entries.*.credit' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required'     => 'Người cập nhật phiếu không được để trống.',
            'supplier_id.required' => 'Nhà cung cấp không được để trống.',

            'receipt_date.required' => 'Ngày nhập không được để trống.',
            
            'product_variants.required'       => 'Phiếu nhập phải có ít nhất 1 sản phẩm.',
            'product_variants.min'            => 'Phiếu nhập phải có ít nhất 1 sản phẩm.',
            'product_variants.*.product_variant_id.required' => 'ID sản phẩm không được để trống.',
            'product_variants.*.product_variant_id.exists'   => 'Sản phẩm không tồn tại.',
            'product_variants.*.quantity.required' => 'Số lượng không được để trống.',
            'product_variants.*.quantity.min'     => 'Số lượng phải lớn hơn 0.',
            'product_variants.*.price.required'   => 'Giá không được để trống.',
            'product_variants.*.price.min'        => 'Giá phải lớn hơn hoặc bằng 0.',
            'product_variants.*.vat_id.exists'    => 'Mã thuế không tồn tại.',
            
            'status.in'            => 'Trạng thái không hợp lệ.',
            
            'journal_entries.*.account_code.required' => 'Mã tài khoản không được để trống.',
            'journal_entries.*.account_code.exists'   => 'Mã tài khoản không tồn tại.',
            'journal_entries.*.debit.required' => 'Số tiền nợ không được để trống.',
            'journal_entries.*.credit.required' => 'Số tiền có không được để trống.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Kiểm tra cân bằng bút toán khi status không phải cancel
            if ($this->input('status') !== 'cancel' && $this->has('journal_entries')) {
                $totalDebit = collect($this->journal_entries)->sum('debit');
                $totalCredit = collect($this->journal_entries)->sum('credit');
                
                if (abs($totalDebit - $totalCredit) > 0.01) {
                    $validator->errors()->add(
                        'journal_entries', 
                        'Tổng nợ và tổng có không khớp nhau. (' . 
                        number_format($totalDebit) . ' ≠ ' . number_format($totalCredit) . ')'
                    );
                }
            }
        });
    }
}