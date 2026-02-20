<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentVoucherRequest extends FormRequest
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
            'user_id'          => ['sometimes', 'exists:users,id'],
            'partner_id'      => ['sometimes', 'exists:suppliers,id'],

            'voucher_date'     => ['sometimes', 'date'],
            'status'           => ['sometimes', 'in:draft,confirmed'],
            'note'             => ['nullable', 'string', 'max:1000'],
            'code'             => ['nullable', 'string', 'max:50'],

            'amount'           => ['sometimes', 'numeric', 'min:0'],
            'payment_method'   => ['sometimes', 'in:cash,bank'],
        ];
    }

    protected function journalEntryRules(): array
    {
        return [
            'journal_entries'                => ['sometimes', 'array', 'min:2'],
            'journal_entries.*.account_code' => ['required', 'string', 'exists:accounting_accounts,account_code'],
            'journal_entries.*.debit'        => ['required', 'numeric', 'min:0'],
            'journal_entries.*.credit'       => ['required', 'numeric', 'min:0'],
        ];
    }

    // public function withValidator($validator)
    // {
    //     $validator->after(function ($validator) {

    //         if ($this->payment_method === 'bank' && empty($this->bank_account_id)) {
    //             $validator->errors()->add(
    //                 'bank_account_id',
    //                 'Nếu thanh toán qua ngân hàng thì phải chọn tài khoản ngân hàng.'
    //             );
    //         }

    //         if ($this->has('journal_entries')) {
    //             $totalDebit  = collect($this->journal_entries)->sum('debit');
    //             $totalCredit = collect($this->journal_entries)->sum('credit');

    //             if (abs($totalDebit - $totalCredit) > 0.01) {
    //                 $validator->errors()->add(
    //                     'journal_entries',
    //                     'Tổng nợ và tổng có không khớp nhau. (' .
    //                         number_format($totalDebit) . ' ≠ ' . number_format($totalCredit) . ')'
    //                 );
    //             }
    //         }

    //         if ($this->has('journal_entries') && $this->amount) {
    //             $totalCredit = collect($this->journal_entries)->sum('credit');

    //             if (abs($totalCredit - $this->amount) > 0.01) {
    //                 $validator->errors()->add(
    //                     'amount',
    //                     'Số tiền phiếu chi phải bằng tổng Có của bút toán. (' .
    //                         number_format($this->amount) . ' ≠ ' . number_format($totalCredit) . ')'
    //                 );
    //             }
    //         }
    //     });
    // }
}
