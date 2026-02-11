<?php

namespace App\Enums;

enum AccountTypeEnum: string
{
    case ASSET     = 'ASSET';      // Tài sản
    case LIABILITY = 'LIABILITY';  // Nợ phải trả
    case EQUITY    = 'EQUITY';     // Vốn chủ sở hữu
    case REVENUE   = 'REVENUE';    // Doanh thu
    case EXPENSE   = 'EXPENSE';    // Chi phí
    case OTHER     = 'OTHER';      // Khác

    /**
     * Nhãn hiển thị cho người dùng
     */
    public function label(): string
    {
        return match ($this) {
            self::ASSET     => 'Tài sản',
            self::LIABILITY => 'Nợ phải trả',
            self::EQUITY    => 'Vốn chủ sở hữu',
            self::REVENUE   => 'Doanh thu',
            self::EXPENSE   => 'Chi phí',
            self::OTHER     => 'Khác',
        };
    }

    /**
     * Tính chất số dư mặc định theo nghiệp vụ kế toán
     */
    public function normalBalance(): NormalBalanceEnum
    {
        return match ($this) {
            self::ASSET,
            self::EXPENSE => NormalBalanceEnum::DEBIT,

            self::LIABILITY,
            self::EQUITY,
            self::REVENUE,
            self::OTHER => NormalBalanceEnum::CREDIT,
        };
    }

    /**
     * Dùng cho select option
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