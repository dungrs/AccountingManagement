<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReceiptVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [];

        // Nếu status là cancelled thì không cần validate các trường khác
        if ($this->input('status') === 'cancelled') {
            $rules['status'] = ['required', 'in:cancelled'];
        } else {
            $rules = array_merge(
                $this->baseRules(),
                $this->journalEntryRules()
            );
        }

        return $rules;
    }

    protected function baseRules(): array
    {
        return [
            'user_id'          => ['sometimes', 'exists:users,id'],
            // 'partner_id'      => ['sometimes', 'exists:customers,id'],

            'voucher_date'     => ['sometimes', 'date'],
            'status'           => ['sometimes', 'in:draft,confirmed,cancelled'],
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

    public function messages(): array
    {
        return [
            'user_id.exists'   => 'Người tạo phiếu không tồn tại.',

            // 'partner_id.exists'   => 'Khách hàng không tồn tại.',

            'voucher_date.date'     => 'Ngày lập phiếu không hợp lệ.',

            'status.in'       => 'Trạng thái không hợp lệ.',

            'amount.numeric'  => 'Số tiền phải là số.',
            'amount.min'      => 'Số tiền phải lớn hơn hoặc bằng 0.',

            'payment_method.in'       => 'Phương thức thanh toán không hợp lệ (cash hoặc bank).',

            'journal_entries.array'    => 'Bút toán không hợp lệ.',
            'journal_entries.min'      => 'Phiếu thu phải có ít nhất 2 dòng bút toán.',

            'journal_entries.*.account_code.required' => 'Mã tài khoản không được để trống.',
            'journal_entries.*.account_code.exists'   => 'Mã tài khoản không tồn tại.',

            'journal_entries.*.debit.required'  => 'Số tiền nợ không được để trống.',
            'journal_entries.*.credit.required' => 'Số tiền có không được để trống.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Chỉ validate khi status không phải cancelled
            if ($this->input('status') !== 'cancelled') {

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

                // Kiểm tra amount phải khớp với tổng debit (phiếu thu)
                if ($this->has('journal_entries') && $this->has('amount') && $this->amount) {
                    $totalDebit = collect($this->journal_entries)->sum('debit');

                    if (abs($totalDebit - $this->amount) > 0.01) {
                        $validator->errors()->add(
                            'amount',
                            'Số tiền phiếu thu phải bằng tổng Nợ của bút toán. (' .
                                number_format($this->amount) . ' ≠ ' . number_format($totalDebit) . ')'
                        );
                    }
                }
            }
        });
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Nếu status là 'cancel' thì chuẩn hóa thành 'cancelled'
        if ($this->input('status') === 'cancel') {
            $this->merge([
                'status' => 'cancelled'
            ]);
        }
    }
}