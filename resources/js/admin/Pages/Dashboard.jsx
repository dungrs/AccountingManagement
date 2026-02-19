"use client";

import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Separator } from "@/admin/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/admin/components/ui/tabs";
import { Progress } from "@/admin/components/ui/progress";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/admin/components/ui/avatar";
import {
    Users,
    ShoppingCart,
    DollarSign,
    Package,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Eye,
    Calendar,
    BarChart3,
    PieChart,
    TrendingUp as TrendingUpIcon,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Sparkles,
    LayoutDashboard,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function Dashboard() {
    // Mock data
    const stats = [
        {
            title: "Tổng doanh thu",
            value: "₫45,231,890",
            change: "+20.1%",
            trend: "up",
            icon: DollarSign,
            gradient: "from-blue-500 to-blue-600",
            bg: "bg-blue-50",
            text: "text-blue-600",
        },
        {
            title: "Số đơn hàng",
            value: "2,350",
            change: "+180",
            trend: "up",
            icon: ShoppingCart,
            gradient: "from-purple-500 to-purple-600",
            bg: "bg-purple-50",
            text: "text-purple-600",
        },
        {
            title: "Khách hàng mới",
            value: "1,234",
            change: "+12.3%",
            trend: "up",
            icon: Users,
            gradient: "from-green-500 to-green-600",
            bg: "bg-green-50",
            text: "text-green-600",
        },
        {
            title: "Sản phẩm tồn kho",
            value: "123",
            change: "-5",
            trend: "down",
            icon: Package,
            gradient: "from-orange-500 to-orange-600",
            bg: "bg-orange-50",
            text: "text-orange-600",
        },
    ];

    const recentOrders = [
        {
            id: "ORD-001",
            customer: "Nguyễn Văn A",
            amount: "₫299,000",
            status: "completed",
            date: "2024-01-15",
        },
        {
            id: "ORD-002",
            customer: "Trần Thị B",
            amount: "₫149,000",
            status: "processing",
            date: "2024-01-14",
        },
        {
            id: "ORD-003",
            customer: "Lê Văn C",
            amount: "₫599,000",
            status: "pending",
            date: "2024-01-14",
        },
        {
            id: "ORD-004",
            customer: "Phạm Thị D",
            amount: "₫89,000",
            status: "completed",
            date: "2024-01-13",
        },
        {
            id: "ORD-005",
            customer: "Hoàng Văn E",
            amount: "₫449,000",
            status: "cancelled",
            date: "2024-01-13",
        },
    ];

    const topProducts = [
        {
            name: "Sản phẩm A",
            sales: 1234,
            revenue: "₫36,450,000",
            progress: 85,
        },
        {
            name: "Sản phẩm B",
            sales: 987,
            revenue: "₫24,675,000",
            progress: 65,
        },
        {
            name: "Sản phẩm C",
            sales: 856,
            revenue: "₫19,688,000",
            progress: 55,
        },
        {
            name: "Sản phẩm D",
            sales: 654,
            revenue: "₫15,042,000",
            progress: 42,
        },
    ];

    const activities = [
        {
            user: "Nguyễn Văn A",
            action: "đã đặt hàng",
            target: "Sản phẩm X",
            time: "5 phút trước",
            avatar: "NA",
            color: "bg-blue-500",
        },
        {
            user: "Trần Thị B",
            action: "đã đăng ký tài khoản mới",
            time: "15 phút trước",
            avatar: "TB",
            color: "bg-green-500",
        },
        {
            user: "Lê Văn C",
            action: "đã hủy đơn hàng",
            target: "ORD-003",
            time: "30 phút trước",
            avatar: "LC",
            color: "bg-red-500",
        },
        {
            user: "Phạm Thị D",
            action: "đã đánh giá sản phẩm",
            target: "Sản phẩm Y",
            time: "1 giờ trước",
            avatar: "PD",
            color: "bg-purple-500",
        },
    ];

    const getStatusBadge = (status) => {
        const variants = {
            completed: {
                bg: "bg-green-100",
                text: "text-green-700",
                border: "border-green-200",
                icon: CheckCircle2,
                label: "Hoàn thành",
            },
            processing: {
                bg: "bg-blue-100",
                text: "text-blue-700",
                border: "border-blue-200",
                icon: Clock,
                label: "Đang xử lý",
            },
            pending: {
                bg: "bg-yellow-100",
                text: "text-yellow-700",
                border: "border-yellow-200",
                icon: AlertCircle,
                label: "Chờ xử lý",
            },
            cancelled: {
                bg: "bg-red-100",
                text: "text-red-700",
                border: "border-red-200",
                icon: XCircle,
                label: "Đã hủy",
            },
        };
        return variants[status] || variants.pending;
    };

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                { label: "Bảng điều khiển" },
            ]}
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <LayoutDashboard className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">
                                    Bảng điều khiển
                                </h2>
                                <p className="text-white/80 mt-1 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Tổng quan về hoạt động kinh doanh của bạn
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white/20 text-white hover:bg-white/30 border-0"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Hôm nay
                            </Button>
                            <Button
                                size="sm"
                                className="bg-white text-blue-600 hover:bg-white/90 hover:text-blue-700"
                            >
                                Tải báo cáo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards với gradient */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        const TrendIcon =
                            stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
                        const trendColor =
                            stat.trend === "up"
                                ? "text-green-600"
                                : "text-red-600";

                        return (
                            <Card
                                key={index}
                                className="border-slate-200 shadow-lg overflow-hidden"
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-600">
                                        {stat.title}
                                    </CardTitle>
                                    <div
                                        className={`rounded-lg bg-gradient-to-r ${stat.gradient} p-2 text-white shadow-md`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {stat.value}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs mt-1">
                                        <span
                                            className={`flex items-center ${trendColor}`}
                                        >
                                            <TrendIcon className="mr-1 h-3 w-3" />
                                            {stat.change}
                                        </span>
                                        <span className="text-slate-400">
                                            so với tháng trước
                                        </span>
                                    </div>
                                    <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${stat.gradient}`}
                                            style={{
                                                width: `${Math.random() * 40 + 60}%`,
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts and Activities */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Revenue Chart */}
                    <Card className="col-span-4 border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Biểu đồ doanh thu
                                    </CardTitle>
                                    <CardDescription>
                                        Doanh thu theo tháng trong năm 2024
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Tabs defaultValue="week">
                                <div className="flex items-center justify-between">
                                    <TabsList className="bg-slate-100">
                                        <TabsTrigger
                                            value="week"
                                            className="data-[state=active]:bg-white"
                                        >
                                            Tuần
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="month"
                                            className="data-[state=active]:bg-white"
                                        >
                                            Tháng
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="year"
                                            className="data-[state=active]:bg-white"
                                        >
                                            Năm
                                        </TabsTrigger>
                                    </TabsList>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        Xem chi tiết
                                        <ArrowUpRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                <TabsContent value="week" className="mt-4">
                                    <div className="h-[200px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                        <div className="text-center">
                                            <BarChart3 className="h-10 w-10 text-blue-300 mx-auto mb-2" />
                                            <p className="text-slate-600">
                                                Biểu đồ doanh thu theo tuần
                                            </p>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Đang cập nhật dữ liệu...
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="month" className="mt-4">
                                    <div className="h-[200px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                        <div className="text-center">
                                            <BarChart3 className="h-10 w-10 text-blue-300 mx-auto mb-2" />
                                            <p className="text-slate-600">
                                                Biểu đồ doanh thu theo tháng
                                            </p>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Đang cập nhật dữ liệu...
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="year" className="mt-4">
                                    <div className="h-[200px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                        <div className="text-center">
                                            <BarChart3 className="h-10 w-10 text-blue-300 mx-auto mb-2" />
                                            <p className="text-slate-600">
                                                Biểu đồ doanh thu theo năm
                                            </p>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Đang cập nhật dữ liệu...
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <Card className="col-span-3 border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Hoạt động gần đây
                                    </CardTitle>
                                    <CardDescription>
                                        Các hoạt động mới nhất trong hệ thống
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {activities.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200"
                                    >
                                        <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-white ring-blue-200">
                                            <AvatarFallback
                                                className={`${activity.color} text-white`}
                                            >
                                                {activity.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm">
                                                <span className="font-semibold text-slate-800">
                                                    {activity.user}
                                                </span>{" "}
                                                <span className="text-slate-600">
                                                    {activity.action}
                                                </span>{" "}
                                                {activity.target && (
                                                    <span className="font-medium text-blue-600">
                                                        {activity.target}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {activity.time}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent" />
                            <Button
                                variant="outline"
                                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                                Xem tất cả hoạt động
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Orders and Top Products */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Orders */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                        <ShoppingCart className="h-4 w-4 text-white" />
                                    </div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Đơn hàng gần đây
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    Xem tất cả
                                    <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                {recentOrders.length} đơn hàng mới nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {recentOrders.map((order) => {
                                    const statusBadge = getStatusBadge(
                                        order.status,
                                    );
                                    const StatusIcon = statusBadge.icon;

                                    return (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {order.customer}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {order.id}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "flex items-center gap-1",
                                                        statusBadge.bg,
                                                        statusBadge.text,
                                                        statusBadge.border,
                                                    )}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusBadge.label}
                                                </Badge>
                                                <span className="font-semibold text-green-600">
                                                    {order.amount}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                        <TrendingUpIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Sản phẩm bán chạy
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                >
                                    Xem tất cả
                                    <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                Top sản phẩm có doanh số cao nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {topProducts.map((product, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">
                                                    {product.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                                                >
                                                    {product.sales} đã bán
                                                </Badge>
                                            </div>
                                            <span className="font-semibold text-green-600">
                                                {product.revenue}
                                            </span>
                                        </div>
                                        <Progress
                                            value={product.progress}
                                            className="h-2 bg-slate-100"
                                            indicatorClassName="bg-gradient-to-r from-purple-600 to-blue-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Stats với gradient */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-slate-200 shadow-lg overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">
                                Tỷ lệ chuyển đổi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">
                                24.5%
                            </div>
                            <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>+2.3% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-lg overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-800">
                                Giá trị đơn hàng TB
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-700">
                                ₫123,450
                            </div>
                            <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>+5.2% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-lg overflow-hidden bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">
                                Lượt truy cập
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">
                                12,345
                            </div>
                            <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>+8.1% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-lg overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">
                                Tỷ lệ thoát
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">
                                32.1%
                            </div>
                            <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
                                <TrendingDown className="h-3 w-3" />
                                <span>+1.2% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}