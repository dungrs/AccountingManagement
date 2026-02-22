import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/admin/admin.jsx',
                // 'resources/js/web/web.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            // '@': path.resolve(__dirname, 'resources/js'),
            '@Admin': path.resolve(__dirname, 'resources/js/admin'),
        },
    },
});