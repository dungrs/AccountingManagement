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
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/admin/components/ui/avatar";

import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Landmark,
    Hash,
    Globe,
    CreditCard,
    Building2,
} from "lucide-react";
import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";
import { getInitials } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function BankTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleEdit,
    handleDeleteClick,
    onToggleActive,
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
                                    data.length > 0 &&
                                    selectedRows.length === data.length
                                }
                                onCheckedChange={toggleAll}
                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-blue-600" />
                                Ngân hàng
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-purple-600" />
                                Mã ngân hàng
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-600" />
                                Tên viết tắt
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-600" />
                                Swift Code
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-orange-600" />
                                BIN Code
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
                        data.map((row, index) => (
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
                                        checked={selectedRows.includes(row.id)}
                                        onCheckedChange={() =>
                                            toggleRow(row.id)
                                        }
                                        className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableCell>

                                {/* Bank name + logo */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-white ring-blue-200">
                                            <AvatarImage
                                                src={row.logo || ""}
                                                alt={row.name}
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-medium">
                                                {getInitials(row.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800 leading-tight">
                                                {row.name}
                                            </span>
                                            {row.description && (
                                                <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">
                                                    {row.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className="bg-purple-50 text-purple-700 border-purple-200 font-mono"
                                    >
                                        {row.bank_code || "-"}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <span className="text-sm text-slate-600">
                                        {row.short_name || "-"}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    {row.swift_code ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200 font-mono"
                                        >
                                            {row.swift_code}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-slate-400">
                                            —
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    {row.bin_code ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-orange-50 text-orange-700 border-orange-200 font-mono"
                                        >
                                            {row.bin_code}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-slate-400">
                                            —
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <ChangeStatusSwitch
                                            id={row.id}
                                            checked={row.active}
                                            field="publish"
                                            model="Bank"
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
                                                onClick={() => handleEdit(row)}
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
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <Landmark className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không tìm thấy dữ liệu
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Nhấn nút "Thêm ngân hàng" để tạo mới
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