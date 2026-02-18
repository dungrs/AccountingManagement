<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentVoucherRequest extends FormRequest
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
            // 'partner_id'      => ['required', 'exists:suppliers,id'],

            'voucher_date'     => ['required', 'date'],
            'status'           => ['required', 'in:draft,confirmed'],
            'note'             => ['nullable', 'string', 'max:1000'],
            'code'             => ['nullable', 'string', 'max:50'],

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

            // 'partner_id.required' => 'Nhà cung cấp không được để trống.',
            // 'partner_id.exists'   => 'Nhà cung cấp không tồn tại.',

            'voucher_date.required' => 'Ngày lập phiếu không được để trống.',
            'voucher_date.date'     => 'Ngày lập phiếu không hợp lệ.',

            'status.required' => 'Trạng thái không được để trống.',
            'status.in'       => 'Trạng thái không hợp lệ.',

            'amount.required' => 'Số tiền không được để trống.',
            'amount.numeric'  => 'Số tiền phải là số.',
            'amount.min'      => 'Số tiền phải lớn hơn hoặc bằng 0.',

            'payment_method.required' => 'Phương thức thanh toán không được để trống.',
            'payment_method.in'       => 'Phương thức thanh toán không hợp lệ (cash hoặc bank).',

            'journal_entries.required' => 'Phiếu chi phải có bút toán.',
            'journal_entries.array'    => 'Bút toán không hợp lệ.',
            'journal_entries.min'      => 'Phiếu chi phải có ít nhất 2 dòng bút toán.',

            'journal_entries.*.account_code.required' => 'Mã tài khoản không được để trống.',
            'journal_entries.*.account_code.exists'   => 'Mã tài khoản không tồn tại.',

            'journal_entries.*.debit.required'  => 'Số tiền nợ không được để trống.',
            'journal_entries.*.credit.required' => 'Số tiền có không được để trống.',
        ];
    }

    // public function withValidator($validator)
    // {
    //     $validator->after(function ($validator) {

    //         // Nếu payment_method = bank => bắt buộc có bank_account_id
    //         if ($this->payment_method === 'bank' && empty($this->bank_account_id)) {
    //             $validator->errors()->add(
    //                 'bank_account_id',
    //                 'Nếu thanh toán qua ngân hàng thì phải chọn tài khoản ngân hàng.'
    //             );
    //         }

    //         // Kiểm tra cân bằng bút toán
    //         if ($this->has('journal_entries')) {
    //             $totalDebit  = collect($this->journal_entries)->sum('debit');
    //             $totalCredit = collect($this->journal_entries)->sum('credit');

    //             if (abs($totalDebit - $totalCredit) > 0.01) {
    //                 $validator->errors()->add(
    //                     'journal_entries',
    //                     'Tổng nợ và tổng có không khớp nhau. (' .
    //                     number_format($totalDebit) . ' ≠ ' . number_format($totalCredit) . ')'
    //                 );
    //             }
    //         }

    //         // Kiểm tra amount phải khớp với tổng credit hoặc debit (tuỳ bạn quy ước)
    //         if ($this->has('journal_entries') && $this->amount) {
    //             $totalCredit = collect($this->journal_entries)->sum('credit');

    //             if (abs($totalCredit - $this->amount) > 0.01) {
    //                 $validator->errors()->add(
    //                     'amount',
    //                     'Số tiền phiếu chi phải bằng tổng Có của bút toán. (' .
    //                     number_format($this->amount) . ' ≠ ' . number_format($totalCredit) . ')'
    //                 );
    //             }
    //         }
    //     });
    // }
}
