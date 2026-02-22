import { usePage } from "@inertiajs/react";
import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link, router } from "@inertiajs/react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/admin/components/ui/sheet";

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
    UserCog,
    Shield,
    UserLock,
    Building2,
    TrendingUp,
    Briefcase,
    Menu,
    X,
    ChevronRight,
} from "lucide-react";

import { useEventBus } from "@/EventBus";
import { cn } from "@/admin/lib/utils";

export default function AdminLayout({ children, breadcrumb }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const { on } = useEventBus();
    const currentYear = new Date().getFullYear();
    const mainRef = useRef(null);

    // States
    const [breadcrumbVisible, setBreadcrumbVisible] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState([]);
    const lastScrollTop = useRef(0);

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

    // Scroll handler
    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;

        const handleScroll = () => {
            const scrollTop = el.scrollTop;

            if (scrollTop === 0) {
                setBreadcrumbVisible(true);
            } else if (scrollTop > lastScrollTop.current) {
                setBreadcrumbVisible(false);
            }

            lastScrollTop.current = scrollTop;
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    // Responsive: đóng mobile menu khi resize lên desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route("admin.logout"));
    };

    const toggleSubMenu = (title) => {
        setExpandedMenus((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [...prev, title],
        );
    };

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
                    title: "Nhóm Thuộc tính",
                    href: route("admin.attribute.catalogue.index"),
                    description: "Quản lý nhóm thuộc tính",
                    icon: Settings2,
                },
                {
                    title: "Thuộc tính",
                    href: route("admin.attribute.index"),
                    description: "Quản lý thuộc tính",
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
            title: "Nhân sự",
            icon: UserLock,
            items: [
                {
                    title: "Nhân viên",
                    href: route("admin.user.index"),
                    description: "Quản lý nhân viên",
                    icon: UserCog,
                },
                {
                    title: "Nhóm nhân viên",
                    href: route("admin.user.catalogue.index"),
                    description: "Quản lý nhóm nhân viên",
                    icon: Users,
                },
                {
                    title: "Phân quyền",
                    href: route("admin.permission.index"),
                    description: "Quản lý phân quyền",
                    icon: Shield,
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
                    href: route("admin.receipt.sales.index"),
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
                    href: route("admin.voucher.receipt.index"),
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
                    href: route("admin.book.cash.index"),
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
                    href: route("admin.debt.customer.index"),
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
                    href: route("admin.book.ledger.index"),
                    description: "Xem sổ cái",
                    icon: FileText,
                },
                {
                    title: "Báo cáo tài chính",
                    href: route("admin.report.business-result.index"),
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
                    href: route("admin.price.list.index"),
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

    const hasBreadcrumb = Array.isArray(breadcrumb) && breadcrumb.length > 0;

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-white">
            {/* HEADER */}
            <header className="header-premium flex-shrink-0">
                {/* Top bar */}
                <div className="flex h-16 items-center px-3 sm:px-4 md:px-6 gap-2 md:gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Logo */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative group hidden xs:block">
                            <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                            <div className="relative h-8 w-8 md:h-10 md:w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:border-white/30 transition-all duration-300">
                                <img
                                    src="https://laravel.com/img/logomark.min.svg"
                                    alt="Laravel"
                                    className="h-4 w-4 md:h-5 md:w-5 brightness-0 invert"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm md:text-lg leading-tight text-white truncate max-w-[120px] sm:max-w-[200px]">
                                Chào {getLastName(user.name)}!
                            </span>
                            <span className="hidden xs:block text-xs text-white/70 truncate max-w-[120px] sm:max-w-[200px]">
                                {user.user_catalogue.name}
                            </span>
                        </div>
                    </div>

                    {/* Search - hidden on mobile */}
                    <div className="hidden md:flex flex-1 max-w-md ml-4">
                        <div className="relative w-full group">
                            <Search className="absolute z-10 left-3 top-2.5 h-4 w-4 text-white/50 group-focus-within:text-white transition-colors" />
                            <input
                                placeholder="Tìm kiếm nhanh..."
                                className="w-full rounded-lg search-premium pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-1 md:gap-2 ml-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative hidden md:flex text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 icon-premium" />
                        </Button>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative text-white hover:bg-white/10 transition-all duration-300"
                                >
                                    <Bell className="h-4 w-4 md:h-5 md:w-5" />
                                    {notifications.length > 0 && (
                                        <Badge className="badge-gradient-premium absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-[10px] md:text-xs border-2 border-white">
                                            {notifications.length > 9
                                                ? "9+"
                                                : notifications.length}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="dropdown-premium-content w-72 sm:w-80"
                            >
                                <div className="flex items-center justify-between px-2 py-1">
                                    <DropdownMenuLabel className="text-slate-900 text-sm">
                                        Thông báo
                                    </DropdownMenuLabel>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto text-xs text-blue-600 hover:text-purple-600 transition-colors"
                                    >
                                        Đánh dấu tất cả
                                    </Button>
                                </div>
                                <DropdownMenuSeparator />
                                {notifications.map((notif) => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className="cursor-pointer p-2 md:p-3 dropdown-premium-item"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium text-slate-900 text-sm">
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {notif.description}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
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
                                    className="gap-1 md:gap-2 px-1 md:px-2 text-white hover:bg-white/10 transition-all duration-300"
                                >
                                    <Avatar className="avatar-premium h-6 w-6 md:h-8 md:w-8">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="avatar-fallback-premium text-xs md:text-sm">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-sm font-medium text-white">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-white/70 truncate max-w-[150px]">
                                            {user.email}
                                        </p>
                                    </div>
                                    <ChevronDown className="hidden lg:block h-3 w-3 md:h-4 md:w-4 text-white/70" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="dropdown-premium-content w-48 md:w-56"
                            >
                                <DropdownMenuLabel className="text-slate-900 text-sm">
                                    Tài khoản của tôi
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="dropdown-premium-item">
                                    <User className="mr-2 h-3 w-3 md:h-4 md:w-4 text-slate-500" />
                                    <span className="text-slate-700 text-sm">
                                        Hồ sơ
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="dropdown-premium-item">
                                    <Settings className="mr-2 h-3 w-3 md:h-4 md:w-4 text-slate-500" />
                                    <span className="text-slate-700 text-sm">
                                        Cài đặt
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <form onSubmit={handleLogout}>
                                    <button type="submit" className="w-full">
                                        <DropdownMenuItem
                                            className="text-red-600 hover:text-red-700 cursor-pointer hover:bg-red-50"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <LogOut className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                                            <span className="text-sm">
                                                Đăng xuất
                                            </span>
                                        </DropdownMenuItem>
                                    </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main Navigation - Desktop */}
                <div className="nav-premium relative z-40 hidden lg:block">
                    <div className="px-4 flex items-center h-9 overflow-x-auto scrollbar-hide">
                        {mainMenu.map((item) => (
                            <MainMenuItem key={item.title} item={item} />
                        ))}
                    </div>
                </div>

                {/* Breadcrumb */}
                {hasBreadcrumb && (
                    <div
                        className={cn(
                            "breadcrumb-premium px-3 sm:px-4 md:px-6 relative z-30 overflow-hidden transition-all duration-300 ease-in-out",
                            breadcrumbVisible
                                ? "max-h-12 py-2 opacity-100"
                                : "max-h-0 py-0 opacity-0 pointer-events-none",
                        )}
                    >
                        <Breadcrumb>
                            <BreadcrumbList className="flex-nowrap overflow-x-auto scrollbar-hide">
                                {breadcrumb.map((item, index) => {
                                    const isLast =
                                        index === breadcrumb.length - 1;
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center flex-shrink-0"
                                        >
                                            <BreadcrumbItem>
                                                {!isLast && item.link ? (
                                                    <BreadcrumbLink
                                                        href={item.link}
                                                        className="breadcrumb-link-premium text-xs sm:text-sm"
                                                    >
                                                        {item.label}
                                                    </BreadcrumbLink>
                                                ) : (
                                                    <BreadcrumbPage className="breadcrumb-active-premium text-xs sm:text-sm">
                                                        {item.label}
                                                    </BreadcrumbPage>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLast && (
                                                <BreadcrumbSeparator className="text-white/50 text-xs sm:text-sm">
                                                    /
                                                </BreadcrumbSeparator>
                                            )}
                                        </div>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                )}
            </header>

            {/* Mobile Menu Sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent
                    side="left"
                    className="w-[280px] sm:w-[320px] p-0 bg-white"
                >
                    <div className="flex flex-col h-full">
                        {/* Mobile Menu Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Items */}
                        <div className="flex-1 overflow-y-auto py-2">
                            {mainMenu.map((item) => (
                                <MobileMenuItem
                                    key={item.title}
                                    item={item}
                                    expandedMenus={expandedMenus}
                                    onToggle={toggleSubMenu}
                                    onClose={() => setMobileMenuOpen(false)}
                                />
                            ))}
                        </div>

                        {/* Mobile Menu Footer */}
                        <div className="p-4 border-t">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* MAIN CONTENT */}
            <main
                ref={mainRef}
                className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-white scrollbar-premium"
            >
                <div className="flex flex-col min-h-full">
                    <div className="flex-1 p-3 sm:p-4 md:p-6">{children}</div>

                    {/* FOOTER */}
                    <footer className="footer-premium w-full mt-auto">
                        <div className="border-t border-white/10 bg-gradient-to-r from-blue-700/50 to-purple-700/50 backdrop-blur-sm">
                            <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-white/70 fill-white/70" />
                                        <span className="text-white/70 text-center sm:text-left">
                                            © {currentYear} Enterprise Suite
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                                        <Link
                                            href="#"
                                            className="text-white/70 hover:text-white transition-colors text-xs sm:text-sm"
                                        >
                                            Privacy
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-white/70 hover:text-white transition-colors text-xs sm:text-sm"
                                        >
                                            Terms
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-white/70 hover:text-white transition-colors text-xs sm:text-sm"
                                        >
                                            Cookie
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>

            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: "#fff",
                        color: "#1e293b",
                        border: "1px solid #e2e8f0",
                        fontSize: "13px",
                        boxShadow:
                            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                    },
                    success: {
                        iconTheme: {
                            primary: "#3B82F6",
                            secondary: "#fff",
                        },
                    },
                }}
            />
        </div>
    );
}

// Desktop Menu Item
function MainMenuItem({ item }) {
    const [open, setOpen] = useState(false);

    if (!item.items) {
        return (
            <Link
                href={item.href}
                className="menu-item-premium flex items-center gap-1.5 px-3 h-full text-sm font-medium whitespace-nowrap"
            >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                <span>{item.title}</span>
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
                    "menu-item-premium flex items-center gap-1.5 px-3 h-full text-sm font-medium whitespace-nowrap",
                    open && "menu-item-active-premium",
                )}
            >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                <span>{item.title}</span>
                <ChevronDown
                    className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        open ? "rotate-180" : "",
                    )}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 z-[100] pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="submenu-premium grid grid-cols-1 sm:grid-cols-2 gap-1 w-[280px] sm:w-[480px] lg:w-[520px]">
                        {item.items.map((subItem) => (
                            <Link
                                key={subItem.title}
                                href={subItem.href}
                                className="submenu-item-premium flex items-start gap-3 rounded-lg p-2 sm:p-3 transition-all duration-200 group"
                            >
                                <span className="mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-200">
                                    {subItem.icon && (
                                        <subItem.icon className="h-4 w-4 text-blue-600" />
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs sm:text-sm font-medium text-slate-900 leading-none mb-1 group-hover:text-blue-600 transition-colors truncate">
                                        {subItem.title}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-slate-500 group-hover:text-slate-600 leading-snug line-clamp-2">
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

// Mobile Menu Item
function MobileMenuItem({ item, expandedMenus, onToggle, onClose }) {
    const isExpanded = expandedMenus.includes(item.title);

    if (!item.items) {
        return (
            <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
                {item.icon && <item.icon className="h-4 w-4 text-slate-500" />}
                <span>{item.title}</span>
            </Link>
        );
    }

    return (
        <div className="border-b last:border-b-0">
            <button
                onClick={() => onToggle(item.title)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {item.icon && (
                        <item.icon className="h-4 w-4 text-slate-500" />
                    )}
                    <span>{item.title}</span>
                </div>
                <ChevronRight
                    className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-200",
                        isExpanded && "rotate-90",
                    )}
                />
            </button>

            {isExpanded && (
                <div className="bg-slate-50 py-1">
                    {item.items.map((subItem) => (
                        <Link
                            key={subItem.title}
                            href={subItem.href}
                            onClick={onClose}
                            className="flex items-start gap-3 px-4 py-2 pl-11 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <span className="mt-0.5 shrink-0">
                                {subItem.icon && (
                                    <subItem.icon className="h-4 w-4 text-blue-600" />
                                )}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 truncate">
                                    {subItem.title}
                                </div>
                                <div className="text-xs text-slate-500 line-clamp-1">
                                    {subItem.description}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}