<?php

namespace App\Http\Requests\Receipt;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalesReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(
            $this->baseRules(),
            $this->productVariantRules(),
            $this->journalEntryRules()
        );
    }

    protected function baseRules(): array
    {
        return [
            'user_id'           => ['required', 'exists:users,id'],
            'customer_id'       => ['required', 'exists:customers,id'],
            'price_list_id'     => ['nullable', 'exists:price_lists,id'],
            'receipt_date'      => ['required', 'date'],
            'status'            => ['required', 'in:draft,confirmed'],
            'note'              => ['nullable', 'string', 'max:1000'],
            'code'              => ['nullable', 'string', 'max:50', 'unique:sales_receipts,code'],
        ];
    }

    protected function productVariantRules(): array
    {
        return [
            'product_variants'                               => ['required', 'array', 'min:1'],
            'product_variants.*.product_variant_id'          => ['required', 'exists:product_variants,id'],
            'product_variants.*.quantity'                    => ['required', 'numeric', 'min:0.01'],
            'product_variants.*.price'                       => ['required', 'numeric', 'min:0'],
            'product_variants.*.vat_id'                      => ['nullable', 'exists:vat_taxes,id'],
            'product_variants.*.vat_amount'                  => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function journalEntryRules(): array
    {
        return [
            'journal_entries'                    => ['nullable', 'array'],
            'journal_entries.*.account_code'     => ['required', 'string', 'exists:accounting_accounts,account_code'],
            'journal_entries.*.debit'            => ['required', 'numeric', 'min:0'],
            'journal_entries.*.credit'           => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required'           => 'Người tạo phiếu không được để trống.',
            'user_id.exists'              => 'Người tạo phiếu không tồn tại.',

            'customer_id.required'       => 'Khách hàng không được để trống.',
            'customer_id.exists'         => 'Khách hàng không tồn tại.',

            'receipt_date.required'      => 'Ngày xuất không được để trống.',
            'receipt_date.date'           => 'Ngày xuất không hợp lệ.',

            'product_variants.required'  => 'Phiếu xuất phải có ít nhất 1 sản phẩm.',
            'product_variants.min'       => 'Phiếu xuất phải có ít nhất 1 sản phẩm.',

            'product_variants.*.product_variant_id.required' => 'ID sản phẩm không được để trống.',
            'product_variants.*.product_variant_id.exists'   => 'Sản phẩm không tồn tại.',

            'product_variants.*.quantity.required' => 'Số lượng không được để trống.',
            'product_variants.*.quantity.min'     => 'Số lượng phải lớn hơn 0.',
            'product_variants.*.quantity.numeric' => 'Số lượng phải là số.',

            'product_variants.*.price.required'   => 'Đơn giá không được để trống.',
            'product_variants.*.price.min'        => 'Đơn giá phải lớn hơn hoặc bằng 0.',
            'product_variants.*.price.numeric'    => 'Đơn giá phải là số.',

            'product_variants.*.vat_id.exists'    => 'Mã thuế không tồn tại.',

            'status.required'             => 'Trạng thái không được để trống.',
            'status.in'                   => 'Trạng thái không hợp lệ.',

            'code.unique'                 => 'Mã phiếu xuất đã tồn tại trong hệ thống.',

            'journal_entries.*.account_code.required' => 'Mã tài khoản không được để trống.',
            'journal_entries.*.account_code.exists'   => 'Mã tài khoản không tồn tại.',
            'journal_entries.*.debit.required' => 'Số tiền nợ không được để trống.',
            'journal_entries.*.debit.numeric'  => 'Số tiền nợ phải là số.',
            'journal_entries.*.credit.required' => 'Số tiền có không được để trống.',
            'journal_entries.*.credit.numeric'  => 'Số tiền có phải là số.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Kiểm tra cân bằng bút toán
            if ($this->has('journal_entries') && !empty($this->journal_entries)) {
                $totalDebit = collect($this->journal_entries)->sum('debit');
                $totalCredit = collect($this->journal_entries)->sum('credit');

                if (abs($totalDebit - $totalCredit) > 0.01) {
                    $validator->errors()->add(
                        'journal_entries',
                        'Tổng nợ và tổng có không khớp nhau. (' .
                            number_format($totalDebit, 2) . ' ≠ ' . number_format($totalCredit, 2) . ')'
                    );
                }
            }
        });
    }
}