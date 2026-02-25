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
    BookOpen,
    RefreshCw,
    ArrowLeftRight,
    Info,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/admin/components/ui/tooltip";

export default function GeneralLedgerTable({
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

    const balanceTypeLabel =
        accountInfo.normal_balance === "debit" ? "Nợ" : "Có";

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
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                Diễn giải
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 w-32">
                            <div className="flex items-center gap-2">
                                <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                                TK ĐƯ
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-32">
                            <div className="flex items-center justify-end gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Nợ
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-32">
                            <div className="flex items-center justify-end gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Có
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-32">
                            <div className="flex items-center justify-end gap-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                Dư {balanceTypeLabel}
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
                                        {row.entry_date ? (
                                            <div className="text-sm text-slate-600">
                                                {row.entry_date}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                -
                                            </span>
                                        )}
                                        {/* Hiển thị ngày chứng từ gốc nếu có */}
                                        {row.voucher_date &&
                                            row.voucher_date !==
                                                row.entry_date && (
                                                <div className="text-xs text-slate-400 mt-1">
                                                    (CT: {row.voucher_date})
                                                </div>
                                            )}
                                    </TableCell>

                                    {/* Số hiệu chứng từ */}
                                    <TableCell>
                                        {row.reference_code ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-50 text-blue-700 border-blue-200 font-mono"
                                                    >
                                                        {row.reference_code}
                                                    </Badge>
                                                    {row.reference_type_label && (
                                                        <span className="text-xs text-purple-600">
                                                            (
                                                            {
                                                                row.reference_type_label
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Diễn giải */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            <span
                                                className={cn(
                                                    "text-sm",
                                                    isOpeningRow
                                                        ? "font-semibold text-slate-800"
                                                        : "text-slate-600",
                                                )}
                                            >
                                                {row.voucher_note}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Tài khoản đối ứng */}
                                    <TableCell>
                                        {!isOpeningRow &&
                                        row.contra_account_code ? (
                                            <div className="flex items-center gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className="bg-purple-50 text-purple-700 border-purple-200 font-mono text-xs"
                                                >
                                                    {row.contra_account_code}
                                                </Badge>
                                                {row.contra_account_name && (
                                                    <span
                                                        className="text-xs text-slate-500 truncate max-w-[80px]"
                                                        title={
                                                            row.contra_account_name
                                                        }
                                                    >
                                                        {
                                                            row.contra_account_name
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            !isOpeningRow && (
                                                <span className="text-slate-400 italic">
                                                    -
                                                </span>
                                            )
                                        )}
                                    </TableCell>

                                    {/* Số tiền Nợ */}
                                    <TableCell className="text-right">
                                        {row.debit > 0 ? (
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(row.debit)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Số tiền Có */}
                                    <TableCell className="text-right">
                                        {row.credit > 0 ? (
                                            <span className="font-medium text-red-600">
                                                {formatCurrency(row.credit)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Số dư */}
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
                                        <BookOpen className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không có dữ liệu phát sinh trong kỳ
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Thử thay đổi kỳ báo cáo hoặc tài khoản
                                        khác
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
