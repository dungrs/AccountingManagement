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
        return Inertia::render('Dashboard');
    }
}
