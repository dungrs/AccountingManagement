import { EventBusProvider } from '@/EventBus';
import '../bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';


const appName = import.meta.env.VITE_APP_NAME || 'Admin';

createInertiaApp({
    title: title => `${title} | ${appName}`,
    resolve: name =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <EventBusProvider>
                <App {...props} />
            </EventBusProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});