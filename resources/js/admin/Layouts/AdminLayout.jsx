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
                    // url: route("admin.product.index"),
                },
                {
                    title: "Loại Thuộc Tính",
                    url: route("admin.attribute.catalogue.index"),
                },
                {
                    title: "Thuộc Tính",
                    url: route("admin.attribute.index"),
                },
                {
                    title: "Đơn Vị Tính",
                    url: route("admin.dashboard.index"),
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
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Nhà Cung Cấp",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Nhóm Khách Hàng",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Nhóm Nhà Cung Cấp",
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

        // ===================== NHÂN SỰ =====================
        {
            title: "Nhân Sự",
            icon: Users,
            items: [
                {
                    title: "Danh Sách Nhân Viên",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Phòng Ban",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Chức Vụ",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Bảng Lương",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Chấm Công",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Tạm Ứng",
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
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Định Khoản",
                    url: route("admin.dashboard.index"),
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
                    title: "Loại Tiền Tệ",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Tỷ Giá",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Thuế VAT",
                    url: route("admin.dashboard.index"),
                },
                {
                    title: "Bảng Giá",
                    url: route("admin.dashboard.index"),
                },
            ],
        },
    ];

    const projects = [
   
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
