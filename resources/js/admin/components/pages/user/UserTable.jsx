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

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/admin/components/ui/avatar";

import { Badge } from "@/admin/components/ui/badge";

import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Mail,
    Phone,
    MapPin,
    UserCog,
    Crown,
    Shield,
    Star,
    Users,
} from "lucide-react";

import { getInitials } from "@/admin/utils/helpers";
import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";
import { cn } from "@/admin/lib/utils";

export default function UserTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleEdit,
    handleDeleteClick,
    onToggleActive,
}) {
    // Hàm lấy màu sắc cho nhóm thành viên
    const getCatalogueBadge = (catalogueName) => {
        if (!catalogueName) return "bg-slate-100 text-slate-700";

        const name = catalogueName.toLowerCase();
        if (name.includes("admin") || name.includes("quản trị")) {
            return "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-200";
        }
        if (name.includes("manager") || name.includes("quản lý")) {
            return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-200";
        }
        if (name.includes("staff") || name.includes("nhân viên")) {
            return "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-200";
        }
        if (name.includes("customer") || name.includes("khách")) {
            return "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-amber-200";
        }
        return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-200";
    };

    // Icon cho nhóm thành viên
    const getCatalogueIcon = (catalogueName) => {
        if (!catalogueName) return <UserCog className="h-3 w-3" />;

        const name = catalogueName.toLowerCase();
        if (name.includes("admin") || name.includes("quản trị")) {
            return <Crown className="h-3 w-3" />;
        }
        if (name.includes("manager") || name.includes("quản lý")) {
            return <Star className="h-3 w-3" />;
        }
        if (name.includes("staff") || name.includes("nhân viên")) {
            return <Shield className="h-3 w-3" />;
        }
        return <UserCog className="h-3 w-3" />;
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
                                    data.length > 0 &&
                                    selectedRows.length === data.length
                                }
                                onCheckedChange={toggleAll}
                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </TableHead>

                        <TableHead className="font-semibold text-slate-700">
                            Họ và tên
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                            Thông tin liên hệ
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-center">
                            Nhóm thành viên
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
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-white ring-blue-200">
                                            <AvatarImage
                                                src={row.avatar || ""}
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
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {row.email || "Chưa có email"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="space-y-1">
                                        {row.phone ? (
                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                <Phone className="h-3.5 w-3.5 text-blue-500" />
                                                {row.phone}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm text-slate-400">
                                                <Phone className="h-3.5 w-3.5" />
                                                Chưa có SĐT
                                            </div>
                                        )}

                                        {row.address ? (
                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-purple-500" />
                                                <span className="truncate max-w-[200px]">
                                                    {row.address}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm text-slate-400">
                                                <MapPin className="h-3.5 w-3.5" />
                                                Chưa có địa chỉ
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    {row.user_catalogue_name ? (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-medium px-3 py-1 gap-1",
                                                getCatalogueBadge(
                                                    row.user_catalogue_name,
                                                ),
                                            )}
                                        >
                                            {getCatalogueIcon(
                                                row.user_catalogue_name,
                                            )}
                                            {row.user_catalogue_name}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-slate-100 text-slate-500 font-medium"
                                        >
                                            Chưa phân nhóm
                                        </Badge>
                                    )}
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <ChangeStatusSwitch
                                            id={row.id}
                                            checked={row.active}
                                            field="publish"
                                            model="User"
                                            modelParent="User"
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
                                colSpan={6}
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-blue-600/50" />
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