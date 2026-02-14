<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;

class StoreUnitRequest extends FormRequest
{
    public function authorize()
    {
        return true; 
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255|unique:units,name',
            'code' => 'nullable|string|max:50|unique:units,code',
            'description' => 'nullable|string|max:500',
            'publish' => 'nullable|boolean',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Tên đơn vị tính là bắt buộc.',
            'name.unique' => 'Tên đơn vị tính đã tồn tại.',
            'code.unique' => 'Mã đơn vị đã tồn tại.',
        ];
    }
}