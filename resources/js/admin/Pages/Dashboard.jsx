"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    RefreshCw,
    DollarSign,
    TrendingUp,
    ShoppingBag,
    Users,
    Package,
    Truck,
    CreditCard,
    Wallet,
    BarChart3,
    PieChart,
    Activity,
    AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Head } from "@inertiajs/react";
import { formatCurrency } from "../utils/helpers";
import SummaryCard from "../components/pages/dashboard/SummaryCard";
import RevenueChart from "../components/pages/dashboard/RevenueChart";
import TopProductsTable from "../components/pages/dashboard/TopProductsTable";
import RecentActivities from "../components/pages/dashboard/RecentActivities";
import LowStockAlert from "../components/pages/dashboard/LowStockAlert";
import { cn } from "@/admin/lib/utils";

export default function DashboardIndex({ initialFilters }) {
    const [data, setData] = useState({
        summary: {},
        monthly_revenue: [],
        top_products: [],
        debts: {},
        inventory: {},
        recent_activities: [],
        cash_flow: {},
        period: {
            current_month: new Date().getMonth() + 1,
            current_year: new Date().getFullYear(),
        },
    });
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(initialFilters.month);
    const [year, setYear] = useState(initialFilters.year);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - 2 + i,
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { month, year };
            const res = await axios.post(route("admin.dashboard.data"), params);

            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu dashboard:", error);
            toast.error("Không thể tải dữ liệu dashboard!");
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
        toast.success("Đã làm mới dữ liệu");
    };

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Dashboard
                        </h1>
                        <p className="text-sm text-slate-500">
                            Tổng quan hoạt động kinh doanh tháng {month}/{year}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={month.toString()}
                            onValueChange={(v) => setMonth(parseInt(v))}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Tháng" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m} value={m.toString()}>
                                        Tháng {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={year.toString()}
                            onValueChange={(v) => setYear(parseInt(v))}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Năm" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        Năm {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="icon"
                            disabled={loading}
                        >
                            <RefreshCw
                                className={cn(
                                    "h-4 w-4",
                                    loading && "animate-spin",
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Doanh thu tháng"
                        value={formatCurrency(
                            data.summary?.monthly_revenue || 0,
                        )}
                        icon={DollarSign}
                        trend={data.summary?.revenue_growth > 0 ? "up" : "down"}
                        trendValue={`${data.summary?.revenue_growth}% so với tháng trước`}
                        color="blue"
                    />

                    <SummaryCard
                        title="Lợi nhuận gộp"
                        value={formatCurrency(data.summary?.gross_profit || 0)}
                        icon={TrendingUp}
                        trend="up"
                        trendValue={`Tỉ suất ${data.summary?.profit_margin}%`}
                        color="green"
                    />

                    <SummaryCard
                        title="Công nợ phải thu"
                        value={formatCurrency(data.debts?.receivable || 0)}
                        icon={CreditCard}
                        color="indigo"
                    />

                    <SummaryCard
                        title="Công nợ phải trả"
                        value={formatCurrency(data.debts?.payable || 0)}
                        icon={Truck}
                        color="red"
                    />
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Biểu đồ doanh thu */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Doanh thu theo tháng
                            </CardTitle>
                            <CardDescription>
                                Biến động doanh thu trong năm {year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart data={data.monthly_revenue} />
                        </CardContent>
                    </Card>

                    {/* Top sản phẩm */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                Top sản phẩm bán chạy
                            </CardTitle>
                            <CardDescription>
                                Tháng {month}/{year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopProductsTable products={data.top_products} />
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Hoạt động gần đây */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Activity className="h-5 w-5 text-purple-600" />
                                Hoạt động gần đây
                            </CardTitle>
                            <CardDescription>
                                Các giao dịch mới nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentActivities
                                activities={data.recent_activities}
                            />
                        </CardContent>
                    </Card>

                    {/* Cảnh báo tồn kho */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                                Cảnh báo tồn kho
                            </CardTitle>
                            <CardDescription>
                                Sản phẩm sắp hết hàng
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LowStockAlert
                                products={data.inventory?.low_stock || []}
                            />

                            {data.inventory?.out_of_stock > 0 && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                                    <p className="text-sm font-medium text-red-700">
                                        Có {data.inventory.out_of_stock} sản
                                        phẩm đã hết hàng
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
