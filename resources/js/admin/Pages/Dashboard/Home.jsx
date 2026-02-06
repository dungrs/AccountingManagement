import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head } from "@inertiajs/react";

export default function Dashboard() {
    return (
        <AdminLayout
            breadcrumb={{
                parent: {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                current: "Overview",
            }}
        >   
            <Head title="Trang thống kê" />
            <h1 className="text-xl font-semibold">
                Chào mừng bạn đến Admin
            </h1>
        </AdminLayout>
    );
}