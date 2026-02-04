<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct()
    {
        // throw new \Exception('Not implemented');
    }
    
    public function index() {
        return Inertia::render('Dashboard/Home');
    }

    // public function login(Request $request)
    // {
    //     if (Auth::attempt($request->only('email', 'password'))) {

    //         if (! auth()->user()->is_admin) {
    //             Auth::logout();
    //             return redirect('/admin')->withErrors([
    //                 'email' => 'Bạn không có quyền admin'
    //             ]);
    //         }

    //         return redirect()->route('dashboard.index');
    //     }

    //     return back()->withErrors([
    //         'email' => 'Sai tài khoản hoặc mật khẩu'
    //     ]);
    // }
}
