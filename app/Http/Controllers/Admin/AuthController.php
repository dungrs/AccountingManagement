<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Controller;
use App\Http\Requests\AuthRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function login(): Response|RedirectResponse
    {
        if (Auth::id() > 0) {
            return redirect()->route('admin.dashboard.index');
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('admin.password.request'),
            'status' => session('status'),
        ]);
    }
    /**
     * Handle an incoming authentication request.
     */

    public function store(AuthRequest $request): RedirectResponse
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            return redirect()
                ->route('admin.dashboard.index')
                ->with('success', 'Đăng nhập thành công!');
        }

        throw ValidationException::withMessages([
            'error' => 'Email hoặc mật khẩu không chính xác!',
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/admin');
    }
}
