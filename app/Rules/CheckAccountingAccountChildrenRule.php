<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\AccountingAccount;

class CheckAccountingAccountChildrenRule implements ValidationRule
{
    protected int|string $id;

    public function __construct($id)
    {
        $this->id = $id;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Nếu danh mục còn danh mục con thì không cho xoá
        if (!AccountingAccount::isNodeCheck($this->id)) {
            $fail('Không thể xoá danh mục này vì vẫn còn danh mục con.');
        }
    }
}