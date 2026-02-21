"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import {
    Clock,
    ShoppingCart,
    Package,
    Wallet,
    CreditCard,
    CheckCircle2,
    XCircle,
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

const getStatusBadge = (status) => {
    const statusMap = {
        draft: {
            label: "Nháp",
            className: "bg-yellow-100 text-yellow-700 border-yellow-200",
            icon: Clock,
        },
        confirmed: {
            label: "Đã xác nhận",
            className: "bg-green-100 text-green-700 border-green-200",
            icon: CheckCircle2,
        },
        cancelled: {
            label: "Đã hủy",
            className: "bg-red-100 text-red-700 border-red-200",
            icon: XCircle,
        },
    };
    return statusMap[status] || statusMap.draft;
};

export default function RecentActivities({ activities }) {
    return (
        <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle>Hoạt động gần đây</CardTitle>
                        <CardDescription>
                            Các giao dịch mới nhất
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {activities?.length > 0 ? (
                        activities.slice(0, 8).map((activity, idx) => {
                            const status = getStatusBadge(activity.status);
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "h-9 w-9 rounded-lg flex items-center justify-center",
                                                activity.type ===
                                                    "sales_receipt"
                                                    ? "bg-green-100"
                                                    : activity.type ===
                                                        "purchase_receipt"
                                                      ? "bg-blue-100"
                                                      : activity.type ===
                                                          "receipt_voucher"
                                                        ? "bg-purple-100"
                                                        : "bg-amber-100",
                                            )}
                                        >
                                            {activity.type ===
                                                "sales_receipt" && (
                                                <ShoppingCart className="h-4 w-4 text-green-600" />
                                            )}
                                            {activity.type ===
                                                "purchase_receipt" && (
                                                <Package className="h-4 w-4 text-blue-600" />
                                            )}
                                            {activity.type ===
                                                "receipt_voucher" && (
                                                <Wallet className="h-4 w-4 text-purple-600" />
                                            )}
                                            {activity.type ===
                                                "payment_voucher" && (
                                                <CreditCard className="h-4 w-4 text-amber-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800 text-sm">
                                                    {activity.code}
                                                </span>
                                                <Badge
                                                    className={cn(
                                                        "text-xs py-0 h-5",
                                                        status.className,
                                                    )}
                                                >
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {activity.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-blue-600 text-sm">
                                            {formatCurrency(activity.amount)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {activity.date_formatted}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            Chưa có hoạt động nào gần đây
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}