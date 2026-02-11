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
import { router } from "@inertiajs/react";

export default function SupplierTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
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
                        <TableHead>Tên NCC</TableHead>
                        <TableHead>Mã số thuế</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Điện thoại</TableHead>
                        <TableHead>Địa chỉ</TableHead>
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

                                <TableCell className="font-medium">
                                    {row.name}
                                </TableCell>

                                <TableCell>
                                    {row.tax_code}
                                </TableCell>

                                <TableCell>
                                    {row.email}
                                </TableCell>

                                <TableCell>
                                    {row.phone}
                                </TableCell>

                                <TableCell className="max-w-[200px] truncate">
                                    {row.address}
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <ChangeStatusSwitch
                                            id={row.id}
                                            checked={row.active}
                                            field="publish"
                                            model="Supplier"
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
                                                            "admin.supplier.edit",
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