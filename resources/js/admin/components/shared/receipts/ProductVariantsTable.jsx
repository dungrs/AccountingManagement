import React, { useMemo } from "react";
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
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Plus, Trash2, Check, X, Pencil, Package } from "lucide-react";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/admin/components/ui/tooltip";
import { cn } from "@/admin/lib/utils";

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
    // Get unit display name with better fallback
    const getUnitDisplay = (item) => {
        const variant = getVariantInfo(item.product_variant_id);

        if (item.unit?.name) return item.unit.name;
        if (item.unit_name) return item.unit_name;
        if (variant?.unit?.name) return variant.unit.name;
        if (variant?.unit_name) return variant.unit_name;
        return "Cái";
    };

    // Format number helper
    const formatNumber = (value) => {
        if (!value && value !== 0) return "";
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    // Validate row data
    const validateRow = (row) => {
        const errors = [];
        if (!row.product_variant_id) errors.push("Chưa chọn sản phẩm");
        if (!row.quantity || parseFloat(row.quantity) <= 0)
            errors.push("Số lượng phải lớn hơn 0");
        if (!row.price || parseFloat(row.price) < 0)
            errors.push("Đơn giá không hợp lệ");
        return errors;
    };

    const canSaveRow = (row) => validateRow(row).length === 0;

    const totalItemsCount = useMemo(
        () => formData.product_variants?.length || 0,
        [formData.product_variants],
    );

    return (
        <Card className="mt-6 border rounded-lg">
            <CardHeader className="border-b bg-gray-50/50 py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Danh sách sản phẩm
                        {totalItemsCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {totalItemsCount} sản phẩm
                            </Badge>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-12 text-center text-xs">
                                    STT
                                </TableHead>
                                <TableHead className="w-[180px] text-xs">
                                    Sản phẩm
                                </TableHead>
                                <TableHead className="w-16 text-center text-xs">
                                    ĐVT
                                </TableHead>
                                <TableHead className="w-20 text-center text-xs">
                                    Số lượng
                                </TableHead>
                                <TableHead className="w-24 text-right text-xs">
                                    Đơn giá
                                </TableHead>
                                <TableHead className="w-16 text-center text-xs">
                                    VAT
                                </TableHead>
                                <TableHead className="w-24 text-right text-xs">
                                    Tiền VAT
                                </TableHead>
                                <TableHead className="w-24 text-right text-xs">
                                    Thành tiền
                                </TableHead>
                                <TableHead className="w-20 text-center text-xs">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Các sản phẩm đã lưu */}
                            {formData.product_variants?.map((item, index) => {
                                const variant = getVariantInfo(
                                    item.product_variant_id,
                                );
                                const vatTax = getVatTaxById(item.vat_id);
                                const isEditing =
                                    editingIndexes.includes(index);

                                return (
                                    <TableRow
                                        key={index}
                                        className={cn(
                                            isEditing && "bg-amber-50/30",
                                        )}
                                    >
                                        <TableCell className="text-center text-xs text-gray-500">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell className="max-w-[180px]">
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
                                                    className="w-full"
                                                />
                                            ) : (
                                                <div className="truncate">
                                                    <div className="text-sm font-medium truncate">
                                                        {variant?.name ||
                                                            `SP #${item.product_variant_id}`}
                                                    </div>
                                                    {variant?.sku && (
                                                        <div className="text-xs text-gray-400 truncate">
                                                            SKU: {variant.sku}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center text-sm">
                                            {getUnitDisplay(item)}
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
                                                    className="text-center h-8 text-sm w-16 mx-auto"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="text-sm">
                                                    {formatNumber(
                                                        item.quantity,
                                                    )}
                                                </span>
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
                                                    className="text-right h-8 text-sm w-20 ml-auto"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="text-sm">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
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
                                                    <SelectTrigger className="h-8 w-14 mx-auto text-xs">
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
                                                                    className="text-xs"
                                                                >
                                                                    {tax.rate}%
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className="text-xs text-gray-600">
                                                    {vatTax?.rate || 0}%
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right text-sm text-orange-600">
                                            {formatCurrency(
                                                item.vat_amount || 0,
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right text-sm font-medium text-blue-600">
                                            {formatCurrency(item.subtotal)}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleSaveEditItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-7 w-7 text-green-600 hover:bg-green-50"
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    Lưu
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleCancelEditItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-7 w-7 hover:bg-gray-100"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    Hủy
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleEditItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    Sửa
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleDeleteProduct(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-7 w-7 text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    Xóa
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {/* Các dòng đang thêm */}
                            {addingRows?.map((row) => {
                                const variant = row.product_variant_id
                                    ? getVariantInfo(row.product_variant_id)
                                    : null;
                                const errors = validateRow(row);
                                const hasErrors = errors.length > 0;

                                return (
                                    <TableRow
                                        key={row.id}
                                        className="bg-blue-50/20"
                                    >
                                        <TableCell className="text-center text-xs text-gray-400">
                                            <Plus className="w-3 h-3 mx-auto" />
                                        </TableCell>

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
                                                className="w-full"
                                            />
                                        </TableCell>

                                        <TableCell className="text-center text-sm">
                                            {variant?.unit?.name ||
                                                variant?.unit_name ||
                                                ""}
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
                                                className="text-center h-8 text-sm w-16 mx-auto"
                                                min="0"
                                                step="0.01"
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
                                                className="text-right h-8 text-sm w-20 ml-auto"
                                                min="0"
                                                step="0.01"
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
                                                <SelectTrigger className="h-8 w-14 mx-auto text-xs">
                                                    <SelectValue placeholder="VAT" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vatTaxes?.map((tax) => (
                                                        <SelectItem
                                                            key={tax.id}
                                                            value={String(
                                                                tax.id,
                                                            )}
                                                            className="text-xs"
                                                        >
                                                            {tax.rate}%
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        <TableCell className="text-right text-sm text-orange-600">
                                            {row.vat_amount
                                                ? formatCurrency(row.vat_amount)
                                                : "-"}
                                        </TableCell>

                                        <TableCell className="text-right text-sm font-medium text-blue-600">
                                            {row.subtotal
                                                ? formatCurrency(row.subtotal)
                                                : "-"}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleSaveRow(
                                                                            row.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        hasErrors
                                                                    }
                                                                    className={cn(
                                                                        "h-7 w-7",
                                                                        hasErrors
                                                                            ? "opacity-50 cursor-not-allowed"
                                                                            : "text-green-600 hover:bg-green-50",
                                                                    )}
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TooltipTrigger>
                                                        {hasErrors && (
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    {errors.map(
                                                                        (
                                                                            err,
                                                                            idx,
                                                                        ) => (
                                                                            <p
                                                                                key={
                                                                                    idx
                                                                                }
                                                                            >
                                                                                •{" "}
                                                                                {
                                                                                    err
                                                                                }
                                                                            </p>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleCancelAddRow(
                                                                        row.id,
                                                                    )
                                                                }
                                                                className="h-7 w-7 hover:bg-gray-100"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs">
                                                                Hủy
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {(!formData.product_variants || formData.product_variants.length === 0) &&
                                (!addingRows || addingRows.length === 0) && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center py-12"
                                        >
                                            <div className="text-gray-400">
                                                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">
                                                    Chưa có sản phẩm nào
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </div>

                {/* Nút thêm sản phẩm ở dưới bảng */}
                <div className="mt-4 flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleAddProductRow}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Thêm sản phẩm
                    </Button>

                    {addingRows?.length > 0 && (
                        <span className="text-xs text-gray-500">
                            Đang thêm {addingRows.length} sản phẩm
                        </span>
                    )}
                </div>

                {/* Phần Tổng kết đơn giản */}
                {((formData.product_variants && formData.product_variants.length > 0) ||
                    (addingRows && addingRows.length > 0)) && (
                    <div className="mt-6 border-t pt-4">
                        <div className="flex justify-end">
                            <div className="w-80 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tổng tiền hàng:
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(totals?.totalAmount || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tiền VAT:
                                    </span>
                                    <span className="text-orange-600">
                                        {formatCurrency(totals?.vatAmount || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-semibold border-t pt-2">
                                    <span>Tổng thanh toán:</span>
                                    <span className="text-blue-600">
                                        {formatCurrency(totals?.grandTotal || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}