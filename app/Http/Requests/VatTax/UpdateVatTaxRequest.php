<?php

namespace App\Http\Requests\VatTax;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateVatTaxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'id' => 'required|exists:vat_taxes,id',

            'code' => 'required|string|max:10|unique:vat_taxes,code,' . $this->id,
            'name' => 'required|string|max:150',
            'rate' => 'required|numeric|min:0|max:100',
            'direction' => 'required|in:input,output',
            'description' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'id.required' => 'Không tìm thấy ID thuế VAT.',
            'id.exists' => 'Thuế VAT không tồn tại.',

            'code.required' => 'Mã thuế VAT không được để trống.',
            'code.max' => 'Mã thuế VAT tối đa 10 ký tự.',
            'code.unique' => 'Mã thuế VAT đã tồn tại.',

            'name.required' => 'Tên thuế VAT không được để trống.',
            'name.max' => 'Tên thuế VAT tối đa 150 ký tự.',

            'rate.required' => 'Thuế suất VAT không được để trống.',
            'rate.numeric' => 'Thuế suất VAT phải là số.',
            'rate.min' => 'Thuế suất VAT không được nhỏ hơn 0%.',
            'rate.max' => 'Thuế suất VAT không được lớn hơn 100%.',

            'direction.required' => 'Vui lòng chọn loại thuế VAT.',
            'direction.in' => 'Loại thuế VAT không hợp lệ.',
        ];
    }
}