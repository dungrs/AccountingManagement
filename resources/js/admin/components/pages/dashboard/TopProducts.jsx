"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import { Package } from "lucide-react";
import { cn } from "@/admin/lib/utils";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num || 0);
};

export default function TopProducts({ products, filters }) {
    return (
        <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle>Top sản phẩm bán chạy</CardTitle>
                        <CardDescription>
                            Tháng {filters.month}/{filters.year}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {products?.length > 0 ? (
                        products.map((product, idx) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge
                                        className={cn(
                                            "w-7 h-7 rounded-full p-0 flex items-center justify-center",
                                            idx === 0
                                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                                : idx === 1
                                                  ? "bg-slate-100 text-slate-700 border-slate-200"
                                                  : "bg-orange-100 text-orange-700 border-orange-200",
                                        )}
                                    >
                                        #{idx + 1}
                                    </Badge>
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">
                                            {product.product_name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Đã bán:{" "}
                                            {formatNumber(
                                                product.total_quantity,
                                            )}{" "}
                                            {product.unit_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-blue-600 text-sm">
                                        {formatCurrency(product.total_revenue)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {product.order_count} đơn
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            Chưa có dữ liệu bán hàng trong tháng
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}