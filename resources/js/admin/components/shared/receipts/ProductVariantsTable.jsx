import React, { useMemo, useEffect } from "react";
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
import {
    Plus,
    Trash2,
    Check,
    X,
    Pencil,
    Package,
    DollarSign,
    Percent,
    Tag,
    Calculator,
} from "lucide-react";
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
    setAddingRows,
    setFormData,
    formatCurrency,
    totals,
    type = "purchase",
    priceListVariants = [],
    priceListData = null,
}) {
    // ─── Tính toán tự động khi thay đổi số lượng, đơn giá, VAT ─────────────

    const calculateRowValues = (row) => {
        if (!row) return row;

        const quantity = parseFloat(row.quantity) || 0;
        const price = parseFloat(row.price) || 0;
        const discountAmount = parseFloat(row.discount_amount) || 0;

        // Thành tiền trước VAT = (số lượng × đơn giá) - chiết khấu
        const amount = quantity * price;
        const afterDiscount = amount - discountAmount;

        // Tính VAT
        let vatRate = 0;
        if (row.vat_id) {
            const vatTax = getVatTaxById(row.vat_id);
            vatRate = vatTax?.rate || 0;
        }
        const vatAmount = (afterDiscount * vatRate) / 100;

        // Thành tiền sau VAT = afterDiscount + vatAmount
        const subtotal = afterDiscount + vatAmount;

        return {
            ...row,
            amount: amount,
            after_discount: afterDiscount,
            vat_amount: vatAmount,
            subtotal: subtotal,
        };
    };

    // ─── Cập nhật dòng thêm mới khi có thay đổi ───────────────────────────
    useEffect(() => {
        if (addingRows && addingRows.length > 0) {
            const updatedRows = addingRows.map((row) =>
                calculateRowValues(row),
            );

            // Chỉ update nếu có sự thay đổi để tránh loop
            const hasChanges = updatedRows.some((newRow, index) => {
                const oldRow = addingRows[index];
                return (
                    newRow.amount !== oldRow.amount ||
                    newRow.after_discount !== oldRow.after_discount ||
                    newRow.vat_amount !== oldRow.vat_amount ||
                    newRow.subtotal !== oldRow.subtotal
                );
            });

            if (hasChanges) {
                setAddingRows(updatedRows);
            }
        }
    }, [
        addingRows
            ?.map(
                (r) =>
                    `${r.quantity}-${r.price}-${r.discount_amount}-${r.vat_id}`,
            )
            .join("|"),
    ]);

    // ─── Lấy đơn vị tính ────────────────────────────────────────────────────
    const getUnitDisplay = (item) => {
        const variant = getVariantInfo(item.product_variant_id);
        if (item.unit?.name) return item.unit.name;
        if (item.unit_name) return item.unit_name;
        if (variant?.unit?.name) return variant.unit.name;
        if (variant?.unit_name) return variant.unit_name;
        return "Cái";
    };

    // ─── Format số ──────────────────────────────────────────────────────────
    const formatNumber = (value) => {
        if (!value && value !== 0) return "";
        return new Intl.NumberFormat("vi-VN").format(value);
    };

    // ─── Tìm giá trong bảng giá theo variantId ──────────────────────────────
    const getPriceFromPriceList = (variantId) => {
        if (!Array.isArray(priceListVariants) || !variantId) return null;
        const found = priceListVariants.find(
            (item) => Number(item.product_variant_id) === Number(variantId),
        );
        return found || null;
    };

    // ─── Helper: lấy name/sku từ productVariants ───────────────────────────
    const getVariantMeta = (variantId) => {
        if (!Array.isArray(productVariants) || !variantId) return {};

        const found = productVariants.find(
            (v) =>
                Number(v.product_variant_id ?? v.id ?? v.value) ===
                Number(variantId),
        );

        if (!found) return {};

        return {
            name: found.name ?? found.label ?? null,
            sku: found.sku ?? null,
            unit: found.unit ?? null,
            unit_name: found.unit_name ?? found.unit?.name ?? null,
            base_price: found.base_price ?? null,
        };
    };

    // ─── Xử lý chọn sản phẩm cho dòng ĐANG THÊM ────────────────────────────
    const handleProductSelect = (rowId, variantId) => {
        if (!variantId) {
            setAddingRows((prev) =>
                prev.map((row) =>
                    row.id === rowId
                        ? {
                              ...row,
                              product_variant_id: null,
                              price: 0,
                              vat_id: null,
                          }
                        : row,
                ),
            );
            return;
        }

        const priceInfo =
            type === "sale" ? getPriceFromPriceList(variantId) : null;
        const meta = getVariantMeta(variantId);

        setAddingRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;

                const newRow = {
                    ...row,
                    product_variant_id: variantId,
                    name: meta.name ?? row.name,
                    sku: meta.sku ?? row.sku,
                    unit: meta.unit ?? row.unit,
                    unit_name: meta.unit_name ?? row.unit_name,
                    price: priceInfo?.sale_price
                        ? parseFloat(priceInfo.sale_price)
                        : meta.base_price
                          ? parseFloat(meta.base_price)
                          : row.price || 0,
                    vat_id: priceInfo?.output_tax_id
                        ? Number(priceInfo.output_tax_id)
                        : row.vat_id || null,
                    discount_amount: row.discount_amount || 0,
                };

                return calculateRowValues(newRow);
            }),
        );
    };

    // ─── Xử lý chọn sản phẩm cho dòng ĐANG SỬA ─────────────────────────────
    const handleEditProductSelect = (index, variantId) => {
        if (!variantId) {
            setFormData((prev) => {
                const updated = [...(prev.product_variants || [])];
                if (!updated[index]) return prev;
                updated[index] = {
                    ...updated[index],
                    product_variant_id: null,
                };
                return { ...prev, product_variants: updated };
            });
            return;
        }

        const priceInfo =
            type === "sale" ? getPriceFromPriceList(variantId) : null;
        const meta = getVariantMeta(variantId);

        setFormData((prev) => {
            const updated = [...(prev.product_variants || [])];
            if (!updated[index]) return prev;

            const newRow = {
                ...updated[index],
                product_variant_id: variantId,
                name: meta.name ?? updated[index].name,
                sku: meta.sku ?? updated[index].sku,
                unit: meta.unit ?? updated[index].unit,
                unit_name: meta.unit_name ?? updated[index].unit_name,
                price: priceInfo?.sale_price
                    ? parseFloat(priceInfo.sale_price)
                    : meta.base_price
                      ? parseFloat(meta.base_price)
                      : updated[index].price || 0,
                vat_id: priceInfo?.output_tax_id
                    ? Number(priceInfo.output_tax_id)
                    : updated[index].vat_id || null,
            };

            updated[index] = calculateRowValues(newRow);
            return { ...prev, product_variants: updated };
        });
    };

    // ─── Cập nhật dòng thêm mới ───────────────────────────────────────────
    const handleUpdateAddingRowWithCalc = (rowId, field, value) => {
        setAddingRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                const updatedRow = { ...row, [field]: value };
                return calculateRowValues(updatedRow);
            }),
        );
    };

    // ─── Cập nhật dòng đang sửa ───────────────────────────────────────────
    const handleUpdateItemWithCalc = (index, field, value) => {
        setFormData((prev) => {
            const updated = [...(prev.product_variants || [])];
            if (!updated[index]) return prev;

            const updatedRow = { ...updated[index], [field]: value };
            updated[index] = calculateRowValues(updatedRow);

            return { ...prev, product_variants: updated };
        });
    };

    // ─── Validate dòng ──────────────────────────────────────────────────────
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
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-slate-800">
                        <Package className="w-4 h-4 text-blue-600" />
                        Danh sách sản phẩm
                        {totalItemsCount > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-2">
                                {totalItemsCount} sản phẩm
                            </Badge>
                        )}
                    </CardTitle>

                    {priceListData && type === "sale" && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Đang áp dụng: {priceListData.name}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                            <TableRow>
                                <TableHead className="w-12 text-center text-xs font-semibold text-slate-700">
                                    STT
                                </TableHead>
                                <TableHead className="w-[180px] text-xs font-semibold text-slate-700">
                                    <div className="flex items-center gap-1">
                                        <Package className="h-3 w-3 text-blue-600" />
                                        Sản phẩm
                                    </div>
                                </TableHead>
                                <TableHead className="w-16 text-center text-xs font-semibold text-slate-700">
                                    ĐVT
                                </TableHead>
                                <TableHead className="w-20 text-center text-xs font-semibold text-slate-700">
                                    Số lượng
                                </TableHead>
                                <TableHead className="w-24 text-right text-xs font-semibold text-slate-700">
                                    <div className="flex items-center justify-end gap-1">
                                        <DollarSign className="h-3 w-3 text-green-600" />
                                        Đơn giá
                                    </div>
                                </TableHead>
                                {type === "sale" && priceListData && (
                                    <TableHead className="w-28 text-center text-xs font-semibold text-slate-700">
                                        <div className="flex items-center justify-center gap-1">
                                            <Tag className="h-3 w-3 text-blue-600" />
                                            Giá bảng giá
                                        </div>
                                    </TableHead>
                                )}
                                <TableHead className="w-20 text-right text-xs font-semibold text-slate-700">
                                    <div className="flex items-center justify-end gap-1">
                                        <Calculator className="h-3 w-3 text-blue-600" />
                                        Thành tiền
                                    </div>
                                </TableHead>
                                <TableHead className="w-16 text-center text-xs font-semibold text-slate-700">
                                    <div className="flex items-center justify-center gap-1">
                                        <Percent className="h-3 w-3 text-orange-600" />
                                        VAT
                                    </div>
                                </TableHead>
                                <TableHead className="w-24 text-right text-xs font-semibold text-slate-700">
                                    Tiền VAT
                                </TableHead>
                                <TableHead className="w-24 text-right text-xs font-semibold text-slate-700">
                                    Tổng cộng
                                </TableHead>
                                <TableHead className="w-20 text-center text-xs font-semibold text-slate-700">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* ── Các sản phẩm đã lưu ── */}
                            {formData.product_variants?.map((item, index) => {
                                const variant = getVariantInfo(
                                    item.product_variant_id,
                                );
                                const vatTax = getVatTaxById(item.vat_id);
                                const isEditing =
                                    editingIndexes.includes(index);

                                const priceInfo =
                                    type === "sale"
                                        ? getPriceFromPriceList(
                                              item.product_variant_id,
                                          )
                                        : null;
                                const listPriceDisplay = priceInfo?.sale_price
                                    ? formatCurrency(priceInfo.sale_price)
                                    : null;

                                // Tính toán lại nếu cần
                                const calculatedItem = calculateRowValues(item);

                                const displayName =
                                    variant?.name ||
                                    item?.name ||
                                    `SP #${item.product_variant_id}`;
                                const displaySku = variant?.sku || item?.sku;

                                console.log("Variant:", variant);
                                console.log("Item:", item);
                                console.log(
                                    "Display name from variant:",
                                    variant?.name,
                                );
                                console.log(
                                    "Display name from item:",
                                    item?.name,
                                );

                                return (
                                    <TableRow
                                        key={index}
                                        className={cn(
                                            "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200",
                                            isEditing && "bg-amber-50/50",
                                        )}
                                    >
                                        <TableCell className="text-center text-xs text-slate-500">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell className="max-w-[180px]">
                                            {isEditing ? (
                                                <SelectCombobox
                                                    value={
                                                        item.product_variant_id
                                                    }
                                                    onChange={(value) =>
                                                        handleEditProductSelect(
                                                            index,
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
                                                    <div className="text-sm font-medium text-slate-800 truncate">
                                                        {displayName}
                                                    </div>
                                                    {displaySku && (
                                                        <div className="text-xs text-slate-400 truncate">
                                                            SKU: {displaySku}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center text-sm text-slate-600">
                                            {getUnitDisplay(item)}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleUpdateItemWithCalc(
                                                            index,
                                                            "quantity",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="text-center h-8 text-sm w-16 mx-auto border-slate-200 focus:border-blue-500"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-slate-700">
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
                                                        handleUpdateItemWithCalc(
                                                            index,
                                                            "price",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="text-right h-8 text-sm w-40 ml-auto border-slate-200 focus:border-purple-500"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-green-600">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            )}
                                        </TableCell>

                                        {type === "sale" && priceListData && (
                                            <TableCell className="text-center">
                                                {listPriceDisplay ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="text-xs text-blue-600 cursor-help font-medium">
                                                                    {
                                                                        listPriceDisplay
                                                                    }
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-slate-800 text-white">
                                                                <p className="text-xs">
                                                                    Giá niêm yết
                                                                    từ bảng giá
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                        )}

                                        <TableCell className="text-right font-medium">
                                            <span className="text-sm text-blue-600">
                                                {formatCurrency(
                                                    calculatedItem.amount || 0,
                                                )}
                                            </span>
                                            {calculatedItem.discount_amount >
                                                0 && (
                                                <div className="text-xs text-red-500">
                                                    -
                                                    {formatCurrency(
                                                        calculatedItem.discount_amount,
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <Select
                                                    value={String(
                                                        item.vat_id || "",
                                                    )}
                                                    onValueChange={(value) =>
                                                        handleUpdateItemWithCalc(
                                                            index,
                                                            "vat_id",
                                                            parseInt(value),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-14 mx-auto text-xs border-slate-200">
                                                        <SelectValue placeholder="0%" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="0"
                                                            className="text-xs"
                                                        >
                                                            0%
                                                        </SelectItem>
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
                                                <Badge
                                                    variant="outline"
                                                    className="bg-orange-50 text-orange-700 border-orange-200"
                                                >
                                                    {vatTax?.rate || 0}%
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right text-sm font-medium text-orange-600">
                                            {formatCurrency(
                                                calculatedItem.vat_amount || 0,
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right text-sm font-bold text-blue-600">
                                            {formatCurrency(
                                                calculatedItem.subtotal || 0,
                                            )}
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
                                                            <TooltipContent className="bg-slate-800 text-white">
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
                                                                    className="h-7 w-7 text-slate-600 hover:bg-slate-100"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-slate-800 text-white">
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
                                                            <TooltipContent className="bg-slate-800 text-white">
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
                                                            <TooltipContent className="bg-slate-800 text-white">
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

                            {/* ── Các dòng đang thêm ── */}
                            {addingRows?.map((row) => {
                                const variant = row.product_variant_id
                                    ? getVariantInfo(row.product_variant_id)
                                    : null;
                                const rowErrors = validateRow(row);
                                const hasErrors = rowErrors.length > 0;

                                const priceInfo =
                                    type === "sale" && row.product_variant_id
                                        ? getPriceFromPriceList(
                                              row.product_variant_id,
                                          )
                                        : null;

                                return (
                                    <TableRow
                                        key={row.id}
                                        className="bg-gradient-to-r from-blue-50/30 to-purple-50/30"
                                    >
                                        <TableCell className="text-center text-xs text-blue-500">
                                            <Plus className="w-3 h-3 mx-auto" />
                                        </TableCell>

                                        <TableCell>
                                            <SelectCombobox
                                                value={row.product_variant_id}
                                                onChange={(value) =>
                                                    handleProductSelect(
                                                        row.id,
                                                        value,
                                                    )
                                                }
                                                options={getAvailableProductVariantOptions(
                                                    productVariants,
                                                )}
                                                placeholder="Chọn sản phẩm..."
                                                searchPlaceholder="Tìm kiếm..."
                                                className="w-full"
                                                icon={
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                }
                                            />
                                        </TableCell>

                                        <TableCell className="text-center text-sm text-slate-600">
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
                                                    handleUpdateAddingRowWithCalc(
                                                        row.id,
                                                        "quantity",
                                                        e.target.value,
                                                    )
                                                }
                                                className="text-center h-8 text-sm w-16 mx-auto border-slate-200 focus:border-blue-500"
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
                                                    handleUpdateAddingRowWithCalc(
                                                        row.id,
                                                        "price",
                                                        e.target.value,
                                                    )
                                                }
                                                className="text-right h-8 text-sm w-30 ml-auto border-slate-200 focus:border-purple-500"
                                                min="0"
                                                step="0.01"
                                            />
                                        </TableCell>

                                        {type === "sale" && priceListData && (
                                            <TableCell className="text-center">
                                                {priceInfo ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="text-xs text-blue-600 cursor-help font-medium">
                                                                    {formatCurrency(
                                                                        priceInfo.sale_price,
                                                                    )}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-slate-800 text-white">
                                                                <p className="text-xs">
                                                                    Giá từ bảng
                                                                    giá (đã tự
                                                                    động điền)
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                        )}

                                        <TableCell className="text-right font-medium">
                                            <span className="text-sm text-blue-600">
                                                {formatCurrency(
                                                    row.amount || 0,
                                                )}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <Select
                                                value={String(row.vat_id || "")}
                                                onValueChange={(value) =>
                                                    handleUpdateAddingRowWithCalc(
                                                        row.id,
                                                        "vat_id",
                                                        parseInt(value),
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-14 mx-auto text-xs border-slate-200">
                                                    <SelectValue placeholder="0%" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value="0"
                                                        className="text-xs"
                                                    >
                                                        0%
                                                    </SelectItem>
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

                                        <TableCell className="text-right text-sm font-medium text-orange-600">
                                            {formatCurrency(
                                                row.vat_amount || 0,
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right text-sm font-bold text-blue-600">
                                            {formatCurrency(row.subtotal || 0)}
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
                                                                            ? "opacity-50 cursor-not-allowed text-slate-400"
                                                                            : "text-green-600 hover:bg-green-50",
                                                                    )}
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TooltipTrigger>
                                                        {hasErrors && (
                                                            <TooltipContent className="bg-red-600 text-white">
                                                                <div className="text-xs">
                                                                    {rowErrors.map(
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
                                                                className="h-7 w-7 text-slate-600 hover:bg-slate-100"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-slate-800 text-white">
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

                            {/* ── Empty state ── */}
                            {(!formData.product_variants ||
                                formData.product_variants.length === 0) &&
                                (!addingRows || addingRows.length === 0) && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                type === "sale" && priceListData
                                                    ? 11
                                                    : 10
                                            }
                                            className="text-center py-16"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                                    <Package className="h-8 w-8 text-blue-600/50" />
                                                </div>
                                                <p className="text-slate-600 font-medium text-lg">
                                                    Chưa có sản phẩm nào
                                                </p>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    Nhấn nút "Thêm sản phẩm" để
                                                    thêm vào phiếu
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </div>

                {/* Nút thêm sản phẩm */}
                <div className="mt-4 flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleAddProductRow}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Thêm sản phẩm
                    </Button>

                    {addingRows?.length > 0 && (
                        <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                            Đang thêm {addingRows.length} sản phẩm
                        </Badge>
                    )}
                </div>

                {/* Tổng kết */}
                {((formData.product_variants &&
                    formData.product_variants.length > 0) ||
                    (addingRows && addingRows.length > 0)) && (
                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <div className="flex justify-end">
                            <div className="w-80 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        Tổng tiền hàng:
                                    </span>
                                    <span className="font-medium text-slate-800">
                                        {formatCurrency(
                                            totals?.totalAmount || 0,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        Tổng chiết khấu:
                                    </span>
                                    <span className="font-medium text-red-500">
                                        {formatCurrency(
                                            totals?.totalDiscount || 0,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        Tiền VAT:
                                    </span>
                                    <span className="font-medium text-orange-600">
                                        {formatCurrency(totals?.vatAmount || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-semibold border-t border-slate-200 pt-2">
                                    <span className="text-slate-800">
                                        Tổng thanh toán:
                                    </span>
                                    <span className="text-blue-600 text-lg">
                                        {formatCurrency(
                                            totals?.grandTotal || 0,
                                        )}
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
