"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";

import { Checkbox } from "@/admin/components/ui/checkbox";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";

import {
    MoreHorizontal,
    Eye,
    FileText,
    CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/admin/utils/helpers";

export default function SupplierDebtTable({
    data = [],
    loading = false,
    handleViewDetail,
}) {
    // Helper function to determine balance color (positive = còn nợ, negative = nợ lại)
    const getBalanceColor = (balance) => {
        if (balance > 0) return "text-red-600"; // Còn nợ NCC
        if (balance < 0) return "text-green-600"; // NCC nợ lại
        return "text-gray-600"; // Cân bằng
    };

    // Helper function to get transaction count badge
    const getTransactionCountBadge = (count) => {
        if (count === 0) return null;
        return (
            <Badge variant="outline" className="text-xs">
                {count} phát sinh
            </Badge>
        );
    };

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40">
                        <TableHead>Mã NCC</TableHead>
                        <TableHead>Tên nhà cung cấp</TableHead>
                        <TableHead className="text-right">Dư đầu kỳ</TableHead>
                        <TableHead className="text-right">PS Nợ</TableHead>
                        <TableHead className="text-right">PS Có</TableHead>
                        <TableHead className="text-right">Dư cuối kỳ</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground py-10"
                            >
                                Đang tải dữ liệu...
                            </TableCell>
                        </TableRow>
                    ) : data.length > 0 ? (
                        data.map((row) => (
                            <TableRow
                                key={row.id}
                                className="hover:bg-muted/30 transition"
                            >
                                {/* Mã NCC */}
                                <TableCell className="font-medium">
                                    {row.supplier_code}
                                </TableCell>

                                {/* Tên NCC */}
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {row.supplier_name}
                                        </span>
                                        {row.tax_code && (
                                            <span className="text-xs text-muted-foreground">
                                                MST: {row.tax_code}
                                            </span>
                                        )}
                                        {row.transaction_count > 0 && 
                                            getTransactionCountBadge(row.transaction_count)
                                        }
                                    </div>
                                </TableCell>

                                {/* Dư đầu kỳ */}
                                <TableCell className={`text-right ${getBalanceColor(row.opening_balance)}`}>
                                    {formatCurrency(row.opening_balance)}
                                </TableCell>

                                {/* PS Nợ (thanh toán - giảm nợ) */}
                                <TableCell className="text-right text-blue-600">
                                    {row.total_debit > 0 ? formatCurrency(row.total_debit) : '-'}
                                </TableCell>

                                {/* PS Có (mua hàng - tăng nợ) */}
                                <TableCell className="text-right text-red-600">
                                    {row.total_credit > 0 ? formatCurrency(row.total_credit) : '-'}
                                </TableCell>

                                {/* Dư cuối kỳ */}
                                <TableCell className={`text-right font-semibold ${getBalanceColor(row.closing_balance)}`}>
                                    {formatCurrency(row.closing_balance)}
                                </TableCell>

                                {/* Thao tác */}
                                <TableCell className="text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-md"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="end"
                                            className="rounded-md"
                                        >
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => handleViewDetail(row)}
                                            >
                                                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                                Xem chi tiết phát sinh
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground py-10"
                            >
                                Không tìm thấy dữ liệu phù hợp.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}