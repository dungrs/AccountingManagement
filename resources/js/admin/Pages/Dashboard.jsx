"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import { RefreshCw, Home } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import DashboardStats from "@/admin/components/pages/dashboard/DashboardStats";
import RevenueChart from "@/admin/components/pages/dashboard/RevenueChart";
import CashFlowCard from "@/admin/components/pages/dashboard/CashFlowCard";
import DebtCard from "@/admin/components/pages/dashboard/DebtCard";
import TopProducts from "@/admin/components/pages/dashboard/TopProducts";
import InventoryAlert from "@/admin/components/pages/dashboard/InventoryAlert";
import RecentActivities from "@/admin/components/pages/dashboard/RecentActivities";

export default function DashboardIndex({ initialFilters }) {
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        month: initialFilters?.month || new Date().getMonth() + 1,
        year: initialFilters?.year || new Date().getFullYear(),
    });
    const [dashboardData, setDashboardData] = useState({
        summary: {
            monthly_revenue: 0,
            yearly_revenue: 0,
            monthly_purchase: 0,
            gross_profit: 0,
            total_customers: 0,
            total_suppliers: 0,
            total_products: 0,
            inventory_value: 0,
            revenue_growth: 0,
            profit_margin: 0,
        },
        monthly_revenue: [],
        top_products: [],
        debts: {
            receivable: 0,
            payable: 0,
            net_debt: 0,
            top_debtors: [],
            top_creditors: [],
        },
        inventory: {
            total_value: 0,
            total_items: 0,
            low_stock: [],
            out_of_stock: 0,
        },
        recent_activities: [],
        cash_flow: {
            cash_in: 0,
            cash_out: 0,
            net_cash: 0,
            balance: 0,
        },
        period: {
            current_month: filters.month,
            current_year: filters.year,
            month_name: "",
        },
    });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                route("admin.dashboard.data"),
                filters,
            );
            if (response.data.success) {
                setDashboardData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Không thể tải dữ liệu dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [filters]);

    const handleRefresh = () => {
        fetchDashboardData();
        toast.success("Đã làm mới dữ liệu");
    };

    const handleMonthChange = (value) => {
        setFilters({ ...filters, month: parseInt(value) });
    };

    const handleYearChange = (value) => {
        setFilters({ ...filters, year: parseInt(value) });
    };

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
            ]}
        >
            <Head title="Dashboard - Tổng quan" />

            {/* Header Gradient - Thu gọn */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-lg mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                            <Home className="h-6 w-6" />
                            Dashboard
                        </h1>
                        <p className="text-white/80">
                            Tổng quan hoạt động kinh doanh
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                            <Select
                                value={filters.month.toString()}
                                onValueChange={handleMonthChange}
                            >
                                <SelectTrigger className="w-[100px] bg-white/20 text-white border-0 focus:ring-0">
                                    <SelectValue placeholder="Tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from(
                                        { length: 12 },
                                        (_, i) => i + 1,
                                    ).map((month) => (
                                        <SelectItem
                                            key={month}
                                            value={month.toString()}
                                        >
                                            Tháng {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.year.toString()}
                                onValueChange={handleYearChange}
                            >
                                <SelectTrigger className="w-[90px] bg-white/20 text-white border-0 focus:ring-0">
                                    <SelectValue placeholder="Năm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from(
                                        { length: 5 },
                                        (_, i) => new Date().getFullYear() - i,
                                    ).map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleRefresh}
                            variant="secondary"
                            className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 border-r-purple-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                        Đang tải dữ liệu...
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Stats Cards - 4 cột trên desktop, 2 cột trên mobile */}
                    <DashboardStats
                        summary={dashboardData.summary}
                        filters={filters}
                    />

                    {/* 2 cột: Biểu đồ (2/3) và CashFlow + Debt (1/3) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Biểu đồ doanh thu - chiếm 2/3 */}
                        <div className="lg:col-span-2">
                            <RevenueChart
                                data={dashboardData.monthly_revenue}
                                year={filters.year}
                            />
                        </div>

                        {/* CashFlow và Debt - xếp dọc, chiếm 1/3 */}
                        <div className="space-y-4">
                            <CashFlowCard cashFlow={dashboardData.cash_flow} />
                            <DebtCard debts={dashboardData.debts} />
                        </div>
                    </div>

                    {/* 2 cột: Top sản phẩm và Tồn kho */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <TopProducts
                            products={dashboardData.top_products}
                            filters={filters}
                        />
                        <InventoryAlert inventory={dashboardData.inventory} />
                    </div>

                    {/* Hoạt động gần đây - full width */}
                    <RecentActivities
                        activities={dashboardData.recent_activities}
                    />
                </div>
            )}
        </AdminLayout>
    );
}
