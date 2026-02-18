import { usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/admin/components/ui/avatar";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/admin/components/ui/breadcrumb";

import {
    Bell,
    Search,
    Settings,
    LogOut,
    User,
    ChevronDown,
    Package,
    Users,
    PieChart,
    Home,
    Settings2,
    ShoppingCart,
    Truck,
    CreditCard,
    BarChart3,
    FileText,
    Wallet,
    Heart,
    Sparkles,
    Clock,
} from "lucide-react";

import { useEventBus } from "@/EventBus";
import { cn } from "@/admin/lib/utils";

export default function AdminLayout({ children, breadcrumb }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const { on } = useEventBus();
    const currentYear = new Date().getFullYear();
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Thông báo mới",
            description: "Có đơn hàng mới",
            time: "5 phút trước",
        },
        {
            id: 2,
            title: "Cập nhật hệ thống",
            description: "Bảo trì hệ thống lúc 23h",
            time: "1 giờ trước",
        },
        {
            id: 3,
            title: "Báo cáo tháng",
            description: "Báo cáo doanh thu tháng 2",
            time: "2 giờ trước",
        },
    ]);

    const getLastName = (fullName) => {
        if (!fullName) return "";
        const parts = fullName.trim().split(" ");
        return parts[parts.length - 1];
    };

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

    const mainMenu = [
        {
            title: "Tổng quan",
            href: route("admin.dashboard.index"),
            icon: Home,
        },
        {
            title: "Hàng hóa",
            icon: Package,
            items: [
                {
                    title: "Nhóm Sản Phẩm",
                    href: route("admin.product.catalogue.index"),
                    description: "Quản lý danh mục sản phẩm",
                    icon: Package,
                },
                {
                    title: "Sản phẩm",
                    href: route("admin.product.index"),
                    description: "Quản lý sản phẩm",
                    icon: ShoppingCart,
                },
                {
                    title: "Thuộc tính",
                    href: route("admin.attribute.index"),
                    description: "Quản lý thuộc tính sản phẩm",
                    icon: Settings2,
                },
                {
                    title: "Đơn vị tính",
                    href: route("admin.unit.index"),
                    description: "Quản lý đơn vị tính",
                    icon: BarChart3,
                },
            ],
        },
        {
            title: "Đối tác",
            icon: Users,
            items: [
                {
                    title: "Khách hàng",
                    href: route("admin.customer.index"),
                    description: "Quản lý khách hàng",
                    icon: User,
                },
                {
                    title: "Nhóm khách hàng",
                    href: route("admin.customer.catalogue.index"),
                    description: "Quản lý nhóm khách hàng",
                    icon: Users,
                },
                {
                    title: "Nhà cung cấp",
                    href: route("admin.supplier.index"),
                    description: "Quản lý nhà cung cấp",
                    icon: Truck,
                },
            ],
        },
        {
            title: "Kho hàng",
            icon: Package,
            items: [
                {
                    title: "Phiếu nhập kho",
                    href: route("admin.receipt.purchase.index"),
                    description: "Quản lý phiếu nhập",
                    icon: FileText,
                },
                {
                    title: "Phiếu xuất kho",
                    href: "#",
                    description: "Quản lý phiếu xuất",
                    icon: FileText,
                },
                {
                    title: "Kiểm kê kho",
                    href: route("admin.product.variant.index"),
                    description: "Kiểm kê hàng hóa",
                    icon: BarChart3,
                },
            ],
        },
        {
            title: "Thu chi - Quỹ",
            icon: Wallet,
            items: [
                {
                    title: "Phiếu thu",
                    href: "#",
                    description: "Quản lý phiếu thu",
                    icon: CreditCard,
                },
                {
                    title: "Phiếu chi",
                    href: route("admin.voucher.payment.index"),
                    description: "Quản lý phiếu chi",
                    icon: CreditCard,
                },
                {
                    title: "Sổ quỹ",
                    href: "#",
                    description: "Theo dõi sổ quỹ",
                    icon: Wallet,
                },
            ],
        },
        {
            title: "Công nợ",
            icon: CreditCard,
            items: [
                {
                    title: "Công nợ nhà cung cấp",
                    href: route("admin.debt.supplier.index"),
                    description: "Theo dõi công nợ NCC",
                    icon: Truck,
                },
                {
                    title: "Công nợ khách hàng",
                    href: "#",
                    description: "Theo dõi công nợ KH",
                    icon: User,
                },
            ],
        },
        {
            title: "Kế toán",
            icon: PieChart,
            items: [
                {
                    title: "Hệ thống tài khoản",
                    href: route("admin.accounting_account.index"),
                    description: "Quản lý tài khoản kế toán",
                    icon: Settings2,
                },
                {
                    title: "Sổ cái",
                    href: "#",
                    description: "Xem sổ cái",
                    icon: FileText,
                },
                {
                    title: "Báo cáo tài chính",
                    href: "#",
                    description: "Xem báo cáo tài chính",
                    icon: PieChart,
                },
            ],
        },
        {
            title: "Cài đặt",
            icon: Settings2,
            items: [
                {
                    title: "Cấu hình hệ thống",
                    href: route("admin.system.index"),
                    description: "Cấu hình chung",
                    icon: Settings,
                },
                {
                    title: "Ngân hàng",
                    href: route("admin.bank.index"),
                    description: "Quản lý ngân hàng",
                    icon: CreditCard,
                },
                {
                    title: "Thuế VAT",
                    href: route("admin.vattax.index"),
                    description: "Quản lý thuế",
                    icon: BarChart3,
                },
                {
                    title: "Bảng giá",
                    href: route("admin.price_list.index"),
                    description: "Quản lý bảng giá",
                    icon: Package,
                },
            ],
        },
    ];

    const getUserInitials = () => {
        if (user.name) {
            return user.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return "U";
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            {/* HEADER */}
            <header className="flex-shrink-0 border-b bg-background">
                {/* Top bar */}
                <div className="flex h-16 items-center px-6 gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        {/* ✅ Laravel logo từ CDN chính thức laravel.com */}
                        <div className="h-9 w-9 rounded-full bg-white border border-red-200 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                            <img
                                src="https://laravel.com/img/logomark.min.svg"
                                alt="Laravel"
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-lg leading-tight">
                                Chào {getLastName(user.name)}!
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {user.user_catalogue.name}
                            </span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="hidden md:flex flex-1 max-w-md ml-4">
                        <div className="relative w-full group">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                placeholder="Tìm kiếm nhanh..."
                                className="w-full rounded-md border border-input bg-background pl-8 pr-4 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                            />
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative hidden lg:flex"
                        >
                            <Sparkles className="h-5 w-5" />
                        </Button>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative"
                                >
                                    <Bell className="h-5 w-5" />
                                    {notifications.length > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                                        >
                                            {notifications.length}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <div className="flex items-center justify-between px-2 py-1">
                                    <DropdownMenuLabel>
                                        Thông báo
                                    </DropdownMenuLabel>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto text-xs"
                                    >
                                        Đánh dấu tất cả
                                    </Button>
                                </div>
                                <DropdownMenuSeparator />
                                {notifications.map((notif) => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className="cursor-pointer p-3"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium">
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {notif.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {notif.time}
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="gap-2 px-2 hover:bg-accent/50"
                                >
                                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 hidden lg:block text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    Tài khoản của tôi
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Hồ sơ</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Cài đặt</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="border-t bg-card/50">
                    <div className="px-4 flex items-center h-11">
                        {mainMenu.map((item) => (
                            <MainMenuItem key={item.title} item={item} />
                        ))}
                    </div>
                </div>

                {/* Breadcrumb */}
                {Array.isArray(breadcrumb) && breadcrumb.length > 0 && (
                    <div className="border-t bg-muted/30 px-6 py-2">
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
                                                        className="hover:text-primary"
                                                    >
                                                        {item.label}
                                                    </BreadcrumbLink>
                                                ) : (
                                                    <BreadcrumbPage className="font-medium text-foreground">
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
                    </div>
                )}
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto bg-background">
                <div className="min-h-full">
                    <div className="p-6">{children}</div>

                    {/* FOOTER */}
                    <footer className="bg-card mt-auto">
                        <div className="border-t bg-muted/30">
                            <div className="px-6 py-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                                        <span>
                                            © {currentYear} Admin Panel. All
                                            rights reserved.
                                        </span>
                                    </div>
                                    <div className="flex gap-6">
                                        <Link
                                            href="#"
                                            className="hover:text-primary transition-colors"
                                        >
                                            Privacy Policy
                                        </Link>
                                        <Link
                                            href="#"
                                            className="hover:text-primary transition-colors"
                                        >
                                            Terms of Service
                                        </Link>
                                        <Link
                                            href="#"
                                            className="hover:text-primary transition-colors"
                                        >
                                            Cookie Policy
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>

            <Toaster position="top-right" reverseOrder={false} />
        </div>
    );
}

// Custom MainMenuItem - hover dropdown với position absolute
function MainMenuItem({ item }) {
    const [open, setOpen] = useState(false);

    if (!item.items) {
        return (
            <Link
                href={item.href}
                className="flex items-center gap-1.5 px-3 h-full text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
            >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                {item.title}
            </Link>
        );
    }

    return (
        <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                className={cn(
                    "flex items-center gap-1.5 px-3 h-full text-sm font-medium rounded-md transition-colors",
                    open
                        ? "bg-accent/50 text-foreground"
                        : "text-foreground/80 hover:text-foreground hover:bg-accent/50",
                )}
            >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                {item.title}
                <ChevronDown
                    className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                        open && "rotate-180",
                    )}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 z-50 pt-1">
                    <div className="rounded-lg border bg-popover shadow-lg p-3 grid grid-cols-2 gap-1 w-[480px]">
                        {item.items.map((subItem) => (
                            <Link
                                key={subItem.title}
                                href={subItem.href}
                                className="flex items-start gap-3 rounded-md p-3 hover:bg-accent hover:text-accent-foreground transition-colors group"
                            >
                                <span className="mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                                    {subItem.icon && (
                                        <subItem.icon className="h-4 w-4 text-primary" />
                                    )}
                                </span>
                                <div>
                                    <div className="text-sm font-medium leading-none mb-1">
                                        {subItem.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80 leading-snug">
                                        {subItem.description}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}