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
    ArrowUp,
    ArrowDown,
    Minus,
} from "lucide-react";
import { formatCurrency } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function GeneralJournalTable({
    data = [],
    loading = false,
    accountInfo = {},
}) {
    if (loading) {
        return (
            <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-purple-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse"></div>
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

    if (!data || data.length === 0) {
        return (
            <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-indigo-600/50" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg">
                        Không có dữ liệu trong kỳ
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        Thử thay đổi khoảng thời gian hoặc tài khoản khác
                    </p>
                </div>
            </div>
        );
    }

    // Tính tổng Nợ và tổng Có
    const totalDebit = data.reduce(
        (sum, row) => sum + (row.so_tien_no || 0),
        0,
    );
    const totalCredit = data.reduce(
        (sum, row) => sum + (row.so_tien_co || 0),
        0,
    );

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
            {/* Header với thông tin tổng hợp */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">
                            Tổng số dòng:
                        </span>
                        <Badge variant="outline" className="bg-white">
                            {data.length}
                        </Badge>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">
                            Tổng Nợ:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(totalDebit)}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">
                            Tổng Có:
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                            {formatCurrency(totalCredit)}
                        </span>
                    </div>
                </div>
                <Badge
                    className={cn(
                        "px-3 py-1",
                        isBalanced
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200",
                    )}
                >
                    {isBalanced ? (
                        <span className="flex items-center gap-1">
                            <Minus className="h-3 w-3" />
                            Cân đối
                        </span>
                    ) : totalDebit > totalCredit ? (
                        <span className="flex items-center gap-1">
                            <ArrowUp className="h-3 w-3" />
                            Nợ  Có: {formatCurrency(totalDebit - totalCredit)}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <ArrowDown className="h-3 w-3" />
                            Có  Nợ: {formatCurrency(totalCredit - totalDebit)}
                        </span>
                    )}
                </Badge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10">
                            <TableHead className="font-semibold text-slate-700 w-26">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    Ngày GS
                                </div>
                            </TableHead>

                            <TableHead className="font-semibold text-slate-700 w-26">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    Số CT
                                </div>
                            </TableHead>

                            <TableHead className="font-semibold text-slate-700 w-26">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    Ngày CT
                                </div>
                            </TableHead>

                            <TableHead className="font-semibold text-slate-700 min-w-[300px]">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    Diễn giải
                                </div>
                            </TableHead>

                            <TableHead className="font-semibold text-slate-700 w-25 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-4 w-4 text-orange-600" />
                                    Đã ghi SC
                                </div>
                            </TableHead>

                            <TableHead className="font-semibold text-slate-700 w-30 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    STT dòng
                                </div>
                            </TableHead>

                            <TableHead className="font-semibold text-slate-700 w-25 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    Số hiệu TK
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
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow
                                key={index}
                                className={cn(
                                    "hover:bg-gradient-to-r hover:from-indigo-600/5 hover:to-purple-600/5 transition-all duration-200",
                                    index % 2 === 0
                                        ? "bg-white"
                                        : "bg-slate-50/50",
                                )}
                            >
                                {/* Ngày tháng ghi sổ */}
                                <TableCell>
                                    {row.ngay_ct && row.thang_ct && row.nam_ct ? (
                                        <span className="text-sm text-slate-600">
                                            {`${row.ngay_ct
                                                .toString()
                                                .padStart(2, "0")}/${row.thang_ct
                                                .toString()
                                                .padStart(2, "0")}/${row.nam_ct}`}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">
                                            -
                                        </span>
                                    )}
                                </TableCell>

                                {/* Số hiệu chứng từ */}
                                <TableCell>
                                    {row.so_hieu_ct ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                                        >
                                            {row.so_hieu_ct}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">
                                            -
                                        </span>
                                    )}
                                </TableCell>

                                {/* Ngày tháng chứng từ */}
                                <TableCell>
                                    {row.ngay_ct && row.thang_ct && row.nam_ct ? (
                                        <span className="text-sm text-slate-600">
                                            {`${row.ngay_ct
                                                .toString()
                                                .padStart(2, "0")}/${row.thang_ct
                                                .toString()
                                                .padStart(2, "0")}/${row.nam_ct}`}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">
                                            -
                                        </span>
                                    )}
                                </TableCell>

                                {/* Diễn giải */}
                                <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm text-slate-600">
                                            {row.dien_giai || ""}
                                        </span>
                                        {row.partner_info && (
                                            <span className="text-xs text-indigo-500">
                                                {row.partner_info}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Đã ghi sổ cái */}
                                <TableCell className="text-center">
                                    {row.da_ghi_so_cai ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-green-50 text-green-700 border-green-200 text-xs"
                                        >
                                            Đã ghi
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-slate-50 text-slate-400 border-slate-200 text-xs"
                                        >
                                            Chưa
                                        </Badge>
                                    )}
                                </TableCell>

                                {/* STT dòng */}
                                <TableCell className="text-center text-sm text-slate-600">
                                    {row.stt || ""}
                                </TableCell>

                                {/* Số hiệu TK */}
                                <TableCell className="text-center">
                                    {row.tk_no ? (
                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                            {row.tk_no}
                                        </Badge>
                                    ) : row.tk_co ? (
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                            {row.tk_co}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-slate-300">
                                            -
                                        </span>
                                    )}
                                </TableCell>

                                {/* Số tiền Nợ */}
                                <TableCell className="text-right">
                                    {row.so_tien_no > 0 ? (
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(row.so_tien_no)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">
                                            -
                                        </span>
                                    )}
                                </TableCell>

                                {/* Số tiền Có */}
                                <TableCell className="text-right">
                                    {row.so_tien_co > 0 ? (
                                        <span className="font-medium text-red-600">
                                            {formatCurrency(row.so_tien_co)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">
                                            -
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer tổng hợp */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Hiển thị {data.length} dòng dữ liệu
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">
                                Tổng Nợ:
                            </span>
                            <span className="text-sm font-bold text-green-600">
                                {formatCurrency(totalDebit)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">
                                Tổng Có:
                            </span>
                            <span className="text-sm font-bold text-red-600">
                                {formatCurrency(totalCredit)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">
                                Chênh lệch:
                            </span>
                            <span
                                className={cn(
                                    "text-sm font-bold",
                                    isBalanced
                                        ? "text-green-600"
                                        : "text-orange-600",
                                )}
                            >
                                {formatCurrency(Math.abs(totalDebit - totalCredit))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}