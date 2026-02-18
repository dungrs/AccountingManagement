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
    PackagePlus,
    AlertTriangle,
    Package
} from "lucide-react";
import ChangeStatusSwitch from "../../shared/common/ChangeStatusSwitch";

export default function InventoryTable({
    data = [],
    loading = false,
    selectedRows = [],
    toggleAll,
    toggleRow,
    handleEdit,
    handleAdjustStock,
    handleDeleteClick,
    onToggleActive,
}) {
    
    const getStockStatusBadge = (status, quantity) => {
        if (quantity <= 0) {
            return <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Hết hàng
            </Badge>;
        }
        if (quantity < 10) {
            return <Badge variant="warning" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Sắp hết ({quantity})
            </Badge>;
        }
        return <Badge variant="success" className="bg-green-100 text-green-800 flex items-center gap-1">
            <Package className="h-3 w-3" /> Còn hàng ({quantity})
        </Badge>;
    };

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

                        <TableHead>Mã SKU</TableHead>
                        <TableHead>Mã Barcode</TableHead>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="text-center">Đơn vị</TableHead>
                        <TableHead className="text-center">Số lượng tồn</TableHead>
                        <TableHead className="text-center">Trạng thái tồn kho</TableHead>
                        <TableHead className="text-center">Kinh doanh</TableHead>
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
                        data.map((row) => (
                            <TableRow
                                key={row.id}
                                className="hover:bg-muted/30 transition"
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedRows.includes(row.id)}
                                        onCheckedChange={() =>
                                            toggleRow(row.id)
                                        }
                                    />
                                </TableCell>

                                <TableCell className="text-sm">
                                    {row.sku || "—"}
                                </TableCell>

                                <TableCell className="text-sm">
                                    {row.barcode || "—"}
                                </TableCell>

                                <TableCell className="font-medium">
                                    {row.name}
                                </TableCell>

                                <TableCell className="text-center">
                                    {row.unit_name}
                                </TableCell>

                                <TableCell className="text-center font-semibold">
                                    <span className={row.quantity <= 0 ? "text-red-600" : row.quantity < 10 ? "text-yellow-600" : "text-green-600"}>
                                        {row.quantity}
                                    </span>
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        {getStockStatusBadge(row.stock_status, row.quantity)}
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <ChangeStatusSwitch
                                            id={row.id}
                                            checked={row.active}
                                            field="publish"
                                            model="Inventory"
                                            modelParent="Product"
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
                                                onClick={() => handleAdjustStock(row)}
                                            >
                                                <PackagePlus className="mr-1 h-4 w-4 text-blue-600" />
                                                Điều chỉnh tồn kho
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
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