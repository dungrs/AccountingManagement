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
    Pencil,
    Trash2,
    Tag,
    FileText,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ListChecks,
} from "lucide-react";
import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";
import { router } from "@inertiajs/react";
import { formatDate } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function PriceListTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleDeleteClick,
    onToggleActive,
}) {
    // Kiểm tra bảng giá đang hiệu lực
    const isActiveNow = (row) => {
        const now = new Date();
        const start = row.start_date ? new Date(row.start_date) : null;
        const end = row.end_date ? new Date(row.end_date) : null;

        if (!start) return false;
        if (start > now) return false;
        if (end && end < now) return false;
        return true;
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
                        <TableHead className="w-12">
                            <Checkbox
                                checked={
                                    selectedRows.length === data.length &&
                                    data.length > 0
                                }
                                onCheckedChange={toggleAll}
                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-blue-600" />
                                Tên bảng giá
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-purple-600" />
                                Mô tả
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                Ngày bắt đầu
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                Ngày kết thúc
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-center">
                            Trạng thái
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            Thao tác
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length > 0 ? (
                        data.map((row, index) => {
                            const activeNow = isActiveNow(row);

                            return (
                                <TableRow
                                    key={row.id}
                                    className={cn(
                                        "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200",
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-slate-50/50",
                                    )}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(
                                                row.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleRow(row.id)
                                            }
                                            className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                    </TableCell>

                                    {/* Tên bảng giá */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10 flex items-center justify-center">
                                                <ListChecks className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">
                                                    {row.name}
                                                </span>
                                                {activeNow && (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs mt-1">
                                                        Đang hiệu lực
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Mô tả */}
                                    <TableCell>
                                        {row.description &&
                                        row.description !== "-" ? (
                                            <span className="text-sm text-slate-600 line-clamp-2 max-w-[200px]">
                                                {row.description}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                —
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Ngày bắt đầu */}
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-slate-600">
                                                {row.start_date
                                                    ? formatDate(row.start_date)
                                                    : "-"}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Ngày kết thúc */}
                                    <TableCell>
                                        {row.end_date ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="h-3.5 w-3.5 text-orange-500" />
                                                <span className="text-slate-600">
                                                    {formatDate(row.end_date)}
                                                </span>
                                            </div>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="bg-purple-50 text-purple-700 border-purple-200"
                                            >
                                                Không giới hạn
                                            </Badge>
                                        )}
                                    </TableCell>

                                    {/* Trạng thái publish */}
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <ChangeStatusSwitch
                                                id={row.id}
                                                checked={row.active}
                                                field="publish"
                                                model="PriceList"
                                                modelParent=""
                                                onSuccess={(res) => {
                                                    onToggleActive?.(
                                                        row.id,
                                                        res.checked,
                                                    );
                                                }}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </div>
                                    </TableCell>

                                    {/* Thao tác */}
                                    <TableCell className="text-right">
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
                                                        router.visit(
                                                            route(
                                                                "admin.price.list.edit",
                                                                row.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-center w-full">
                                                        <Pencil className="mr-2 h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                                        <span className="text-slate-700 group-hover:text-blue-600">
                                                            Chỉnh sửa
                                                        </span>
                                                    </div>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="cursor-pointer dropdown-premium-item group text-red-600 hover:text-red-700"
                                                    onClick={() =>
                                                        handleDeleteClick(row)
                                                    }
                                                >
                                                    <div className="flex items-center w-full">
                                                        <Trash2 className="mr-2 h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
                                                        <span className="text-red-600 group-hover:text-red-700">
                                                            Xóa
                                                        </span>
                                                    </div>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                                        <Tag className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không tìm thấy dữ liệu
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Nhấn nút "Thêm bảng giá" để tạo mới
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