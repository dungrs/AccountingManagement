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

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import ChangeStatusSwitch from "../common/ChangeStatusSwitch";
import { useEffect } from "react";

// Hàm lấy chữ cái đầu viết hoa (VD: "Nguyễn Văn A" => "NA")
const getInitials = (name = "") => {
    const words = name.trim().split(" ").filter(Boolean);

    if (words.length === 0) return "U";
    if (words.length === 1) return words[0][0].toUpperCase();

    return (
        words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
    );
};

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
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40">
                        <TableHead className="w-12">
                            <Checkbox
                                checked={
                                    data.length > 0 &&
                                    selectedRows.length === data.length
                                }
                                onCheckedChange={toggleAll}
                            />
                        </TableHead>

                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Số điện thoại</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Địa chỉ</TableHead>
                        <TableHead className="text-center">
                            Nhóm thành viên
                        </TableHead>
                        <TableHead className="text-center">Tình trạng</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground py-10"
                            >
                                Đang tải dữ liệu...
                            </TableCell>
                        </TableRow>
                    ) : data.length > 0 ? (
                        data.map((row) => (
                            <TableRow
                                key={row.id}
                                className="hover:bg-muted/30 transition"
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedRows.includes(row.id)}
                                        onCheckedChange={() => toggleRow(row.id)}
                                    />
                                </TableCell>

                                {/* Họ tên + Avatar */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={row.avatar || ""}
                                                alt={row.name}
                                            />
                                            <AvatarFallback>
                                                {getInitials(row.name)}
                                            </AvatarFallback>
                                        </Avatar>


                                        <div className="flex flex-col">
                                            <span className="font-medium leading-tight">
                                                {row.name}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>{row.phone || "-"}</TableCell>

                                <TableCell className="text-muted-foreground">
                                    {row.email || "-"}
                                </TableCell>

                                <TableCell className="text-muted-foreground">
                                    {row.address || "-"}
                                </TableCell>

                                <TableCell className="text-center font-semibold">
                                    {row.user_catalogue_name || "-"}
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
                                                onToggleActive?.(row.id, res.checked);
                                            }}
                                        />
                                    </div>
                                </TableCell>

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
                                                onClick={() => handleEdit(row)}
                                            >
                                                <Pencil className="mr-2 h-4 w-4 text-yellow-600" />
                                                Chỉnh sửa
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                className="cursor-pointer text-red-600"
                                                onClick={() => handleDeleteClick(row)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Xóa
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