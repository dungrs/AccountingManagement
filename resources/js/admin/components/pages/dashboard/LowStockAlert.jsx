"use client";

import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/admin/components/ui/badge";

export default function LowStockAlert({ products = [] }) {
    if (!products.length) {
        return (
            <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                Không có sản phẩm sắp hết hàng
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-orange-200 p-1.5">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-800">
                                {product.product_name}
                            </p>
                            <p className="text-xs text-orange-600">
                                Tồn kho: {product.quantity}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className="border-orange-300 bg-orange-100 text-orange-700"
                    >
                        Sắp hết
                    </Badge>
                </div>
            ))}
        </div>
    );
}