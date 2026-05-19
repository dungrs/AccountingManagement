<?php

namespace App\Http\Requests\Note;

use Illuminate\Foundation\Http\FormRequest;

class StoreCreditNoteRequest extends FormRequest
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
            'issue_date'       => ['required', 'date'],
            'status'           => ['required', 'in:draft,confirmed'],
            'reason'           => ['required', 'string', 'max:500'],
            'note'             => ['nullable', 'string', 'max:1000'],
            'code'             => ['nullable', 'string', 'max:50', 'unique:credit_notes,code'],

            'customer_id'      => ['nullable', 'exists:customers,id'],
            'supplier_id'      => ['nullable', 'exists:suppliers,id'],

            'amount'           => ['required', 'numeric', 'min:0'],
            'vat_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'type'             => ['required', 'in:sales_return,discount,price_adjustment,refund,prepayment,other'],
            'reference_type'   => ['nullable', 'string', 'max:50'],
            'reference_id'     => ['nullable', 'integer'],
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
            'user_id.required' => 'Người tạo không được để trống.',
            'user_id.exists'   => 'Người tạo không tồn tại.',

            'issue_date.required' => 'Ngày lập chứng từ không được để trống.',
            'issue_date.date'     => 'Ngày lập chứng từ không hợp lệ.',

            'status.required' => 'Trạng thái không được để trống.',
            'status.in'       => 'Trạng thái không hợp lệ.',

            'reason.required' => 'Lý do không được để trống.',
            'reason.string'   => 'Lý do phải là chuỗi.',
            'reason.max'      => 'Lý do không được vượt quá 500 ký tự.',

            'amount.required' => 'Số tiền không được để trống.',
            'amount.numeric'  => 'Số tiền phải là số.',
            'amount.min'      => 'Số tiền phải lớn hơn hoặc bằng 0.',

            'vat_rate.numeric' => 'Thuế suất VAT phải là số.',
            'vat_rate.min'     => 'Thuế suất VAT không được nhỏ hơn 0.',
            'vat_rate.max'     => 'Thuế suất VAT không được lớn hơn 100.',

            'type.required' => 'Loại chứng từ không được để trống.',
            'type.in'       => 'Loại chứng từ không hợp lệ.',

            'customer_id.exists' => 'Khách hàng không tồn tại.',
            'supplier_id.exists' => 'Nhà cung cấp không tồn tại.',

            'journal_entries.required' => 'Giấy báo có phải có bút toán.',
            'journal_entries.array'    => 'Bút toán không hợp lệ.',
            'journal_entries.min'      => 'Giấy báo có phải có ít nhất 2 dòng bút toán.',

            'journal_entries.*.account_code.required' => 'Mã tài khoản không được để trống.',
            'journal_entries.*.account_code.exists'   => 'Mã tài khoản không tồn tại.',

            'journal_entries.*.debit.required'  => 'Số tiền nợ không được để trống.',
            'journal_entries.*.credit.required' => 'Số tiền có không được để trống.',

            'code.unique' => 'Mã giấy báo có đã tồn tại trong hệ thống.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Kiểm tra phải có ít nhất một đối tượng
            if (!$this->customer_id && !$this->supplier_id) {
                $validator->errors()->add(
                    'customer_id',
                    'Phải chọn ít nhất một đối tượng (khách hàng hoặc nhà cung cấp).'
                );
            }

            // Không được chọn cả hai
            if ($this->customer_id && $this->supplier_id) {
                $validator->errors()->add(
                    'customer_id',
                    'Chỉ được chọn một đối tượng (khách hàng hoặc nhà cung cấp).'
                );
            }

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
        });
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Tính toán VAT amount và total amount
        if ($this->amount && $this->vat_rate) {
            $vatAmount = $this->amount * ($this->vat_rate / 100);
            $totalAmount = $this->amount + $vatAmount;
            
            $this->merge([
                'vat_amount' => $vatAmount,
                'total_amount' => $totalAmount,
            ]);
        } elseif ($this->amount) {
            $this->merge([
                'vat_amount' => 0,
                'total_amount' => $this->amount,
            ]);
        }
    }
}