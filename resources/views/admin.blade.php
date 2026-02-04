<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark overflow-hidden h-screen">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        @routes
        @viteReactRefresh
        @vite(['resources/js/Admin/admin.jsx', "resources/js/Admin/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="light font-sans">
        @inertia
    </body>
</html>