import AdminLayout from "@/admin/layouts/AdminLayout";

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
            <h1 className="text-xl font-semibold">
                Chào mừng bạn đến Admin
            </h1>
        </AdminLayout>
    );
}