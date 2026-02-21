"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/admin/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import { TrendingUp, BarChart3 } from "lucide-react";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatCompactCurrency = (amount) => {
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1) + " tỷ";
    }
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + " tr";
    }
    if (amount >= 1000) {
        return (amount / 1000).toFixed(1) + " k";
    }
    return amount.toString();
};

export default function RevenueChart({ data = [], year }) {
    const [timeRange, setTimeRange] = React.useState("12m");

    const totalRevenue = data.reduce(
        (sum, item) => sum + (item.revenue || 0),
        0,
    );

    // Cấu hình màu sắc cho biểu đồ
    const chartConfig = {
        revenue: {
            label: "Doanh thu",
            color: "hsl(var(--chart-1))",
        },
        trend: {
            label: "Xu hướng",
            color: "hsl(var(--chart-2))",
        },
    };

    // Format dữ liệu cho biểu đồ
    const chartData = data.map((item) => ({
        month: item.month_name,
        revenue: item.revenue || 0,
        fullMonth: `Tháng ${item.month}`,
    }));

    // Lọc dữ liệu theo khoảng thời gian
    const filteredData = React.useMemo(() => {
        if (timeRange === "12m") return chartData;
        if (timeRange === "6m") return chartData.slice(-6);
        if (timeRange === "3m") return chartData.slice(-3);
        return chartData;
    }, [chartData, timeRange]);

    return (
        <Card className="shadow-lg border-slate-200 overflow-hidden pt-0">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 py-5">
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">
                            Doanh thu theo tháng
                        </CardTitle>
                        <CardDescription>
                            Biểu đồ doanh thu năm {year}
                        </CardDescription>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                        Tổng: {formatCurrency(totalRevenue)}
                    </Badge>

                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="w-[130px] rounded-lg border-slate-200"
                            aria-label="Chọn khoảng thời gian"
                        >
                            <SelectValue placeholder="12 tháng" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                            <SelectItem value="12m" className="rounded-md">
                                12 tháng
                            </SelectItem>
                            <SelectItem value="6m" className="rounded-md">
                                6 tháng
                            </SelectItem>
                            <SelectItem value="3m" className="rounded-md">
                                3 tháng
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="px-2 pt-6 sm:px-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[350px] w-full"
                >
                    <AreaChart
                        data={filteredData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="fillRevenue"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#3B82F6"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#3B82F6"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillTrend"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#8B5CF6"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#8B5CF6"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            vertical={false}
                            stroke="#E2E8F0"
                            strokeDasharray="3 3"
                        />

                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                            stroke="#64748B"
                            fontSize={12}
                        />

                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => formatCurrency(value)}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.fullMonth;
                                        }
                                        return label;
                                    }}
                                    indicator="line"
                                    className="bg-white border-slate-200 shadow-lg"
                                />
                            }
                        />

                        <Area
                            dataKey="revenue"
                            name="Doanh thu"
                            type="monotone"
                            fill="url(#fillRevenue)"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            stackId="1"
                        />

                        <ChartLegend
                            content={
                                <ChartLegendContent className="flex justify-center gap-6 mt-4" />
                            }
                        />
                    </AreaChart>
                </ChartContainer>

                {/* Thống kê nhanh */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">
                            Trung bình tháng
                        </p>
                        <p className="text-sm font-semibold text-blue-600">
                            {formatCurrency(
                                totalRevenue / (filteredData.length || 1),
                            )}
                        </p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">
                            Tháng cao nhất
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(
                                Math.max(
                                    ...filteredData.map((d) => d.revenue),
                                    0,
                                ),
                            )}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">
                            Tháng thấp nhất
                        </p>
                        <p className="text-sm font-semibold text-amber-600">
                            {formatCurrency(
                                Math.min(
                                    ...filteredData
                                        .filter((d) => d.revenue > 0)
                                        .map((d) => d.revenue),
                                    0,
                                ),
                            )}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}