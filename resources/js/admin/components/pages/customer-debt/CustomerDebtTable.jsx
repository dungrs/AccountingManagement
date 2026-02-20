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
    Users,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Hash,
} from "lucide-react";
import { formatCurrency } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function CustomerDebtTable({
    data = [],
    loading = false,
    handleViewDetail,
}) {
    // Helper function to determine balance color (positive = khách nợ, negative = nợ lại khách)
    const getBalanceColor = (balance) => {
        if (balance > 0) return "text-red-600"; // Khách nợ
        if (balance < 0) return "text-green-600"; // Nợ lại khách
        return "text-slate-600"; // Cân bằng
    };

    // Helper function to get transaction count badge
    const getTransactionCountBadge = (count) => {
        if (count === 0) return null;
        return (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {count} phát sinh
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 border-r-purple-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">
                        Đang tải dữ liệu...
                    </p>
                    <p className="text-sm text-slate-400">
                        Vui lòng chờ trong giây lát
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 hover:from-blue-600/10 hover:to-purple-600/10">
                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                Tên khách hàng
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                Dư đầu kỳ
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                PS Nợ
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                PS Có
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                Dư cuối kỳ
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-center">
                            Thao tác
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length > 0 ? (
                        data.map((row, index) => (
                            <TableRow
                                key={row.customer_id}
                                className={cn(
                                    "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200",
                                    index % 2 === 0
                                        ? "bg-white"
                                        : "bg-slate-50/50",
                                )}
                            >
                                {/* Tên KH */}
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">
                                            {row.customer_name}
                                        </span>
                                        {row.tax_code && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Hash className="h-3 w-3" />
                                                MST: {row.tax_code}
                                            </span>
                                        )}
                                        {row.phone && (
                                            <span className="text-xs text-slate-500 mt-1">
                                                {row.phone}
                                            </span>
                                        )}
                                        {row.transaction_count > 0 && (
                                            <div className="mt-2">
                                                {getTransactionCountBadge(
                                                    row.transaction_count,
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Dư đầu kỳ */}
                                <TableCell
                                    className={cn(
                                        "text-right font-medium",
                                        getBalanceColor(row.opening_balance),
                                    )}
                                >
                                    {formatCurrency(row.opening_balance)}
                                </TableCell>

                                {/* PS Nợ (bán hàng - tăng nợ) */}
                                <TableCell className="text-right">
                                    {row.total_debit > 0 ? (
                                        <span className="font-medium text-green-600">
                                            +{formatCurrency(row.total_debit)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">
                                            —
                                        </span>
                                    )}
                                </TableCell>

                                {/* PS Có (thu tiền - giảm nợ) */}
                                <TableCell className="text-right">
                                    {row.total_credit > 0 ? (
                                        <span className="font-medium text-red-600">
                                            -{formatCurrency(row.total_credit)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">
                                            —
                                        </span>
                                    )}
                                </TableCell>

                                {/* Dư cuối kỳ */}
                                <TableCell
                                    className={cn(
                                        "text-right font-bold",
                                        getBalanceColor(row.closing_balance),
                                    )}
                                >
                                    {formatCurrency(row.closing_balance)}
                                </TableCell>

                                {/* Thao tác */}
                                <TableCell className="text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-md hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-purple-600/10 hover:text-blue-600 transition-all duration-200"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="end"
                                            className="dropdown-premium-content rounded-md w-48"
                                        >
                                            <DropdownMenuItem
                                                className="cursor-pointer dropdown-premium-item group"
                                                onClick={() =>
                                                    handleViewDetail(row)
                                                }
                                            >
                                                <div className="flex items-center w-full">
                                                    <Eye className="mr-2 h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                                    <span className="text-slate-700 group-hover:text-blue-600">
                                                        Xem chi tiết phát sinh
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không tìm thấy dữ liệu
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Thử thay đổi kỳ báo cáo hoặc tìm kiếm
                                        với từ khóa khác
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}