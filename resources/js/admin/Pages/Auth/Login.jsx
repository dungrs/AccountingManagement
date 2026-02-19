import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Eye,
    EyeOff,
    Chrome,
    Github,
    Shield,
    TrendingUp,
    BarChart3,
    Receipt,
    Wallet,
    PieChart,
    BadgeDollarSign,
    ClipboardList,
    ArrowRight,
    Lock,
    Mail,
    CheckCircle2,
    Building2,
    ShoppingCart,
    FileSpreadsheet,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { Separator } from "@/admin/components/ui/separator";
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

    const handleGoogleLogin = () => {
        toast.loading("Đang chuyển hướng đến Google...");
    };

    const handleGithubLogin = () => {
        toast.loading("Đang chuyển hướng đến GitHub...");
    };

    const coreModules = [
        {
            icon: Receipt,
            title: "Kế toán & Sổ cái",
            desc: "Hạch toán tự động, cân đối tài khoản, báo cáo BCTC theo chuẩn VAS/IFRS",
            badge: "Kế toán",
        },
        {
            icon: ShoppingCart,
            title: "Bán hàng & Hóa đơn",
            desc: "Quản lý đơn hàng, xuất hóa đơn điện tử, theo dõi công nợ khách hàng",
            badge: "Bán hàng",
        },
        {
            icon: BarChart3,
            title: "Báo cáo tài chính",
            desc: "P&L, Bảng cân đối kế toán, Lưu chuyển tiền tệ – cập nhật theo thời gian thực",
            badge: "Báo cáo",
        },
        {
            icon: Wallet,
            title: "Quản lý thu chi",
            desc: "Kiểm soát ngân sách, dự báo dòng tiền, đối chiếu ngân hàng tự động",
            badge: "Tài chính",
        },
    ];

    const stats = [
        { value: "98.6%", label: "Độ chính xác" },
        { value: "5,200+", label: "Doanh nghiệp" },
        { value: "₫1.2T+", label: "Doanh thu xử lý" },
        { value: "24/7", label: "Hỗ trợ kỹ thuật" },
    ];

    const certBadges = [
        "Tuân thủ chuẩn kế toán VAS",
        "Hóa đơn điện tử theo TT78",
        "Kết nối cổng thuế VNPT",
    ];

    return (
        <>
            <Head title="Đăng nhập | AccSales Pro – Kế toán & Bán hàng" />

            <div className="relative min-h-screen w-full overflow-hidden">
                {/* Background */}
                <div className="fixed inset-0 -z-10">
                    <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&auto=format&fit=crop&q=100"
                        alt="Corporate Office"
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
                                        <div className="relative bg-gradient-to-br from-white to-gray-100 p-5 rounded-2xl shadow-2xl">
                                            <img
                                                src="https://laravel.com/img/logomark.min.svg"
                                                alt="Logo"
                                                className="h-10 w-auto"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-tight">
                                            AccSales{" "}
                                            <span className="text-blue-400">
                                                Pro
                                            </span>
                                        </h1>
                                        <p className="text-white/50 text-sm mt-1 flex items-center gap-2">
                                            <BadgeDollarSign className="h-4 w-4 text-blue-400" />
                                            Phần mềm kế toán – bán hàng doanh
                                            nghiệp
                                        </p>
                                    </div>
                                </div>

                                {/* Headline */}
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold leading-tight tracking-tight">
                                        Kế toán thông minh.
                                        <br />
                                        <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
                                            Bán hàng hiệu quả.
                                        </span>
                                    </h2>
                                    <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                                        Nền tảng tích hợp kế toán – bán hàng –
                                        tài chính toàn diện. Tự động hóa quy
                                        trình, giảm sai sót, tuân thủ đầy đủ quy
                                        định thuế Việt Nam.
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

                                {/* Module Cards */}
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

                                {/* Stats Row */}
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
                                        {/* Card Header */}
                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-5 shadow-lg shadow-blue-600/20">
                                                <img
                                                    src="https://laravel.com/img/logomark.min.svg"
                                                    alt="Logo"
                                                    className="h-10 w-auto brightness-0 invert"
                                                />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                Đăng nhập hệ thống
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1.5">
                                                Phần mềm kế toán &amp; quản lý
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
                                                    placeholder="ketoan@congty.com"
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

                                            {/* Divider */}
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <Separator className="bg-gray-200" />
                                                </div>
                                                <div className="relative flex justify-center text-xs">
                                                    <span className="bg-white px-3 text-gray-400">
                                                        Hoặc tiếp tục với
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Social Login */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                                    onClick={handleGoogleLogin}
                                                >
                                                    <Chrome className="h-5 w-5 mr-2 text-[#DB4437]" />
                                                    Google
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                                    onClick={handleGithubLogin}
                                                >
                                                    <Github className="h-5 w-5 mr-2" />
                                                    GitHub
                                                </Button>
                                            </div>
                                        </form>

                                        {/* Register */}
                                        <p className="text-center text-sm text-gray-500 mt-6">
                                            Chưa có tài khoản doanh nghiệp?{" "}
                                            <Link
                                                href="#"
                                                className="text-blue-600 font-medium hover:underline"
                                            >
                                                Đăng ký dùng thử miễn phí
                                            </Link>
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-10 flex flex-col items-center gap-4">
                            <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-2 text-xs text-white/40">
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Giới thiệu
                                </Link>
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Tính năng kế toán
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
                                    Bảng giá
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
                                <Link
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Liên hệ hỗ trợ
                                </Link>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/25">
                                <span>
                                    © 2025 AccSales Pro. All rights reserved.
                                </span>
                                <span>•</span>
                                <span>Phiên bản 3.5.2</span>
                                <span>•</span>
                                <span>Cập nhật: 15/02/2025</span>
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