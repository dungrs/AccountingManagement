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
    Tags,
    Layers,
    ChevronRight,
    ChevronDown,
    FolderTree,
} from "lucide-react";

import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";
import { router } from "@inertiajs/react";
import { cn } from "@/admin/lib/utils";

export default function AttributeCatalogueTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
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
                                    selectedRows.length === data.length &&
                                    data.length > 0
                                }
                                onCheckedChange={toggleAll}
                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-blue-600" />
                                Tên loại thuộc tính
                            </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Layers className="h-4 w-4 text-purple-600" />
                                Cấp độ
                            </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-center">
                            Tình trạng
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
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center",
                                                    row.level === 0
                                                        ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10"
                                                        : "bg-gradient-to-r from-purple-600/10 to-blue-600/10",
                                                )}
                                            >
                                                <Tags
                                                    className={cn(
                                                        "h-4 w-4",
                                                        row.level === 0
                                                            ? "text-blue-600"
                                                            : "text-purple-600",
                                                    )}
                                                />
                                            </div>
                                            <span className="font-medium text-slate-800">
                                                {row.name}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-semibold px-3 py-1",
                                            row.level === 0
                                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                                : "bg-purple-100 text-purple-700 border-purple-200",
                                        )}
                                    >
                                        <Layers className="h-3.5 w-3.5 mr-1" />
                                        Cấp {row.level}
                                    </Badge>
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <ChangeStatusSwitch
                                            id={row.id}
                                            checked={row.active}
                                            field="publish"
                                            model="AttributeCatalogue"
                                            modelParent="Attribute"
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
                                                    router.visit(
                                                        route(
                                                            "admin.attribute.catalogue.edit",
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
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={5}
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <Tags className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-lg">
                                        Không tìm thấy dữ liệu
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Thử thay đổi bộ lọc hoặc tìm kiếm với từ
                                        khóa khác
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