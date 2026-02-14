import React from "react";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Badge } from "@/admin/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Plus, Trash2, Check, Ban, Pencil } from "lucide-react";
import SelectCombobox from "@/admin/components/ui/select-combobox";

export default function ProductVariantsTable({
    formData,
    addingRows,
    editingIndexes,
    productVariants,
    vatTaxes,
    getVariantInfo,
    getVatTaxById,
    getAvailableProductVariantOptions,
    handleUpdateItem,
    handleEditItem,
    handleCancelEditItem,
    handleSaveEditItem,
    handleDeleteProduct,
    handleUpdateAddingRow,
    handleSaveRow,
    handleCancelAddRow,
    handleAddProductRow,
    formatCurrency,
    totals,
}) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
                <CardDescription>Quản lý sản phẩm trong phiếu</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="min-w-[250px]">
                                    Sản phẩm
                                </TableHead>
                                <TableHead className="w-[120px] text-center">
                                    Số lượng
                                </TableHead>
                                <TableHead className="w-[150px] text-right">
                                    Đơn giá
                                </TableHead>
                                <TableHead className="w-[150px]">VAT</TableHead>
                                <TableHead className="w-[150px] text-right">
                                    Tiền VAT
                                </TableHead>
                                <TableHead className="w-[150px] text-right">
                                    Thành tiền
                                </TableHead>
                                <TableHead className="w-[100px] text-center">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Các sản phẩm đã lưu */}
                            {formData.product_variants.map((item, index) => {
                                const variant = getVariantInfo(
                                    item.product_variant_id,
                                );
                                const vatTax = getVatTaxById(item.vat_id);
                                const isEditing =
                                    editingIndexes.includes(index);

                                return (
                                    <TableRow
                                        key={index}
                                        className={
                                            isEditing ? "bg-amber-50/50" : ""
                                        }
                                    >
                                        <TableCell>
                                            {isEditing ? (
                                                <SelectCombobox
                                                    value={
                                                        item.product_variant_id
                                                    }
                                                    onChange={(value) =>
                                                        handleUpdateItem(
                                                            index,
                                                            "product_variant_id",
                                                            value,
                                                        )
                                                    }
                                                    options={getAvailableProductVariantOptions(
                                                        productVariants,
                                                        item.product_variant_id,
                                                    )}
                                                    placeholder="Chọn sản phẩm..."
                                                    searchPlaceholder="Tìm kiếm..."
                                                />
                                            ) : (
                                                variant?.name ||
                                                `Sản phẩm #${item.product_variant_id}`
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleUpdateItem(
                                                            index,
                                                            "quantity",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="text-center"
                                                />
                                            ) : (
                                                item.quantity
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) =>
                                                        handleUpdateItem(
                                                            index,
                                                            "price",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="text-right"
                                                />
                                            ) : (
                                                <span className="font-medium">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Select
                                                    value={String(item.vat_id)}
                                                    onValueChange={(value) =>
                                                        handleUpdateItem(
                                                            index,
                                                            "vat_id",
                                                            parseInt(value),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {vatTaxes?.map(
                                                            (tax) => (
                                                                <SelectItem
                                                                    key={tax.id}
                                                                    value={String(
                                                                        tax.id,
                                                                    )}
                                                                >
                                                                    {tax.name} (
                                                                    {tax.rate}%)
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {vatTax?.code || "N/A"}
                                                    </Badge>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                item.vat_amount || 0,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(item.subtotal)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleSaveEditItem(
                                                                index,
                                                            )
                                                        }
                                                        className="h-8 w-8 text-green-600"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleCancelEditItem(
                                                                index,
                                                            )
                                                        }
                                                        className="h-8 w-8"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleEditItem(
                                                                index,
                                                            )
                                                        }
                                                        className="h-8 w-8 text-blue-600"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDeleteProduct(
                                                                index,
                                                            )
                                                        }
                                                        className="h-8 w-8 text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {/* Các dòng đang thêm */}
                            {addingRows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="bg-blue-50/50"
                                >
                                    <TableCell>
                                        <SelectCombobox
                                            value={row.product_variant_id}
                                            onChange={(value) =>
                                                handleUpdateAddingRow(
                                                    row.id,
                                                    "product_variant_id",
                                                    value,
                                                )
                                            }
                                            options={getAvailableProductVariantOptions(
                                                productVariants,
                                            )}
                                            placeholder="Chọn sản phẩm..."
                                            searchPlaceholder="Tìm kiếm..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="SL"
                                            value={row.quantity}
                                            onChange={(e) =>
                                                handleUpdateAddingRow(
                                                    row.id,
                                                    "quantity",
                                                    e.target.value,
                                                )
                                            }
                                            className="text-center"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="Đơn giá"
                                            value={row.price}
                                            onChange={(e) =>
                                                handleUpdateAddingRow(
                                                    row.id,
                                                    "price",
                                                    e.target.value,
                                                )
                                            }
                                            className="text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={String(row.vat_id)}
                                            onValueChange={(value) =>
                                                handleUpdateAddingRow(
                                                    row.id,
                                                    "vat_id",
                                                    parseInt(value),
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vatTaxes?.map((tax) => (
                                                    <SelectItem
                                                        key={tax.id}
                                                        value={String(tax.id)}
                                                    >
                                                        {tax.name} ({tax.rate}%)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {row.vat_amount
                                            ? formatCurrency(row.vat_amount)
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {row.subtotal
                                            ? formatCurrency(row.subtotal)
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleSaveRow(row.id)
                                                }
                                                disabled={
                                                    !row.product_variant_id ||
                                                    !row.quantity ||
                                                    !row.price
                                                }
                                                className="h-8 w-8 text-green-600"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleCancelAddRow(row.id)
                                                }
                                                className="h-8 w-8"
                                            >
                                                <Ban className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {formData.product_variants.length === 0 &&
                                addingRows.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Chưa có sản phẩm nào. Nhấn "Thêm sản
                                            phẩm" để bắt đầu.
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </div>

                {/* Phần Tổng kết và nút Thêm sản phẩm */}
                <div className="mt-4 flex items-start justify-between gap-6">
                    <div>
                        <Button
                            type="button"
                            onClick={handleAddProductRow}
                            variant="outline"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm sản phẩm
                        </Button>
                    </div>

                    {/* Tổng kết - nằm bên phải */}
                    <div className="bg-gray-50 rounded-lg p-4 min-w-[320px]">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Tổng kết
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">
                                    Tổng tiền hàng
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                    {formatCurrency(totals.totalAmount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">
                                    VAT
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                    {formatCurrency(totals.vatAmount)}
                                </span>
                            </div>
                            <div className="border-t border-gray-300 pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">
                                        Tổng thanh toán
                                    </span>
                                    <span className="text-lg font-semibold text-blue-600">
                                        {formatCurrency(totals.grandTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
