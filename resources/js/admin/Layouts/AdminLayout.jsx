import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/admin/components/ui/sidebar";
import { Separator } from "@/admin/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/admin/components/ui/breadcrumb";

import { AppSidebar } from "@/admin/components/app-sidebar";

// icon
import {
    SquareTerminal,
    Bot,
    Settings2,
    Frame,
    PieChart,
    Map,
    GalleryVerticalEnd,
    Users,
} from "lucide-react";
import { useEventBus } from "@/EventBus";

export default function AdminLayout({ children, breadcrumb }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const { on } = useEventBus();

    // Hiển thị flash messages
    useEffect(() => {
        const offSuccess = on("toast:success", (message) => {
            toast.success(message);
        });

        const offError = on("toast:error", (message) => {
            toast.error(message);
        });

        return () => {
            offSuccess();
            offError();
        };
    }, []);

    const teams = [
        {
            name: "Admin Panel",
            logo: GalleryVerticalEnd,
            plan: "Internal",
        },
    ];

    const navMain = [
        {
            title: "Dashboard",
            url: route("admin.dashboard.index"),
            icon: SquareTerminal,
        },
        {
            title: "Quản Lý Thành Viên",
            icon: Users,
            items: [
                {
                    title: "QL Nhóm Thành Viên",
                    url: route("admin.user.catalogue.index"),
                },
                {
                    title: "QL Thành Viên",
                    url: route("admin.user.index"),
                },
                {
                    title: "QL Quyền",
                    url: route("admin.permission.index"),
                },
            ],
        },
        {
            title: "Settings",
            icon: Settings2,
            items: [
                {
                    title: "Profile",
                    url: route("admin.dashboard.index"),
                },
            ],
        },
    ];

    const projects = [
        {
            name: "Sales",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Marketing",
            url: "#",
            icon: Frame,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ];

    return (
        <SidebarProvider>
            <AppSidebar
                user={user}
                teams={teams}
                navMain={navMain}
                projects={projects}
            />

            {/* Full chiều cao màn hình */}
            <SidebarInset className="h-screen overflow-hidden">
                {/* HEADER */}
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />

                    {breadcrumb && (
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumb.parent && (
                                    <>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink
                                                href={breadcrumb.parent.link}
                                            >
                                                {breadcrumb.parent.label}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                    </>
                                )}
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {breadcrumb.current}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    )}
                </header>

                {/* CONTENT - CHỈ PHẦN NÀY SCROLL */}
                <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </SidebarInset>

            <Toaster position="top-right" reverseOrder={false} />
        </SidebarProvider>
    );
}