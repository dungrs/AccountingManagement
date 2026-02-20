<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class StoreReceiptVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(
            $this->baseRules(),
            $this->journalEntryRules()
        );
    }

    protected function baseRules(): array
    {
        return [
            'user_id'          => ['required', 'exists:users,id'],
            // 'partner_id'      => ['required', 'exists:customers,id'],

            'voucher_date'     => ['required', 'date'],
            'status'           => ['required', 'in:draft,confirmed'],
            'note'             => ['nullable', 'string', 'max:1000'],
            'code'             => ['nullable', 'string', 'max:50', 'unique:receipt_vouchers,code'],

            'amount'           => ['required', 'numeric', 'min:0'],
            'payment_method'   => ['required', 'in:cash,bank'],
        ];
    }

    protected function journalEntryRules(): array
    {
        return [
            'journal_entries'                => ['required', 'array', 'min:2'],
            'journal_entries.*.account_code' => ['required', 'string', 'exists:accounting_accounts,account_code'],
            'journal_entries.*.debit'        => ['required', 'numeric', 'min:0'],
            'journal_entries.*.credit'       => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Người tạo phiếu không được để trống.',
            'user_id.exists'   => 'Người tạo phiếu không tồn tại.',

            // 'partner_id.required' => 'Khách hàng không được để trống.',
            // 'partner_id.exists'   => 'Khách hàng không tồn tại.',

            'voucher_date.required' => 'Ngày lập phiếu không được để trống.',
            'voucher_date.date'     => 'Ngày lập phiếu không hợp lệ.',

            'status.required' => 'Trạng thái không được để trống.',
            'status.in'       => 'Trạng thái không hợp lệ.',

            'amount.required' => 'Số tiền không được để trống.',
            'amount.numeric'  => 'Số tiền phải là số.',
            'amount.min'      => 'Số tiền phải lớn hơn hoặc bằng 0.',

            'payment_method.required' => 'Phương thức thanh toán không được để trống.',
            'payment_method.in'       => 'Phương thức thanh toán không hợp lệ (cash hoặc bank).',

            'journal_entries.required' => 'Phiếu thu phải có bút toán.',
            'journal_entries.array'    => 'Bút toán không hợp lệ.',
            'journal_entries.min'      => 'Phiếu thu phải có ít nhất 2 dòng bút toán.',

            'journal_entries.*.account_code.required' => 'Mã tài khoản không được để trống.',
            'journal_entries.*.account_code.exists'   => 'Mã tài khoản không tồn tại.',

            'journal_entries.*.debit.required'  => 'Số tiền nợ không được để trống.',
            'journal_entries.*.credit.required' => 'Số tiền có không được để trống.',

            'code.unique' => 'Mã phiếu thu đã tồn tại trong hệ thống.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Kiểm tra cân bằng bút toán
            if ($this->has('journal_entries')) {
                $totalDebit  = collect($this->journal_entries)->sum('debit');
                $totalCredit = collect($this->journal_entries)->sum('credit');

                if (abs($totalDebit - $totalCredit) > 0.01) {
                    $validator->errors()->add(
                        'journal_entries',
                        'Tổng nợ và tổng có không khớp nhau. (' .
                            number_format($totalDebit) . ' ≠ ' . number_format($totalCredit) . ')'
                    );
                }
            }

            // Kiểm tra amount phải khớp với tổng debit hoặc credit (tuỳ quy ước)
            // Với phiếu thu: amount phải bằng tổng Nợ của bút toán (vì tiền thu vào ghi Nợ TK tiền)
            if ($this->has('journal_entries') && $this->amount) {
                $totalDebit = collect($this->journal_entries)->sum('debit');

                if (abs($totalDebit - $this->amount) > 0.01) {
                    $validator->errors()->add(
                        'amount',
                        'Số tiền phiếu thu phải bằng tổng Nợ của bút toán. (' .
                            number_format($this->amount) . ' ≠ ' . number_format($totalDebit) . ')'
                    );
                }
            }
        });
    }
}