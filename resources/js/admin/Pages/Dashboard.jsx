import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { 
    Users, 
    ShoppingCart, 
    DollarSign, 
    TrendingUp,
    Package,
    Activity
} from "lucide-react";

export default function Dashboard() {
    // Dữ liệu mẫu
    const stats = [
        {
            title: "Tổng doanh thu",
            value: "45,231,000 ₫",
            change: "+20.1%",
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100"
        },
        {
            title: "Người dùng",
            value: "2,350",
            change: "+15.3%",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
        },
        {
            title: "Đơn hàng",
            value: "1,234",
            change: "+12.5%",
            icon: ShoppingCart,
            color: "text-purple-600",
            bgColor: "bg-purple-100"
        },
        {
            title: "Sản phẩm",
            value: "573",
            change: "+8.2%",
            icon: Package,
            color: "text-orange-600",
            bgColor: "bg-orange-100"
        }
    ];

    const recentOrders = [
        { id: "#ORD001", customer: "Nguyễn Văn A", amount: "1,250,000 ₫", status: "Hoàn thành" },
        { id: "#ORD002", customer: "Trần Thị B", amount: "850,000 ₫", status: "Đang xử lý" },
        { id: "#ORD003", customer: "Lê Văn C", amount: "2,100,000 ₫", status: "Hoàn thành" },
        { id: "#ORD004", customer: "Phạm Thị D", amount: "650,000 ₫", status: "Chờ xác nhận" },
        { id: "#ORD005", customer: "Hoàng Văn E", amount: "1,800,000 ₫", status: "Hoàn thành" }
    ];

    const topProducts = [
        { name: "Áo thun nam", sold: 156, revenue: "15,600,000 ₫" },
        { name: "Quần jean nữ", sold: 142, revenue: "21,300,000 ₫" },
        { name: "Giày sneaker", sold: 128, revenue: "19,200,000 ₫" },
        { name: "Túi xách", sold: 95, revenue: "14,250,000 ₫" },
        { name: "Đồng hồ", sold: 87, revenue: "26,100,000 ₫" }
    ];

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Bảng điều khiển",
                },
            ]}
        >   
            <Head title="Trang thống kê" />
            
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Bảng điều khiển
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Tổng quan về hoạt động kinh doanh của bạn
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600">{stat.change}</span>
                                    <span>so với tháng trước</span>
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts & Tables Row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Orders */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Đơn hàng gần đây</CardTitle>
                            <CardDescription>
                                Có {recentOrders.length} đơn hàng mới trong tuần này
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.map((order, index) => (
                                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {order.customer}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.id}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-sm font-medium">
                                                {order.amount}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                order.status === "Hoàn thành" 
                                                    ? "bg-green-100 text-green-700"
                                                    : order.status === "Đang xử lý"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Sản phẩm bán chạy</CardTitle>
                            <CardDescription>
                                Top 5 sản phẩm trong tháng này
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {product.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {product.sold} đã bán
                                            </p>
                                        </div>
                                        <div className="text-sm font-medium">
                                            {product.revenue}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Hoạt động hệ thống
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Người dùng trực tuyến
                                </p>
                                <p className="text-2xl font-bold">234</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Đơn hàng chờ xử lý
                                </p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Sản phẩm sắp hết hàng
                                </p>
                                <p className="text-2xl font-bold">8</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}