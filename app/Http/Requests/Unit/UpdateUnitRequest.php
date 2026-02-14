<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUnitRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $unitId = $this->route('unit');
        // Nếu route dạng: Route::put('/units/{unit}', ...)

        return [
            'name' => 'required|string|max:255|unique:units,name,' . $this->id,
            'code' => 'nullable|string|max:50|unique:units,code,' . $this->id,
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
