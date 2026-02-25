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
import {
    Calendar,
    FileText,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function CashBookTable({
    data = [],
    loading = false,
    accountInfo = {},
}) {
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
                        <TableHead className="font-semibold text-slate-700 w-24">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                Ngày CT
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 w-28">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-purple-600" />
                                Số CT
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Diễn giải
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-32">
                            <div className="flex items-center justify-end gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Thu
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-32">
                            <div className="flex items-center justify-end gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Chi
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-32">
                            <div className="flex items-center justify-end gap-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                Tồn
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 w-32">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-600" />
                                Ghi chú
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length > 0 ? (
                        data.map((row, index) => {
                            // Kiểm tra nếu là dòng số dư đầu kỳ
                            const isOpeningRow = row.is_opening;

                            return (
                                <TableRow
                                    key={index}
                                    className={cn(
                                        "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200",
                                        isOpeningRow &&
                                            "bg-blue-50/50 font-medium",
                                        index % 2 === 0 && !isOpeningRow
                                            ? "bg-white"
                                            : !isOpeningRow && "bg-slate-50/50",
                                    )}
                                >
                                    {/* Ngày chứng từ */}
                                    <TableCell>
                                        {row.voucher_date ? (
                                            <div className="text-sm text-slate-600">
                                                {formatDate(
                                                    row.voucher_date,
                                                    "DD/MM/YYYY",
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Số hiệu chứng từ */}
                                    <TableCell>
                                        {row.code ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-50 text-blue-700 border-blue-200 font-mono"
                                            >
                                                {row.code}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Diễn giải */}
                                    <TableCell>
                                        <span
                                            className={cn(
                                                "text-sm",
                                                isOpeningRow
                                                    ? "font-semibold text-slate-800"
                                                    : "text-slate-600",
                                            )}
                                        >
                                            {row.description}
                                        </span>
                                    </TableCell>

                                    {/* Số tiền thu */}
                                    <TableCell className="text-right">
                                        {row.receipt_amount > 0 ? (
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(
                                                    row.receipt_amount,
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Số tiền chi */}
                                    <TableCell className="text-right">
                                        {row.payment_amount > 0 ? (
                                            <span className="font-medium text-red-600">
                                                {formatCurrency(
                                                    row.payment_amount,
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Số dư tồn */}
                                    <TableCell
                                        className={cn(
                                            "text-right font-bold",
                                            row.balance > 0
                                                ? "text-blue-600"
                                                : row.balance < 0
                                                  ? "text-orange-600"
                                                  : "text-slate-600",
                                        )}
                                    >
                                        {formatCurrency(row.balance)}
                                    </TableCell>

                                    {/* Ghi chú */}
                                    <TableCell>
                                        {row.note ? (
                                            <span className="text-sm text-slate-600 line-clamp-1 max-w-[150px]">
                                                {row.note}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                -
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <Wallet className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không có dữ liệu giao dịch trong kỳ
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Thử thay đổi khoảng thời gian hoặc loại
                                        quỹ khác
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