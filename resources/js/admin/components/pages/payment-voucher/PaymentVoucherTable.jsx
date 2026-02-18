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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { router } from "@inertiajs/react";
import { formatDate } from "@/admin/utils/helpers";

const getStatusBadge = (status) => {
    const statusMap = {
        draft: {
            label: "Nháp",
            className: "bg-yellow-100 text-yellow-800",
        },
        confirmed: {
            label: "Đã xác nhận",
            className: "bg-green-100 text-green-800",
        },
    };

    return (
        statusMap[status] || {
            label: status,
            className: "bg-gray-100 text-gray-800",
        }
    );
};

const getPaymentMethodBadge = (method) => {
    const methodMap = {
        cash: {
            label: "Tiền mặt",
            className: "bg-blue-100 text-blue-800",
        },
        bank: {
            label: "Chuyển khoản",
            className: "bg-purple-100 text-purple-800",
        },
    };

    return (
        methodMap[method] || {
            label: method,
            className: "bg-gray-100 text-gray-800",
        }
    );
};

const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });
};

export default function PaymentVoucherTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleDeleteClick,
}) {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40">
                        <TableHead className="w-12">
                            <Checkbox
                                checked={
                                    selectedRows.length === data.length &&
                                    data.length > 0
                                }
                                onCheckedChange={toggleAll}
                            />
                        </TableHead>

                        <TableHead>Mã phiếu</TableHead>
                        <TableHead>Ngày chi</TableHead>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead className="text-center">
                            Phương thức
                        </TableHead>
                        <TableHead className="text-center">
                            Trạng thái
                        </TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell
                                colSpan={9}
                                className="text-center text-muted-foreground py-10"
                            >
                                Đang tải dữ liệu...
                            </TableCell>
                        </TableRow>
                    ) : data.length > 0 ? (
                        data.map((row) => {
                            const statusBadge = getStatusBadge(row.status);
                            const methodBadge = getPaymentMethodBadge(row.payment_method);
                            return (
                                <TableRow
                                    key={row.id}
                                    className="hover:bg-muted/30 transition"
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(
                                                row.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleRow(row.id)
                                            }
                                        />
                                    </TableCell>

                                    {/* Mã phiếu */}
                                    <TableCell className="font-medium">
                                        {row.code}
                                    </TableCell>

                                    {/* Ngày chi */}
                                    <TableCell>
                                        {row.voucher_date
                                            ? formatDate(row.voucher_date)
                                            : "-"}
                                    </TableCell>

                                    {/* Nhà cung cấp */}
                                    <TableCell className="font-medium">
                                        {row.supplier_name}
                                    </TableCell>

                                    {/* Số tiền */}
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(row.amount)}
                                    </TableCell>

                                    {/* Phương thức thanh toán */}
                                    <TableCell className="text-center">
                                        <span
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${methodBadge.className}`}
                                        >
                                            {methodBadge.label}
                                        </span>
                                    </TableCell>

                                    {/* Trạng thái */}
                                    <TableCell className="text-center">
                                        <span
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}
                                        >
                                            {statusBadge.label}
                                        </span>
                                    </TableCell>

                                    {/* Ghi chú */}
                                    <TableCell className="text-sm max-w-[200px] truncate">
                                        {row.note || "-"}
                                    </TableCell>

                                    {/* Thao tác */}
                                    <TableCell className="text-right">
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
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "admin.voucher.payment.edit",
                                                                row.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Pencil className="mr-1 h-4 w-4 text-yellow-600" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600"
                                                    onClick={() =>
                                                        handleDeleteClick(row)
                                                    }
                                                >
                                                    <Trash2 className="mr-1 h-4 w-4" />
                                                    Xóa
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
                                colSpan={9}
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