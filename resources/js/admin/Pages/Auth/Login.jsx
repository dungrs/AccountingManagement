import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Eye,
    EyeOff,
    Shield,
    BarChart3,
    Receipt,
    Wallet,
    BadgeDollarSign,
    ArrowRight,
    Lock,
    Mail,
    CheckCircle2,
    ShoppingCart,
    FileSpreadsheet,
    Store,
    UtensilsCrossed,
    Bike,
    Coffee,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { useEventBus } from "@/EventBus";

export default function Login() {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            email: "",
            password: "",
            remember: false,
        });

    const { flash } = usePage().props;
    const { emit } = useEventBus();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).join(", ");
            toast.error(errorMessages);
        }
    }, [errors]);

    const submit = (e) => {
        e.preventDefault();
        clearErrors();
        post(route("admin.login"), {
            onSuccess: () => emit("toast:success", "Đăng nhập thành công!"),
            onFinish: () => reset("password"),
        });
    };

    // Các khu vực kinh doanh chính của BC Mall
    const coreModules = [
        {
            icon: ShoppingCart,
            title: "BC Mart – Siêu thị tổng hợp",
            desc: "Quản lý hơn 20.000 sản phẩm: thực phẩm, gia dụng, mỹ phẩm, hàng mẹ & bé",
            badge: "Bán lẻ",
        },
        {
            icon: UtensilsCrossed,
            title: "Bee BBQ & BC Coffee",
            desc: "Quản lý doanh thu ẩm thực, đặt bàn, menu BBQ Hàn Quốc và đồ uống",
            badge: "Ẩm thực",
        },
        {
            icon: Bike,
            title: "BC Bike – Thể thao",
            desc: "Xe đạp, phụ kiện thể thao, dịch vụ bảo dưỡng xe chuyên nghiệp",
            badge: "Thể thao",
        },
        {
            icon: Receipt,
            title: "Kế toán & Báo cáo",
            desc: "Ghi nhận doanh thu đa khu vực, hóa đơn điện tử, báo cáo tài chính theo VAS",
            badge: "Kế toán",
        },
    ];

    // Thông tin thực tế BC Mall
    const stats = [
        { value: "20.000+", label: "Sản phẩm" },
        { value: "7", label: "Khu vực KD" },
        { value: "08–22h", label: "Hoạt động" },
        { value: "29/09/2025", label: "Khai trương" },
    ];

    // Badges tuân thủ
    const certBadges = [
        "Tuân thủ chuẩn kế toán VAS",
        "Hóa đơn điện tử theo TT78",
        "Phần mềm Bravo tích hợp",
    ];

    return (
        <>
            <Head title="Đăng nhập | BC Mall – Hệ thống quản lý kế toán bán hàng" />

            <div className="relative min-h-screen w-full overflow-hidden">
                {/* Background – ảnh siêu thị BC Mall */}
                <div className="fixed inset-0 -z-10">
                    <img
                        src="https://cafefcdn.com/thumb_w/640/203337114487263232/2025/9/28/photo1758947244041-1758947244726417053038-1759029432081578138638.jpg"
                        alt="BC Mall – Tổ hợp mua sắm giải trí Ninh Bình"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-800/90" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.1),transparent_50%)]" />
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 8px)`,
                        }}
                    />
                </div>

                {/* Floating Decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse" />
                    <div className="absolute top-40 right-[20%] opacity-5">
                        <FileSpreadsheet className="h-48 w-48 text-white" />
                    </div>
                    <div className="absolute bottom-40 left-[15%] opacity-5">
                        <BarChart3 className="h-48 w-48 text-white" />
                    </div>
                </div>

                {/* Main Layout */}
                <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-[1400px]">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* ─── LEFT: Brand + Features ─── */}
                            <div className="hidden lg:block text-white space-y-10">
                                {/* Logo + Brand Name */}
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-50" />
                                        <div className="relative bg-white p-3 rounded-2xl shadow-2xl">
                                            {/* Logo chính thức của BC Mall */}
                                            <img
                                                src="https://bcmall.vn/wp-content/uploads/2026/02/ft_logo_bcmall.png"
                                                alt="BC Mall Logo"
                                                className="h-12 w-auto object-contain"
                                                onError={(e) => {
                                                    // Fallback nếu logo không load được
                                                    e.target.style.display =
                                                        "none";
                                                    e.target.nextSibling.style.display =
                                                        "flex";
                                                }}
                                            />
                                            {/* Fallback icon */}
                                            <div
                                                className="h-12 w-12 items-center justify-center hidden"
                                                style={{ display: "none" }}
                                            >
                                                <Store className="h-8 w-8 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-tight">
                                            BC{" "}
                                            <span className="text-blue-400">
                                                Mall
                                            </span>
                                        </h1>
                                        <p className="text-white/50 text-sm mt-1 flex items-center gap-2">
                                            <BadgeDollarSign className="h-4 w-4 text-blue-400" />
                                            Hệ thống quản lý kế toán bán hàng
                                        </p>
                                    </div>
                                </div>

                                {/* Headline */}
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold leading-tight tracking-tight">
                                        Quản lý thông minh.
                                        <br />
                                        <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
                                            Bán hàng hiệu quả.
                                        </span>
                                    </h2>
                                    <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                                        Nền tảng quản lý tích hợp toàn bộ hoạt
                                        động kinh doanh của BC Mall — từ siêu
                                        thị BC Mart, ẩm thực Bee BBQ đến khu vui
                                        chơi và thời trang. Tự động hóa kế toán
                                        doanh thu, kiểm soát kho hàng, tuân thủ
                                        quy định thuế Việt Nam.
                                    </p>
                                </div>

                                {/* Compliance Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {certBadges.map((badge, i) => (
                                        <span
                                            key={i}
                                            className="flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/15 text-white/80 px-3 py-1.5 rounded-full"
                                        >
                                            <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                                            {badge}
                                        </span>
                                    ))}
                                </div>

                                {/* Module Cards – 7 khu vực BC Mall */}
                                <div className="grid grid-cols-2 gap-4">
                                    {coreModules.map((mod, i) => {
                                        const Icon = mod.icon;
                                        return (
                                            <div
                                                key={i}
                                                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-400 cursor-default"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 group-hover:from-blue-500 group-hover:to-purple-600 flex items-center justify-center transition-all duration-300 shrink-0">
                                                        <Icon className="h-5 w-5 text-blue-300 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold text-white text-sm">
                                                                {mod.title}
                                                            </p>
                                                            <span className="text-[10px] bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                                                                {mod.badge}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/50 leading-relaxed">
                                                            {mod.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Stats Row – thông tin thực BC Mall */}
                                <div className="grid grid-cols-4 gap-4 pt-2">
                                    {stats.map((s, i) => (
                                        <div key={i} className="text-center">
                                            <p className="text-2xl font-bold text-white">
                                                {s.value}
                                            </p>
                                            <p className="text-xs text-white/40 mt-0.5">
                                                {s.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ─── RIGHT: Login Card ─── */}
                            <div className="flex justify-end">
                                <Card className="w-full max-w-md border-0 backdrop-blur-xl shadow-2xl">
                                    <CardContent className="p-10">
                                        {/* Card Header – logo BC Mall */}
                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-white mb-5 shadow-lg shadow-blue-600/20 p-2">
                                                <img
                                                    src="https://bcmall.vn/wp-content/uploads/2026/02/ft_logo_bcmall.png"
                                                    alt="BC Mall"
                                                    className="h-full w-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                        e.target.nextSibling.style.display =
                                                            "flex";
                                                    }}
                                                />
                                                {/* Fallback */}
                                                <div
                                                    className="h-full w-full items-center justify-center hidden"
                                                    style={{ display: "none" }}
                                                >
                                                    <Store className="h-10 w-10 text-blue-600" />
                                                </div>
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                Đăng nhập hệ thống
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1.5">
                                                BC Mall – Quản lý kế toán &amp;
                                                bán hàng
                                            </p>
                                        </div>

                                        {/* Form */}
                                        <form
                                            onSubmit={submit}
                                            className="space-y-5"
                                        >
                                            {/* Email */}
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="email"
                                                    className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                                                >
                                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                    Email tài khoản
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="ketoan@bcmall.vn"
                                                    value={data.email}
                                                    onChange={(e) =>
                                                        setData(
                                                            "email",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${errors.email ? "border-red-500" : ""}`}
                                                />
                                                {errors.email && (
                                                    <p className="text-xs text-red-500">
                                                        {errors.email}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Password */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label
                                                        htmlFor="password"
                                                        className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                                                    >
                                                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                                                        Mật khẩu
                                                    </Label>
                                                    <Link
                                                        href="#"
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Quên mật khẩu?
                                                    </Link>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        placeholder="Nhập mật khẩu của bạn"
                                                        value={data.password}
                                                        onChange={(e) =>
                                                            setData(
                                                                "password",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10 ${errors.password ? "border-red-500" : ""}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPassword(
                                                                !showPassword,
                                                            )
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                {errors.password && (
                                                    <p className="text-xs text-red-500">
                                                        {errors.password}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remember */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="remember"
                                                        checked={data.remember}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setData(
                                                                "remember",
                                                                checked,
                                                            )
                                                        }
                                                        className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                    />
                                                    <Label
                                                        htmlFor="remember"
                                                        className="text-sm text-gray-600 cursor-pointer"
                                                    >
                                                        Duy trì đăng nhập
                                                    </Label>
                                                </div>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Shield className="h-3 w-3 text-green-500" />
                                                    Phiên bảo mật
                                                </span>
                                            </div>

                                            {/* Submit */}
                                            <Button
                                                type="submit"
                                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-600/20 transition-all duration-300 flex items-center justify-center gap-2"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        <span>
                                                            Đang xác thực...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>
                                                            Truy cập hệ thống
                                                        </span>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </form>

                                        {/* Thông tin liên hệ hỗ trợ */}
                                        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                                            <p className="text-xs text-gray-400">
                                                Cần hỗ trợ? Liên hệ{" "}
                                                <a
                                                    href="tel:0968579468"
                                                    className="text-blue-600 font-medium hover:underline"
                                                >
                                                    096 857 94 68
                                                </a>{" "}
                                                hoặc{" "}
                                                <a
                                                    href="mailto:lienhe@bcmall.vn"
                                                    className="text-blue-600 font-medium hover:underline"
                                                >
                                                    lienhe@bcmall.vn
                                                </a>
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-10 flex flex-col items-center gap-4">
                            <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-2 text-xs text-white/40">
                                <a
                                    href="https://bcmall.vn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white transition-colors"
                                >
                                    Website BC Mall
                                </a>
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Kế toán doanh thu
                                </Link>
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Quản lý bán hàng
                                </Link>
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Báo cáo tài chính
                                </Link>
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Hướng dẫn sử dụng
                                </Link>
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Chính sách bảo mật
                                </Link>
                                <a
                                    href="tel:0968579468"
                                    className="hover:text-white transition-colors"
                                >
                                    Liên hệ hỗ trợ
                                </a>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/25">
                                <span>
                                    © 2025 BC Mall – Công ty TNHH Phát triển
                                    Nhân lực Việt. All rights reserved.
                                </span>
                                <span>•</span>
                                <span>489C, Xã Xuân Trường, Ninh Bình</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "#fff",
                        color: "#1f2937",
                        border: "1px solid #e5e7eb",
                        fontSize: "14px",
                    },
                }}
            />
        </>
    );
}