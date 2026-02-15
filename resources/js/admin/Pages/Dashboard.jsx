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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Progress } from "@/admin/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/admin/components/ui/avatar";
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
} from "lucide-react";

export default function Dashboard() {
    // Mock data
    const stats = [
        {
            title: "Tổng doanh thu",
            value: "$45,231.89",
            change: "+20.1%",
            trend: "up",
            icon: DollarSign,
            color: "bg-green-500",
        },
        {
            title: "Số đơn hàng",
            value: "2,350",
            change: "+180",
            trend: "up",
            icon: ShoppingCart,
            color: "bg-blue-500",
        },
        {
            title: "Khách hàng mới",
            value: "1,234",
            change: "+12.3%",
            trend: "up",
            icon: Users,
            color: "bg-purple-500",
        },
        {
            title: "Sản phẩm tồn kho",
            value: "123",
            change: "-5",
            trend: "down",
            icon: Package,
            color: "bg-orange-500",
        },
    ];

    const recentOrders = [
        {
            id: "ORD-001",
            customer: "Nguyễn Văn A",
            amount: "$299.00",
            status: "completed",
            date: "2024-01-15",
        },
        {
            id: "ORD-002",
            customer: "Trần Thị B",
            amount: "$149.00",
            status: "processing",
            date: "2024-01-14",
        },
        {
            id: "ORD-003",
            customer: "Lê Văn C",
            amount: "$599.00",
            status: "pending",
            date: "2024-01-14",
        },
        {
            id: "ORD-004",
            customer: "Phạm Thị D",
            amount: "$89.00",
            status: "completed",
            date: "2024-01-13",
        },
        {
            id: "ORD-005",
            customer: "Hoàng Văn E",
            amount: "$449.00",
            status: "cancelled",
            date: "2024-01-13",
        },
    ];

    const topProducts = [
        { name: "Sản phẩm A", sales: 1234, revenue: "$36,450", progress: 85 },
        { name: "Sản phẩm B", sales: 987, revenue: "$24,675", progress: 65 },
        { name: "Sản phẩm C", sales: 856, revenue: "$19,688", progress: 55 },
        { name: "Sản phẩm D", sales: 654, revenue: "$15,042", progress: 42 },
    ];

    const activities = [
        {
            user: "Nguyễn Văn A",
            action: "đã đặt hàng",
            target: "Sản phẩm X",
            time: "5 phút trước",
            avatar: "NA",
        },
        {
            user: "Trần Thị B",
            action: "đã đăng ký tài khoản mới",
            time: "15 phút trước",
            avatar: "TB",
        },
        {
            user: "Lê Văn C",
            action: "đã hủy đơn hàng",
            target: "ORD-003",
            time: "30 phút trước",
            avatar: "LC",
        },
        {
            user: "Phạm Thị D",
            action: "đã đánh giá sản phẩm",
            target: "Sản phẩm Y",
            time: "1 giờ trước",
            avatar: "PD",
        },
    ];

    const getStatusBadge = (status) => {
        const variants = {
            completed: "bg-green-100 text-green-800 border-green-200",
            processing: "bg-blue-100 text-blue-800 border-blue-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
        };
        return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStatusText = (status) => {
        const texts = {
            completed: "Hoàn thành",
            processing: "Đang xử lý",
            pending: "Chờ xử lý",
            cancelled: "Đã hủy",
        };
        return texts[status] || status;
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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h2>
                        <p className="text-muted-foreground">
                            Tổng quan về hoạt động kinh doanh của bạn
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Hôm nay
                        </Button>
                        <Button size="sm">
                            Tải báo cáo
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
                        const trendColor = stat.trend === "up" ? "text-green-600" : "text-red-600";
                        
                        return (
                            <Card key={index}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`rounded-lg ${stat.color} p-2 text-white`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`flex items-center ${trendColor}`}>
                                            <TrendIcon className="mr-1 h-3 w-3" />
                                            {stat.change}
                                        </span>
                                        <span className="text-muted-foreground">
                                            so với tháng trước
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts and Tables */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Revenue Chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Biểu đồ doanh thu</CardTitle>
                            <CardDescription>
                                Doanh thu theo tháng trong năm 2024
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="week">
                                <div className="flex items-center justify-between">
                                    <TabsList>
                                        <TabsTrigger value="week">Tuần</TabsTrigger>
                                        <TabsTrigger value="month">Tháng</TabsTrigger>
                                        <TabsTrigger value="year">Năm</TabsTrigger>
                                    </TabsList>
                                    <Button variant="ghost" size="sm">
                                        Xem chi tiết
                                        <ArrowUpRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                <TabsContent value="week" className="mt-4">
                                    <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                                        <p className="text-muted-foreground">
                                            Biểu đồ doanh thu theo tuần
                                        </p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="month" className="mt-4">
                                    <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                                        <p className="text-muted-foreground">
                                            Biểu đồ doanh thu theo tháng
                                        </p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="year" className="mt-4">
                                    <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                                        <p className="text-muted-foreground">
                                            Biểu đồ doanh thu theo năm
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Hoạt động gần đây</CardTitle>
                            <CardDescription>
                                Các hoạt động mới nhất trong hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activities.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>{activity.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm">
                                                <span className="font-medium">{activity.user}</span>{" "}
                                                {activity.action}{" "}
                                                {activity.target && (
                                                    <span className="font-medium">
                                                        {activity.target}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.time}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <Button variant="outline" className="w-full">
                                Xem tất cả hoạt động
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Orders and Top Products */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Orders */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Đơn hàng gần đây</CardTitle>
                                <Button variant="ghost" size="sm">
                                    Xem tất cả
                                    <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                {recentOrders.length} đơn hàng mới nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {order.customer}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.id}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge
                                                variant="outline"
                                                className={getStatusBadge(order.status)}
                                            >
                                                {getStatusText(order.status)}
                                            </Badge>
                                            <span className="font-medium">{order.amount}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Sản phẩm bán chạy</CardTitle>
                                <Button variant="ghost" size="sm">
                                    Xem tất cả
                                    <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                Top sản phẩm có doanh số cao nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topProducts.map((product, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{product.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {product.sales} đã bán
                                                </Badge>
                                            </div>
                                            <span className="font-medium">{product.revenue}</span>
                                        </div>
                                        <Progress value={product.progress} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tỷ lệ chuyển đổi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24.5%</div>
                            <div className="flex items-center gap-2 text-xs text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>+2.3% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Giá trị đơn hàng TB
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">$123.45</div>
                            <div className="flex items-center gap-2 text-xs text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>+5.2% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Lượt truy cập
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12,345</div>
                            <div className="flex items-center gap-2 text-xs text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>+8.1% so với tháng trước</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tỷ lệ thoát
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">32.1%</div>
                            <div className="flex items-center gap-2 text-xs text-red-600">
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