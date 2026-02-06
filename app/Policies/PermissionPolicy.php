<?php

namespace App\Policies;

use App\Models\User;

class PermissionPolicy
{
    /**
     * Kiểm tra quyền truy cập module
     */
    public function modules(User $user, string $permissionName): bool
    {
        if (!$user || $user->publish == 0) {
            return false;
        }

        return $user->user_catalogues->permissions
            ->contains('canonical', $permissionName);
    }
}