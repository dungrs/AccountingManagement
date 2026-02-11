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
    Settings2,
    Frame,
    PieChart,
    Map,
    GalleryVerticalEnd,
    Users,
    Package,
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

        // ===================== HỆ THỐNG =====================
        {
            title: "Hệ Thống",
            icon: Settings2,
            items: [
                {
                    title: "Nhóm Thành Viên",
                    url: route("admin.user.catalogue.index"),
                },
                {
                    title: "Thành Viên",
                    url: route("admin.user.index"),
                },
                {
                    title: "Quyền",
                    url: route("admin.permission.index"),
                },
                {
                    title: "Cấu Hình Hệ Thống",
                    url: route("admin.dashboard.index"),
                },
            ],
        },

        // ===================== HÀNG HÓA =====================
        {
            title: "Hàng Hóa",
            icon: Package,
            items: [
                {
                    title: "Nhóm Sản Phẩm",
                    url: route("admin.product.catalogue.index"),
                },
                {
                    title: "Sản Phẩm",
                    url: route("admin.product.index"),
                },
                {
                    title: "Loại Thuộc Tính",
                    url: route("admin.attribute.catalogue.index"),
                },
                {
                    title: "Thuộc Tính",
                    url: route("admin.attribute.index"),
                },
            ],
        },

        // ===================== ĐỐI TÁC =====================
        {
            title: "Đối Tác",
            icon: Users,
            items: [
                {
                    title: "Khách Hàng",
                    url: route("admin.customer.index"),
                },
                {
                    title: "Nhóm Khách Hàng",
                    url: route("admin.customer.catalogue.index"),
                },
                {
                    title: "Nhà Cung Cấp",
                    url: route("admin.dashboard.index"),
                },
            ],
        },

        // ===================== KHO HÀNG =====================
        {
            title: "Kho Hàng",
            icon: Package,
            items: [
                {
                    title: "Phiếu Nhập Kho",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Phiếu Xuất Kho",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Kiểm Kê Kho",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Báo Cáo Tồn Kho",
                    url: route("admin.dashboard.index"),
                },
            ],
        },

        // ===================== THU CHI - QUỸ =====================
        {
            title: "Thu Chi - Quỹ",
            icon: SquareTerminal,
            items: [
                {
                    title: "Phiếu Thu",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Phiếu Chi",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Sổ Quỹ",
                    url: route("admin.dashboard.index"),
                },
            ],
        },

        // ===================== CÔNG NỢ =====================
        {
            title: "Công Nợ",
            icon: SquareTerminal,
            items: [
                {
                    title: "Công Nợ Phải Thu",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Công Nợ Phải Trả",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Báo Cáo Công Nợ",
                    url: route("admin.dashboard.index"),
                },
            ],
        },

        // ===================== KẾ TOÁN =====================
        {
            title: "Kế Toán",
            icon: PieChart,
            items: [
                {
                    title: "Hệ Thống Tài Khoản",
                    url: route("admin.accounting_account.index"),
                },
                {
                    title: "Sổ Cái",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Báo Cáo Tài Chính",
                    url: route("admin.dashboard.index"),
                },
            ],
        },

        // ===================== CÀI ĐẶT =====================
        {
            title: "Cài Đặt",
            icon: Settings2,
            items: [
                {
                    title: "Thông Tin Công Ty",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Ngân Hàng",
                    url: route("admin.bank.index"),
                },
                {
                    title: "Thuế VAT",
                    url: route("admin.vattax.index"),
                },
                {
                    title: "Bảng Giá",
                    url: route("admin.dashboard.index"),
                },
            ],
        },
    ];

    const projects = [];

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

                    {Array.isArray(breadcrumb) && breadcrumb.length > 0 && (
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumb.map((item, index) => {
                                    const isLast =
                                        index === breadcrumb.length - 1;

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center"
                                        >
                                            <BreadcrumbItem>
                                                {!isLast && item.link ? (
                                                    <BreadcrumbLink
                                                        href={item.link}
                                                    >
                                                        {item.label}
                                                    </BreadcrumbLink>
                                                ) : (
                                                    <BreadcrumbPage>
                                                        {item.label}
                                                    </BreadcrumbPage>
                                                )}
                                            </BreadcrumbItem>

                                            {!isLast && <BreadcrumbSeparator />}
                                        </div>
                                    );
                                })}
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
