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
    Download,
    Filter,
    RefreshCw,
    Calendar,
    BarChart3,
    TrendingUp,
    Loader2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Head } from "@inertiajs/react";

import { formatCurrency } from "@/admin/utils/helpers";
import BusinessResultTable from "@/admin/components/pages/report/BusinessResultTable";

export default function BusinessResultHome({ initialFilters }) {
    const [data, setData] = useState({});
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
            const res = await axios.post(
                route("admin.report.business-result.data"),
                params,
            );

            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            toast.error("Không thể tải dữ liệu báo cáo!");
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

    const handleExport = () => {
        toast.success("Đang xuất báo cáo...");
        // Implement export
    };

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                { label: "Báo cáo KQKD" },
            ]}
        >
            <Head title="Báo cáo Kết quả Kinh doanh" />

            <Card className="rounded-md shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-6 w-6" />
                                Báo cáo Kết quả Hoạt động Kinh doanh
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Tháng {month} năm {year}
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <Select
                                value={month.toString()}
                                onValueChange={(v) => setMonth(parseInt(v))}
                            >
                                <SelectTrigger className="w-[100px] bg-white/20 text-white border-white/30">
                                    <SelectValue placeholder="Tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem
                                            key={m}
                                            value={m.toString()}
                                        >
                                            Tháng {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={year.toString()}
                                onValueChange={(v) => setYear(parseInt(v))}
                            >
                                <SelectTrigger className="w-[100px] bg-white/20 text-white border-white/30">
                                    <SelectValue placeholder="Năm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem
                                            key={y}
                                            value={y.toString()}
                                        >
                                            Năm {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleRefresh}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={handleExport}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <BusinessResultTable data={data} loading={loading} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}