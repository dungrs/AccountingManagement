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
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Plus, Trash2, Check, Ban, Pencil, AlertCircle } from "lucide-react";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/admin/components/ui/tooltip";

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
        
        // Priority order:
        // 1. unit object from item
        if (item.unit?.name) return item.unit.name;
        
        // 2. unit_name from item
        if (item.unit_name) return item.unit_name;
        
        // 3. unit from variant info
        if (variant?.unit?.name) return variant.unit.name;
        if (variant?.unit_name) return variant.unit_name;
        
        // 4. Default
        return "Cái";
    };

    // Validate row data
    const validateRow = (row) => {
        const errors = [];
        
        if (!row.product_variant_id) {
            errors.push("Chưa chọn sản phẩm");
        }
        
        if (!row.quantity || parseFloat(row.quantity) <= 0) {
            errors.push("Số lượng phải lớn hơn 0");
        }
        
        if (!row.price || parseFloat(row.price) < 0) {
            errors.push("Đơn giá không hợp lệ");
        }
        
        return errors;
    };

    // Check if a row can be saved
    const canSaveRow = (row) => {
        return validateRow(row).length === 0;
    };

    // Calculate total items count
    const totalItemsCount = useMemo(() => {
        return formData.product_variants.length;
    }, [formData.product_variants]);

    // Calculate total quantity
    const totalQuantity = useMemo(() => {
        return formData.product_variants.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity) || 0);
        }, 0);
    }, [formData.product_variants]);

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Danh sách sản phẩm</CardTitle>
                        <CardDescription>
                            Quản lý sản phẩm trong phiếu
                            {totalItemsCount > 0 && (
                                <span className="ml-2 text-blue-600 font-medium">
                                    ({totalItemsCount} sản phẩm, tổng SL: {formatCurrency(totalQuantity)})
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        onClick={handleAddProductRow}
                        variant="default"
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm sản phẩm
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-[50px] text-center">
                                    STT
                                </TableHead>
                                <TableHead className="min-w-[250px]">
                                    Sản phẩm
                                </TableHead>
                                <TableHead className="w-[100px] text-center">
                                    Đơn vị
                                </TableHead>
                                <TableHead className="w-[120px] text-center">
                                    Số lượng
                                </TableHead>
                                <TableHead className="w-[150px] text-right">
                                    Đơn giá
                                </TableHead>
                                <TableHead className="w-[130px] text-center">
                                    VAT
                                </TableHead>
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
                                        <TableCell className="text-center font-medium text-gray-500">
                                            {index + 1}
                                        </TableCell>
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
                                                <div>
                                                    <div className="font-medium">
                                                        {variant?.name ||
                                                            `Sản phẩm #${item.product_variant_id}`}
                                                    </div>
                                                    {variant?.sku && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            SKU: {variant.sku}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-normal">
                                                {getUnitDisplay(item)}
                                            </Badge>
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
                                                    min="0"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="font-medium">
                                                    {formatCurrency(item.quantity)}
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
                                                    className="text-right"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="font-medium">
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
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {vatTax?.code || "N/A"} ({vatTax?.rate || 0}%)
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-orange-600">
                                                {formatCurrency(
                                                    item.vat_amount || 0,
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-blue-600">
                                            {formatCurrency(item.subtotal)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleSaveEditItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Lưu thay đổi</p>
                                                            </TooltipContent>
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
                                                                        handleCancelEditItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 hover:bg-gray-100"
                                                                >
                                                                    <Ban className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Hủy chỉnh sửa</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleEditItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Chỉnh sửa</p>
                                                            </TooltipContent>
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
                                                                        handleDeleteProduct(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Xóa</p>
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
                            {addingRows.map((row) => {
                                const variant = row.product_variant_id
                                    ? getVariantInfo(row.product_variant_id)
                                    : null;
                                const errors = validateRow(row);
                                const hasErrors = errors.length > 0;

                                return (
                                    <TableRow
                                        key={row.id}
                                        className="bg-blue-50/50 border-l-4 border-blue-400"
                                    >
                                        <TableCell className="text-center text-gray-400">
                                            *
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
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {variant && (
                                                <Badge variant="outline" className="font-normal">
                                                    {variant.unit?.name || variant.unit_name || "Cái"}
                                                </Badge>
                                            )}
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
                                                className="text-right"
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
                                        <TableCell className="text-right font-medium text-orange-600">
                                            {row.vat_amount
                                                ? formatCurrency(row.vat_amount)
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-blue-600">
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
                                                                        handleSaveRow(row.id)
                                                                    }
                                                                    disabled={hasErrors}
                                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {hasErrors ? (
                                                                <div>
                                                                    <p className="font-semibold mb-1">Không thể lưu:</p>
                                                                    {errors.map((err, idx) => (
                                                                        <p key={idx} className="text-xs">• {err}</p>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p>Lưu sản phẩm</p>
                                                            )}
                                                        </TooltipContent>
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
                                                                    handleCancelAddRow(row.id)
                                                                }
                                                                className="h-8 w-8 hover:bg-gray-100"
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Hủy thêm</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {formData.product_variants.length === 0 &&
                                addingRows.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center py-12"
                                        >
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <AlertCircle className="w-12 h-12 mb-3 text-gray-300" />
                                                <p className="text-base font-medium mb-1">
                                                    Chưa có sản phẩm nào
                                                </p>
                                                <p className="text-sm">
                                                    Nhấn "Thêm sản phẩm" để bắt đầu
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </div>

                {/* Phần Tổng kết */}
                {(formData.product_variants.length > 0 || addingRows.length > 0) && (
                    <div className="mt-6 flex justify-end">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 min-w-[380px] border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-4 text-base border-b pb-2">
                                Tổng kết đơn hàng
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
                                        Tiền VAT
                                    </span>
                                    <span className="text-sm font-medium text-orange-600">
                                        {formatCurrency(totals.vatAmount)}
                                    </span>
                                </div>
                                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-900">
                                            Tổng thanh toán
                                        </span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {formatCurrency(totals.grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}