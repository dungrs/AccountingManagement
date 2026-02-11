<?php

namespace App\Enums;

enum NormalBalanceEnum: string
{
    case DEBIT  = 'DEBIT';   // Dư Nợ
    case CREDIT = 'CREDIT';  // Dư Có

    /**
     * Nhãn hiển thị
     */
    public function label(): string
    {
        return match ($this) {
            self::DEBIT  => 'Dư Nợ',
            self::CREDIT => 'Dư Có',
        };
    }

    /**
     * Dùng cho select option (nếu cần)
     */
    public static function options(): array
    {
        return array_map(
            fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ],
            self::cases()
        );
    }
}
