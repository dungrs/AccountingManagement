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
    Users,
    ShoppingCart,
    DollarSign,
    Package,
    Activity,
    ArrowUpRight,
} from "lucide-react";

export default function Dashboard() {
    const stats = [
        { title: "Doanh thu tháng", value: "45.231.000 ₫", icon: DollarSign },
        { title: "Đơn hàng", value: "1.234", icon: ShoppingCart },
        { title: "Khách hàng", value: "2.350", icon: Users },
        { title: "Sản phẩm", value: "573", icon: Package },
    ];

    const recentOrders = [
        { id: "#ORD001", customer: "Nguyễn Văn A", amount: "1.250.000 ₫", status: "Hoàn thành" },
        { id: "#ORD002", customer: "Trần Thị B", amount: "850.000 ₫", status: "Đang xử lý" },
        { id: "#ORD003", customer: "Lê Văn C", amount: "2.100.000 ₫", status: "Chờ xác nhận" },
        { id: "#ORD004", customer: "Phạm Thị D", amount: "650.000 ₫", status: "Hoàn thành" },
    ];

    const notifications = [
        "Có 3 đơn hàng mới cần xử lý",
        "2 sản phẩm sắp hết hàng",
        "1 bảng giá sẽ hết hiệu lực trong 5 ngày",
    ];

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
                        <h1 className="text-3xl font-bold tracking-tight">
                            Bảng điều khiển
                        </h1>
                        <p className="text-muted-foreground">
                            Tổng quan hoạt động hệ thống
                        </p>
                    </div>

                    <Button variant="outline">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Xem báo cáo
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {item.title}
                                </CardTitle>
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {item.value}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cập nhật realtime
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid gap-4 lg:grid-cols-3">

                    {/* Recent Orders */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Đơn hàng gần đây</CardTitle>
                            <CardDescription>
                                Danh sách đơn hàng mới nhất
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {recentOrders.map((order, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                {order.customer}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.id}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-medium">
                                                {order.amount}
                                            </p>
                                            <Badge variant="secondary">
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {index !== recentOrders.length - 1 && (
                                        <Separator className="mt-4" />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông báo hệ thống</CardTitle>
                            <CardDescription>
                                Cảnh báo & nhắc nhở
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {notifications.map((note, index) => (
                                <div
                                    key={index}
                                    className="text-sm text-muted-foreground"
                                >
                                    • {note}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            Hoạt động hệ thống
                        </CardTitle>
                        <CardDescription>
                            Tình trạng vận hành hiện tại
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Người dùng online
                                </p>
                                <p className="text-2xl font-bold">234</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Đơn chờ xử lý
                                </p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Hóa đơn chưa thanh toán
                                </p>
                                <p className="text-2xl font-bold">8</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Bảng giá đang áp dụng
                                </p>
                                <p className="text-2xl font-bold">3</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}