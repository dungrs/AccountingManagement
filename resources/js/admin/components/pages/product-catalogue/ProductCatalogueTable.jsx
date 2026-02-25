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
    FolderTree,
    ChevronRight,
    Package,
    FolderOpen,
} from "lucide-react";

import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";
import { router } from "@inertiajs/react";
import { cn } from "@/admin/lib/utils";

export default function ProductCatalogueTable({
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
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 border-r-purple-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium text-center">
                        Đang tải dữ liệu...
                    </p>
                    <p className="text-sm text-slate-400 text-center">
                        Vui lòng chờ trong giây lát
                    </p>
                </div>
            </div>
        );
    }

    // Responsive: Hiển thị dạng card trên mobile
    const renderMobileView = () => {
        return (
            <div className="block lg:hidden space-y-3">
                {data.length > 0 ? (
                    data.map((row) => (
                        <div
                            key={row.id}
                            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedRows.includes(row.id)}
                                        onCheckedChange={() =>
                                            toggleRow(row.id)
                                        }
                                        className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <div
                                        className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center",
                                            row.level === 0
                                                ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10"
                                                : "bg-gradient-to-r from-purple-600/10 to-blue-600/10",
                                        )}
                                    >
                                        {row.level === 0 ? (
                                            <FolderOpen className="h-5 w-5 text-blue-600" />
                                        ) : (
                                            <Package className="h-5 w-5 text-purple-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {row.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs",
                                                    row.level === 0
                                                        ? "bg-blue-100 text-blue-700 border-blue-200"
                                                        : "bg-purple-100 text-purple-700 border-purple-200",
                                                )}
                                            >
                                                Cấp {row.level}
                                            </Badge>
                                            <ChangeStatusSwitch
                                                id={row.id}
                                                checked={row.active}
                                                field="publish"
                                                model="ProductCatalogue"
                                                modelParent="Product"
                                                onSuccess={(res) => {
                                                    onToggleActive?.(
                                                        row.id,
                                                        res.checked,
                                                    );
                                                }}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-md hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-purple-600/10"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-40"
                                    >
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() =>
                                                router.visit(
                                                    route(
                                                        "admin.product.catalogue.edit",
                                                        row.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                                            Sửa
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600"
                                            onClick={() =>
                                                handleDeleteClick(row)
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                            Xóa
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Hiển thị cấu trúc cây nếu có level > 0 */}
                            {row.level > 0 && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 pl-12">
                                    {Array(row.level)
                                        .fill(0)
                                        .map((_, i) => (
                                            <span
                                                key={i}
                                                className="flex items-center"
                                            >
                                                <ChevronRight className="h-3 w-3" />
                                                <span>Cấp {i + 1}</span>
                                            </span>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                        <div className="flex flex-col items-center justify-center px-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                <FolderTree className="h-8 w-8 text-blue-600/50" />
                            </div>
                            <p className="text-slate-600 font-medium text-lg">
                                Không tìm thấy dữ liệu
                            </p>
                            <p className="text-sm text-slate-400 mt-1 text-center">
                                Nhấn nút "Thêm nhóm sản phẩm" để tạo mới
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Desktop view
    const renderDesktopView = () => {
        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 hover:from-blue-600/10 hover:to-purple-600/10">
                        <TableHead className="w-12 hidden sm:table-cell">
                            <Checkbox
                                checked={
                                    selectedRows.length === data.length &&
                                    data.length > 0
                                }
                                onCheckedChange={toggleAll}
                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 min-w-[200px]">
                            <div className="flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="truncate">
                                    Tên nhóm sản phẩm
                                </span>
                            </div>
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-center w-24">
                            Cấp độ
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-center w-28">
                            Trạng thái
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700 text-right w-20">
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
                                <TableCell className="hidden sm:table-cell">
                                    <Checkbox
                                        checked={selectedRows.includes(row.id)}
                                        onCheckedChange={() =>
                                            toggleRow(row.id)
                                        }
                                        className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex items-center text-blue-600 flex-shrink-0">
                                            {row.level > 0 && (
                                                <>
                                                    {Array(row.level - 1)
                                                        .fill(0)
                                                        .map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-4 md:w-6 border-l-2 border-b-2 border-slate-200 h-4 mx-0.5 md:mx-1"
                                                            />
                                                        ))}
                                                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-purple-500 flex-shrink-0" />
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div
                                                className={cn(
                                                    "h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    row.level === 0
                                                        ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10"
                                                        : "bg-gradient-to-r from-purple-600/10 to-blue-600/10",
                                                )}
                                            >
                                                {row.level === 0 ? (
                                                    <FolderOpen className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                                                ) : (
                                                    <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
                                                )}
                                            </div>
                                            <span className="font-medium text-slate-800 truncate text-sm md:text-base">
                                                {row.name}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-semibold px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm whitespace-nowrap",
                                            row.level === 0
                                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                                : "bg-purple-100 text-purple-700 border-purple-200",
                                        )}
                                    >
                                        Cấp {row.level}
                                    </Badge>
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <ChangeStatusSwitch
                                            id={row.id}
                                            checked={row.active}
                                            field="publish"
                                            model="ProductCatalogue"
                                            modelParent="Product"
                                            onSuccess={(res) => {
                                                onToggleActive?.(
                                                    row.id,
                                                    res.checked,
                                                );
                                            }}
                                            className="data-[state=checked]:bg-blue-600 scale-90 md:scale-100"
                                        />
                                    </div>
                                </TableCell>

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-md hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-purple-600/10 hover:text-blue-600 transition-all duration-200 h-8 w-8 md:h-9 md:w-9"
                                            >
                                                <MoreHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="end"
                                            className="dropdown-premium-content rounded-md w-40 md:w-48"
                                        >
                                            <DropdownMenuItem
                                                className="cursor-pointer dropdown-premium-item group text-sm md:text-base"
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            "admin.product.catalogue.edit",
                                                            row.id,
                                                        ),
                                                    )
                                                }
                                            >
                                                <div className="flex items-center w-full">
                                                    <Pencil className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                                    <span className="text-slate-700 group-hover:text-blue-600">
                                                        Chỉnh sửa
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                className="cursor-pointer dropdown-premium-item group text-red-600 hover:text-red-700 text-sm md:text-base"
                                                onClick={() =>
                                                    handleDeleteClick(row)
                                                }
                                            >
                                                <div className="flex items-center w-full">
                                                    <Trash2 className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4 text-red-600 group-hover:scale-110 transition-transform" />
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
                                className="text-center py-12 md:py-16"
                            >
                                <div className="flex flex-col items-center justify-center px-4">
                                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <FolderTree className="h-6 w-6 md:h-8 md:w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium text-base md:text-lg text-center">
                                        Không tìm thấy dữ liệu
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1 text-center">
                                        Nhấn nút "Thêm nhóm sản phẩm" để tạo mới
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
            {/* Mobile view */}
            {renderMobileView()}

            {/* Desktop view - ẩn trên mobile, hiện từ lg trở lên */}
            <div className="hidden lg:block overflow-x-auto">
                {renderDesktopView()}
            </div>
        </div>
    );
}