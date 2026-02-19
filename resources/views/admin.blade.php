<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark overflow-hidden h-screen">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Permissions-Policy" content="unload=()">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @routes
        @viteReactRefresh
        @vite([
            'resources/js/Admin/admin.jsx',
            "resources/js/Admin/Pages/{$page['component']}.jsx"
        ])

        <!-- ✅ CKFinder -->
        <script src="/backend/libs/ckfinder/ckfinder.js"></script>
        <script src="/backend/libs/%40ckeditor/ckeditor5-build-classic/build/ckeditor.js"></script>

        @inertiaHead
    </head>
    <body class="premium font-sans antialiased">
        @inertia
    </body>
</html>