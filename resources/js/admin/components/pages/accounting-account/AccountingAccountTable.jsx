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

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";

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

                        <TableHead>Mã TK</TableHead>
                        <TableHead>Tên tài khoản</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Số dư</TableHead>
                        <TableHead className="text-center">
                            Trạng thái
                        </TableHead>
                        <TableHead className="text-right">
                            Thao tác
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
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
                                {/* Checkbox */}
                                <TableCell>
                                    <Checkbox
                                        checked={selectedRows.includes(row.id)}
                                        onCheckedChange={() =>
                                            toggleRow(row.id)
                                        }
                                    />
                                </TableCell>

                                {/* Code */}
                                <TableCell className="">
                                    {row.account_code}
                                </TableCell>

                                {/* Name + level */}
                                <TableCell className="font-medium">
                                    <span>
                                        {"|----".repeat(
                                            row.level > 0
                                                ? row.level - 1
                                                : 0,
                                        )}
                                        {row.name}
                                    </span>
                                </TableCell>

                                {/* Account type */}
                                <TableCell>
                                    {row.account_type}
                                </TableCell>

                                {/* Normal balance */}
                                <TableCell>
                                    {row.normal_balance === "debit"
                                        ? "Nợ"
                                        : "Có"}
                                </TableCell>

                                {/* Publish */}
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
                                        />
                                    </div>
                                </TableCell>

                                {/* Actions */}
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
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground py-10"
                            >
                                Không có tài khoản kế toán nào.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}