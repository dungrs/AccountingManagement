"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Package, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { router } from "@inertiajs/react";

export default function InventoryAlert({
    inventory = { low_stock: [], out_of_stock: 0 },
}) {
    // Kiểm tra an toàn với giá trị mặc định
    const lowStock = inventory?.low_stock || [];
    const outOfStock = inventory?.out_of_stock || 0;

    return (
        <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle>Tồn kho - Cảnh báo</CardTitle>
                        <CardDescription>Sản phẩm tồn dưới 10</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {lowStock.length > 0 ? (
                    <div className="space-y-3">
                        {lowStock.slice(0, 5).map((item) => (
                            <div
                                key={item?.id || Math.random()}
                                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">
                                            {item?.product_name || "Sản phẩm"}
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Còn {item?.quantity || 0} sản phẩm
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={() =>
                                        router.visit(
                                            route(
                                                "admin.receipt.purchase.create",
                                            ),
                                        )
                                    }
                                >
                                    Nhập hàng
                                </Button>
                            </div>
                        ))}

                        {lowStock.length > 5 && (
                            <p className="text-xs text-center text-slate-500 mt-2">
                                + {lowStock.length - 5} sản phẩm khác
                            </p>
                        )}

                        {outOfStock > 0 && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                Sản phẩm hết hàng
                                            </p>
                                            <p className="text-xs text-red-600">
                                                Cần nhập thêm
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-base">
                                        {outOfStock}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">
                            Tồn kho ổn định
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            Không có sản phẩm sắp hết hàng
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}