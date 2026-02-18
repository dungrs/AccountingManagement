<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'admin';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Nếu user đã đăng nhập, lấy thêm thông tin user_catalogue
        if ($user) {
            // Load relationship user_catalogue
            $user->load('user_catalogues');
            
            // Hoặc nếu bạn muốn format lại dữ liệu
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'is_admin' => $user->is_admin,
                'publish' => $user->publish,
                'user_catalogue' => $user->user_catalogues ? [
                    'id' => $user->user_catalogues->id,
                    'name' => $user->user_catalogues->name,
                    'description' => $user->user_catalogues->description,
                    'publish' => $user->user_catalogues->publish,
                ] : null,
            ];
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? $userData : null,
            ],

            'flash' => [
                'success' => fn() => $request->session()->pull('success'),
                'error'   => fn() => $request->session()->pull('error'),
            ],
        ]);
    }
}