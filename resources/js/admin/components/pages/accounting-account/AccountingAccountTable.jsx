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
    BookOpen,
    ChevronRight,
    DollarSign,
    CreditCard,
    PieChart,
    TrendingUp,
    Layers,
} from "lucide-react";

import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";
import { cn } from "@/admin/lib/utils";

export default function AccountingAccountTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleEdit,
    handleDeleteClick,
    onToggleActive,
}) {
    // Hàm lấy màu sắc cho loại tài khoản (viết hoa)
    const getAccountTypeBadge = (type) => {
        switch (type) {
            case "ASSET":
                return {
                    bg: "bg-blue-100",
                    text: "text-blue-700",
                    border: "border-blue-200",
                    icon: DollarSign,
                    label: "Tài sản",
                };
            case "LIABILITY":
                return {
                    bg: "bg-purple-100",
                    text: "text-purple-700",
                    border: "border-purple-200",
                    icon: CreditCard,
                    label: "Nợ phải trả",
                };
            case "EQUITY":
                return {
                    bg: "bg-green-100",
                    text: "text-green-700",
                    border: "border-green-200",
                    icon: PieChart,
                    label: "Vốn chủ sở hữu",
                };
            case "REVENUE":
                return {
                    bg: "bg-amber-100",
                    text: "text-amber-700",
                    border: "border-amber-200",
                    icon: TrendingUp,
                    label: "Doanh thu",
                };
            case "EXPENSE":
                return {
                    bg: "bg-red-100",
                    text: "text-red-700",
                    border: "border-red-200",
                    icon: TrendingUp,
                    label: "Chi phí",
                };
            default:
                return {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                    icon: BookOpen,
                    label: type || "Khác",
                };
        }
    };

    // Hàm lấy màu sắc cho số dư (viết hoa)
    const getBalanceBadge = (balance) => {
        switch (balance) {
            case "DEBIT":
                return {
                    bg: "bg-green-100",
                    text: "text-green-700",
                    border: "border-green-200",
                    label: "Nợ",
                };
            case "CREDIT":
                return {
                    bg: "bg-amber-100",
                    text: "text-amber-700",
                    border: "border-amber-200",
                    label: "Có",
                };
            default:
                return {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                    label: balance || "Khác",
                };
        }
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
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                Mã TK
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-purple-600" />
                                Tên tài khoản
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-blue-600" />
                                Loại
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Số dư
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
                            const typeInfo = getAccountTypeBadge(
                                row.account_type,
                            );
                            const balanceInfo = getBalanceBadge(
                                row.normal_balance,
                            );
                            const TypeIcon = typeInfo.icon;

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

                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-semibold"
                                        >
                                            {row.account_code}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center text-blue-600">
                                                {row.level > 0 && (
                                                    <>
                                                        {Array(row.level - 1)
                                                            .fill(0)
                                                            .map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-6 border-l-2 border-b-2 border-slate-200 h-4 mx-1"
                                                                />
                                                            ))}
                                                        <ChevronRight className="h-4 w-4 text-purple-500" />
                                                    </>
                                                )}
                                            </div>
                                            <span className="font-medium text-slate-800">
                                                {row.name}
                                            </span>
                                            {row.level === 1 && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                    Cấp 1
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-medium flex items-center gap-1 w-fit",
                                                typeInfo.bg,
                                                typeInfo.text,
                                                typeInfo.border,
                                            )}
                                        >
                                            <TypeIcon className="h-3.5 w-3.5" />
                                            {typeInfo.label}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-medium",
                                                balanceInfo.bg,
                                                balanceInfo.text,
                                                balanceInfo.border,
                                            )}
                                        >
                                            {balanceInfo.label}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <ChangeStatusSwitch
                                                id={row.id}
                                                checked={row.active}
                                                field="publish"
                                                model="AccountingAccount"
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
                                                        handleEdit(row)
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
                                        <BookOpen className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không có tài khoản kế toán nào
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Nhấn nút "Thêm tài khoản" để tạo mới
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