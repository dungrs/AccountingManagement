"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import { Badge } from "@/admin/components/ui/badge";
import { formatCurrency } from "@/admin/utils/helpers";
import { Star, TrendingUp } from "lucide-react";

export default function TopProductsTable({ products = [] }) {
    if (!products.length) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                Chưa có dữ liệu
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">SL bán</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">Đơn hàng</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product, index) => (
                    <TableRow key={product.id}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {index < 3 ? (
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ) : (
                                    <TrendingUp className="h-4 w-4 text-slate-400" />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {product.product_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Đơn vị: {product.unit_name}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {product.total_quantity}
                        </TableCell>
                        <TableCell className="text-right">
                            {formatCurrency(product.total_revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                            <Badge variant="outline" className="bg-blue-50">
                                {product.order_count}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}