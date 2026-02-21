"use client";

import { Card, CardContent } from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

export default function DashboardStats({ summary, filters }) {
    const stats = [
        {
            title: `Doanh thu T${filters.month}`,
            value: formatCurrency(summary.monthly_revenue),
            growth: summary.revenue_growth,
            icon: DollarSign,
            color: "blue",
            bgColor: "bg-blue-100",
            textColor: "text-blue-600",
        },
        {
            title: "Lợi nhuận",
            value: formatCurrency(summary.gross_profit),
            subText: `${summary.profit_margin}%`,
            icon: TrendingUp,
            color: "purple",
            bgColor: "bg-purple-100",
            textColor: "text-purple-600",
        },
        {
            title: "Chi phí mua",
            value: formatCurrency(summary.monthly_purchase),
            subText: `${((summary.monthly_purchase / summary.monthly_revenue) * 100 || 0).toFixed(1)}%`,
            icon: ShoppingCart,
            color: "green",
            bgColor: "bg-green-100",
            textColor: "text-green-600",
        },
        {
            title: "Tồn kho",
            value: formatCurrency(summary.inventory_value),
            subText: `${summary.total_products} SP`,
            icon: Package,
            color: "amber",
            bgColor: "bg-amber-100",
            textColor: "text-amber-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className={`border-l-4 border-l-${stat.color}-500 shadow-sm`}
                >
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">
                                    {stat.title}
                                </p>
                                <p
                                    className={`text-base font-bold ${stat.textColor}`}
                                >
                                    {stat.value}
                                </p>
                                <div className="flex items-center gap-1">
                                    {stat.growth !== undefined && (
                                        <Badge
                                            className={cn(
                                                "text-[10px] h-4",
                                                stat.growth >= 0
                                                    ? "bg-green-100 text-green-700 border-green-200"
                                                    : "bg-red-100 text-red-700 border-red-200",
                                            )}
                                        >
                                            {stat.growth >= 0 ? (
                                                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                                            ) : (
                                                <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                                            )}
                                            {Math.abs(stat.growth)}%
                                        </Badge>
                                    )}
                                    {stat.subText && (
                                        <span className="text-[10px] text-slate-400">
                                            {stat.subText}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}
                            >
                                <stat.icon
                                    className={`h-4 w-4 ${stat.textColor}`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}