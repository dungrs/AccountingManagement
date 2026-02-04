<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __construct()
    {
        // throw new \Exception('Not implemented');
    }

    public function home() {
        return inertia('Home');
    }
}
