"use client";

import { Badge } from "@/admin/components/ui/badge";
import { formatCurrency } from "@/admin/utils/helpers";
import {
    ShoppingCart,
    Package,
    CreditCard,
    Wallet,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

const iconMap = {
    "shopping-cart": ShoppingCart,
    package: Package,
    "credit-card": CreditCard,
    wallet: Wallet,
};

const statusColors = {
    confirmed: "bg-green-100 text-green-700 border-green-200",
    draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function RecentActivities({ activities = [] }) {
    if (!activities.length) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                Chưa có hoạt động
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => {
                const Icon = iconMap[activity.icon] || Package;

                return (
                    <div
                        key={index}
                        className="flex items-start gap-4 rounded-lg border p-3 transition-all hover:bg-slate-50"
                    >
                        <div
                            className={cn(
                                "rounded-lg p-2",
                                activity.type === "sales_receipt"
                                    ? "bg-green-100"
                                    : "bg-blue-100",
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5",
                                    activity.type === "sales_receipt"
                                        ? "text-green-600"
                                        : "text-blue-600",
                                )}
                            />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{activity.code}</p>
                                <Badge
                                    variant="outline"
                                    className={statusColors[activity.status]}
                                >
                                    {activity.status === "confirmed"
                                        ? "Đã xác nhận"
                                        : activity.status === "draft"
                                          ? "Nháp"
                                          : "Đã hủy"}
                                </Badge>
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                                {activity.description}
                            </p>

                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.date_formatted}
                                </span>
                                <span className="font-medium text-slate-700">
                                    {formatCurrency(activity.amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}