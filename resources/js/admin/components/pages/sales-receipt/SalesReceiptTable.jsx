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
    Eye,
    Package,
    Calendar,
    User,
    FileText,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    Users, // Thêm icon cho khách hàng
    Tag, // Thêm icon cho bảng giá
} from "lucide-react";
import { router } from "@inertiajs/react";
import { formatDate } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

const getStatusBadge = (status) => {
    const statusMap = {
        draft: {
            label: "Nháp",
            className: "bg-yellow-100 text-yellow-700 border-yellow-200",
            icon: Clock,
        },
        confirmed: {
            label: "Đã xác nhận",
            className: "bg-green-100 text-green-700 border-green-200",
            icon: CheckCircle2,
        },
        cancelled: {
            label: "Đã hủy",
            className: "bg-red-100 text-red-700 border-red-200",
            icon: XCircle,
        },
    };

    return (
        statusMap[status] || {
            label: status,
            className: "bg-gray-100 text-gray-700 border-gray-200",
            icon: Package,
        }
    );
};

const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });
};

export default function SalesReceiptTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleDeleteClick,
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
                                <Package className="h-4 w-4 text-blue-600" />
                                Mã phiếu
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-600" />
                                Ngày xuất {/* Đổi text */}
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />{" "}
                                {/* Đổi icon */}
                                Khách hàng {/* Đổi text */}
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-purple-600" />{" "}
                                {/* Thêm cột bảng giá */}
                                Bảng giá
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Tổng tiền
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-center">
                            Trạng thái
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-purple-600" />
                                Người tạo
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Ghi chú
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right">
                            Thao tác
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length > 0 ? (
                        data.map((row, index) => {
                            const statusBadge = getStatusBadge(row.status);
                            const StatusIcon = statusBadge.icon;

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

                                    {/* Mã phiếu */}
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200 font-mono"
                                        >
                                            {row.code}
                                        </Badge>
                                    </TableCell>

                                    {/* Ngày xuất */}
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                            <Calendar className="h-3.5 w-3.5 text-purple-500" />
                                            {row.receipt_date
                                                ? formatDate(row.receipt_date)
                                                : "-"}
                                        </div>
                                    </TableCell>

                                    {/* Khách hàng */}
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                            <Users className="h-3.5 w-3.5 text-blue-500" />
                                            {row.customer_name}
                                        </div>
                                    </TableCell>

                                    {/* Bảng giá */}
                                    <TableCell>
                                        {row.price_list_name ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-purple-50 text-purple-700 border-purple-200"
                                            >
                                                <Tag className="h-3 w-3 mr-1" />
                                                {row.price_list_name}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">
                                                -
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Tổng tiền */}
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {formatCurrency(row.grand_total)}
                                    </TableCell>

                                    {/* Trạng thái */}
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "flex items-center gap-1 w-fit mx-auto",
                                                statusBadge.className,
                                            )}
                                        >
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {statusBadge.label}
                                        </Badge>
                                    </TableCell>

                                    {/* Người tạo */}
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                            <User className="h-3.5 w-3.5 text-purple-500" />
                                            {row.user_name}
                                        </div>
                                    </TableCell>

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
                                                                "admin.receipt.sales.edit", // Đổi route
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
                                colSpan={10} // Tăng colSpan lên 10 vì thêm cột bảng giá
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <Package className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không tìm thấy dữ liệu
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Nhấn nút "Thêm phiếu xuất" để tạo phiếu
                                        mới {/* Đổi text */}
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