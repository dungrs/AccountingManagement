<?php

namespace App\Http\Middleware;

use Closure;
use Inertia\Inertia;
use Illuminate\Http\Request;

class InertiaRootView
{
    public function handle(Request $request, Closure $next)
    {
        if (
            $request->route()?->getName() === 'admin'
            || str_starts_with($request->route()?->getName(), 'admin.')
        ) {
            Inertia::setRootView('admin');
        } else {
            Inertia::setRootView('web');
        }

        return $next($request);
    }
}