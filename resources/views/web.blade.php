<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark overflow-hidden h-screen">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <!-- Layout config Js -->
        <script src="{{ URL::to('assets/js/layout.js') }}"></script>
        <!-- StarCode CSS -->
        <link rel="stylesheet" href="{{ URL::to('assets/css/starcode2.css') }}">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Admin/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="">
        @inertia
        <script src="{{ URL::to('assets/libs/choices.js/public/assets/scripts/choices.min.js') }}"></script>
        <script src="{{ URL::to('assets/libs/%40popperjs/core/umd/popper.min.js') }}"></script>
        <script src="{{ URL::to('assets/libs/tippy.js/tippy-bundle.umd.min.js') }}"></script>
        <script src="{{ URL::to('assets/libs/simplebar/simplebar.min.js') }}"></script>
        <script src="{{ URL::to('assets/libs/prismjs/prism.js') }}"></script>
        <script src="{{ URL::to('assets/libs/lucide/umd/lucide.js') }}"></script>
        <script src="{{ URL::to('assets/js/starcode.bundle.js') }}"></script>
    </body>
</html>