import ChatLayout from '@/admin/Layouts/ChatLayout';
import { Head } from '@inertiajs/react';

export default function Home() {
    return (
        <Head title="Messenger" />
    );
}

// Interia
Home.layout = (page) => <ChatLayout>{page}</ChatLayout>