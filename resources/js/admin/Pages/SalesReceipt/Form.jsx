"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/admin/components/ui/badge";
import { Label } from "@/admin/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/admin/components/ui/radio-group";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";

import { useReceiptForm } from "@/admin/hooks/useReceiptForm";
import { useProductVariants } from "@/admin/hooks/useProductVariants";

import ReceiptGeneralInfo from "@/admin/components/shared/receipts/ReceiptGeneralInfo";
import ProductVariantsTable from "@/admin/components/shared/receipts/ProductVariantsTable";
import AccountingTabs from "@/admin/components/shared/receipts/AccountingTabs";
import SalesReceiptPrint from "@/admin/components/shared/print/SalesReceiptPrint";
import PriceListSelect from "@/admin/components/pages/sales-receipt/PriceListSelect";

import { calculateTotals, getVariantInfo } from "@/admin/utils/receiptUtils";
import { formatCurrency } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

import {
    Save,
    Printer,
    Download,
    Loader2,
    Package,
    Users,
    User,
    Calendar,
    FileText,
    DollarSign,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Clock,
    ShoppingCart,
    Percent,
} from "lucide-react";

const generatePDF = async (element, fileName) => {
    if (!element) throw new Error("Không tìm thấy nội dung cần xuất!");
    const tempContainer = document.createElement("div");
    tempContainer.style.cssText =
        "position:fixed;left:-9999px;top:0;z-index:9999;";
    tempContainer.appendChild(element.cloneNode(true));
    document.body.appendChild(tempContainer);
    try {
        await new Promise((r) => setTimeout(r, 500));
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: "#ffffff",
        });
        if (!canvas || canvas.width === 0)
            throw new Error("Canvas không hợp lệ");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });
        const pdfWidth = 210;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        if (!imgData || imgData === "data:,")
            throw new Error("Không thể tạo image từ canvas");
        pdf.addImage(
            imgData,
            "JPEG",
            0,
            0,
            pdfWidth,
            imgHeight,
            undefined,
            "FAST",
        );
        pdf.save(fileName);
    } finally {
        if (tempContainer.parentNode) document.body.removeChild(tempContainer);
    }
};

export default function SalesReceiptForm() {
    const {
        product_variants,
        vat_taxes,
        sales_receipt,
        customers,
        price_lists,
        accounting_accounts,
        flash,
        users,
        system_languages,
        errors: serverErrors,
    } = usePage().props;

    const printRef = useRef(null);
    const pdfRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!sales_receipt;
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const getDefaultVatTax = () =>
        vat_taxes?.find((tax) => parseFloat(tax.rate) === 10) || vat_taxes?.[0];

    const {
        formData,
        setFormData,
        errors,
        setErrors,
        isSubmitting,
        receiptDate,
        setReceiptDate,
        openReceiptDate,
        setOpenReceiptDate,
        addingRows,
        setAddingRows,
        editingIndexes,
        setEditingIndexes,
        handleChange,
        handleSubmit: baseHandleSubmit,
        handleJournalEntriesChange,
    } = useReceiptForm({
        receipt: sales_receipt,
        defaultVatTax: getDefaultVatTax(),
        isEdit,
        type: "sale",
    });

    const productVariantHandlers = useProductVariants({
        formData,
        setFormData,
        addingRows,
        setAddingRows,
        editingIndexes,
        setEditingIndexes,
        vatTaxes: vat_taxes,
        receipt: sales_receipt,
    });

    useEffect(() => {
        if (flash?.success) emit("toast:success", flash.success);
        if (flash?.error) emit("toast:error", flash.error);
    }, [flash, emit]);

    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
            emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
        }
    }, [serverErrors, setErrors, emit]);

    const handleSubmit = (e) => {
        if (addingRows.length > 0) {
            e.preventDefault();
            emit(
                "toast:error",
                `Bạn còn ${addingRows.length} sản phẩm chưa lưu. Vui lòng lưu hoặc hủy trước!`,
            );
            return;
        }
        baseHandleSubmit(
            e,
            isEdit
                ? route("admin.receipt.sales.update", sales_receipt.id)
                : route("admin.receipt.sales.store"),
            isEdit ? "put" : "post",
        );
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Phieu-xuat-kho-${formData.code || "Moi"}`,
        pageStyle: `@page{size:A4;margin:10mm;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`,
        onBeforeGetContent: async () => setIsPrinting(true),
        onAfterPrint: () => {
            setIsPrinting(false);
            emit("toast:success", "Đã gửi lệnh in!");
        },
        onPrintError: () => {
            setIsPrinting(false);
            emit("toast:error", "Có lỗi khi in phiếu!");
        },
    });

    const handleExportPDF = async () => {
        if (!pdfRef.current) return;
        setIsExportingPDF(true);
        try {
            await generatePDF(
                pdfRef.current,
                `Phieu-xuat-kho-${formData.code || "Moi"}.pdf`,
            );
            emit("toast:success", "Xuất PDF thành công!");
        } catch {
            emit("toast:error", "Có lỗi khi xuất PDF!");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Xử lý chiết khấu cấp phiếu
    const handleDiscountTypeChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            discount_type: value,
            discount_value: 0,
            discount_amount: 0,
            discount_total: 0,
        }));
    };

    const handleDiscountValueChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setFormData((prev) => {
            const newData = { ...prev, discount_value: value };
            const totalAmount = totals?.totalAmount || 0;
            let discountAmount = 0;

            if (prev.discount_type === "percentage") {
                discountAmount = (totalAmount * value) / 100;
            } else if (prev.discount_type === "fixed") {
                discountAmount = value;
            }

            newData.discount_amount = discountAmount;
            newData.discount_total = discountAmount;
            return newData;
        });
    };

    const totals = calculateTotals(formData.product_variants || []);

    useEffect(() => {
        if (formData.discount_type && formData.discount_value) {
            const totalAmount = totals?.totalAmount || 0;
            let discountAmount = 0;

            if (formData.discount_type === "percentage") {
                discountAmount = (totalAmount * formData.discount_value) / 100;
            } else if (formData.discount_type === "fixed") {
                discountAmount = formData.discount_value;
            }

            setFormData((prev) => ({
                ...prev,
                discount_amount: discountAmount,
                discount_total: discountAmount,
            }));
        }
    }, [totals?.totalAmount, formData.discount_type, formData.discount_value]);

    const currentCustomer = customers?.find(
        (c) => c.id === formData.customer_id,
    );
    const currentPriceList = price_lists?.find(
        (pl) => pl.id === formData.price_list_id,
    );
    const currentUser = users?.find((u) => u.id === formData.user_id);
    const canPrint = isEdit && sales_receipt?.status !== "draft";

    const getVariantInfoBound = (variantId) =>
        getVariantInfo(product_variants, variantId);

    const priceListVariants = Array.isArray(
        formData.price_list_info?.product_variants,
    )
        ? formData.price_list_info.product_variants
        : [];

    const getStatusBadge = (status) => {
        const map = {
            draft: {
                label: "Nháp",
                className: "bg-yellow-100 text-yellow-700 border-yellow-200",
                icon: Clock,
            },
            confirmed: {
                label: "Đã xác nhận",
                className: "bg-green-100 text-green-700 border-green-200",
                icon: CheckCircle2,
            },
            cancelled: {
                label: "Đã hủy",
                className: "bg-red-100 text-red-700 border-red-200",
                icon: XCircle,
            },
        };
        return map[status] || map.draft;
    };
    const statusBadge = getStatusBadge(formData.status);

    const finalTotalAfterDiscount =
        (totals?.totalAmount || 0) - (formData.discount_amount || 0);
    const grandTotalWithDiscount =
        finalTotalAfterDiscount + (totals?.vatAmount || 0);

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Phiếu xuất hàng",
                    link: route("admin.receipt.sales.index"),
                },
                {
                    label: isEdit
                        ? `Chỉnh sửa ${formData.code}`
                        : "Thêm phiếu xuất",
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? `Chỉnh sửa ${formData.code}`
                        : "Thêm phiếu xuất hàng"
                }
            />

            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Mã phiếu
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                    {formData.code || "Chưa có"}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500 shadow-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tổng tiền
                                </p>
                                <p className="text-lg font-bold text-purple-600">
                                    {formatCurrency(grandTotalWithDiscount)}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500 shadow-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Khách hàng
                                </p>
                                <p className="text-lg font-bold text-green-600 truncate max-w-[150px]">
                                    {currentCustomer?.name || "Chưa chọn"}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500 shadow-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Trạng thái
                                </p>
                                <Badge
                                    className={cn(
                                        "mt-1",
                                        statusBadge.className,
                                    )}
                                >
                                    <statusBadge.icon className="h-3 w-3 mr-1" />
                                    {statusBadge.label}
                                </Badge>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Header gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ShoppingCart className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {isEdit
                                        ? `Chỉnh sửa phiếu xuất: ${formData.code}`
                                        : "Thêm phiếu xuất mới"}
                                </h1>
                                <p className="text-white/80 mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {receiptDate
                                        ? receiptDate.toLocaleDateString(
                                              "vi-VN",
                                          )
                                        : "Chưa chọn ngày"}
                                </p>
                            </div>
                        </div>
                        {canPrint && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handlePrint}
                                    className="bg-white/20 text-white hover:bg-white/30 border-0"
                                    disabled={isPrinting || isExportingPDF}
                                >
                                    {isPrinting ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Printer className="w-4 h-4 mr-2" />
                                    )}
                                    {isPrinting ? "Đang in..." : "In phiếu"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleExportPDF}
                                    className="bg-white/20 text-white hover:bg-white/30 border-0"
                                    disabled={isExportingPDF || isPrinting}
                                >
                                    {isExportingPDF ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    {isExportingPDF
                                        ? "Đang xuất..."
                                        : "Xuất PDF"}
                                </Button>
                            </div>
                        )}
                    </div>
                    {currentPriceList && (
                        <div className="mt-3 text-white/80 text-sm flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0">
                                Bảng giá: {currentPriceList.name}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">
                                    Người tạo
                                </p>
                                <p className="font-medium text-slate-700">
                                    {currentUser?.name || "Chưa xác định"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">
                                    Số mặt hàng
                                </p>
                                <p className="font-medium text-slate-700">
                                    {formData.product_variants?.length || 0} sản
                                    phẩm
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">
                                    Tổng VAT
                                </p>
                                <p className="font-medium text-slate-700">
                                    {formatCurrency(totals?.vatAmount || 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Card chiết khấu */}
                <Card className="border-slate-200 shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-600/5 to-red-600/5 border-b border-slate-200 py-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-slate-800">
                            <Percent className="w-4 h-4 text-orange-600" />
                            Chiết khấu theo phiếu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Loại chiết khấu
                                </Label>
                                <RadioGroup
                                    value={formData.discount_type || ""}
                                    onValueChange={handleDiscountTypeChange}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="percentage"
                                            id="percentage"
                                        />
                                        <Label
                                            htmlFor="percentage"
                                            className="text-sm cursor-pointer"
                                        >
                                            Theo %
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="fixed"
                                            id="fixed"
                                        />
                                        <Label
                                            htmlFor="fixed"
                                            className="text-sm cursor-pointer"
                                        >
                                            Số tiền cố định
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    {formData.discount_type === "percentage"
                                        ? "Phần trăm (%)"
                                        : "Số tiền chiết khấu"}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={formData.discount_value || ""}
                                        onChange={handleDiscountValueChange}
                                        placeholder={
                                            formData.discount_type ===
                                            "percentage"
                                                ? "Nhập % chiết khấu"
                                                : "Nhập số tiền"
                                        }
                                        className="pl-8"
                                        min="0"
                                        step={
                                            formData.discount_type ===
                                            "percentage"
                                                ? "1"
                                                : "1000"
                                        }
                                        disabled={!formData.discount_type}
                                    />
                                    {formData.discount_type === "percentage" ? (
                                        <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    ) : (
                                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Tiền chiết khấu
                                </Label>
                                <div className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-right font-medium text-orange-600">
                                    {formatCurrency(
                                        formData.discount_amount || 0,
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Ghi chú chiết khấu
                                </Label>
                                <Input
                                    type="text"
                                    value={formData.discount_note || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            "discount_note",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nhập ghi chú (nếu có)"
                                />
                            </div>
                        </div>

                        {formData.discount_amount > 0 && (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-orange-700 font-medium">
                                        Tổng tiền hàng:
                                    </span>
                                    <span className="text-slate-700">
                                        {formatCurrency(
                                            totals?.totalAmount || 0,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-orange-700 font-medium">
                                        Chiết khấu:
                                    </span>
                                    <span className="text-red-600">
                                        -
                                        {formatCurrency(
                                            formData.discount_amount,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm font-semibold mt-2 pt-2 border-t border-orange-200">
                                    <span className="text-orange-800">
                                        Tổng sau chiết khấu:
                                    </span>
                                    <span className="text-blue-600">
                                        {formatCurrency(
                                            finalTotalAfterDiscount,
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ReceiptGeneralInfo
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        receiptDate={receiptDate}
                        setReceiptDate={setReceiptDate}
                        openReceiptDate={openReceiptDate}
                        setOpenReceiptDate={setOpenReceiptDate}
                        handleChange={handleChange}
                        setErrors={setErrors}
                        type="sales"
                        customers={customers}
                        users={users}
                        isEdit={isEdit}
                    >
                        <PriceListSelect
                            formData={formData}
                            setFormData={setFormData}
                            handleChange={handleChange}
                            priceLists={price_lists}
                            errors={errors}
                            onPriceListChange={(priceListData) => {
                                if (
                                    priceListData?.product_variants &&
                                    typeof productVariantHandlers.updatePricesFromPriceList ===
                                        "function"
                                ) {
                                    productVariantHandlers.updatePricesFromPriceList(
                                        priceListData.product_variants,
                                    );
                                }
                            }}
                        />
                    </ReceiptGeneralInfo>

                    <ProductVariantsTable
                        formData={formData}
                        setFormData={setFormData}
                        addingRows={addingRows}
                        setAddingRows={setAddingRows}
                        editingIndexes={editingIndexes}
                        productVariants={product_variants}
                        vatTaxes={vat_taxes}
                        getVariantInfo={getVariantInfoBound}
                        getVatTaxById={productVariantHandlers.getVatTaxById}
                        getAvailableProductVariantOptions={
                            productVariantHandlers.getAvailableProductVariantOptions
                        }
                        handleUpdateItem={
                            productVariantHandlers.handleUpdateItem
                        }
                        handleEditItem={productVariantHandlers.handleEditItem}
                        handleCancelEditItem={
                            productVariantHandlers.handleCancelEditItem
                        }
                        handleSaveEditItem={
                            productVariantHandlers.handleSaveEditItem
                        }
                        handleDeleteProduct={
                            productVariantHandlers.handleDeleteProduct
                        }
                        handleUpdateAddingRow={
                            productVariantHandlers.handleUpdateAddingRow
                        }
                        handleSaveRow={productVariantHandlers.handleSaveRow}
                        handleCancelAddRow={
                            productVariantHandlers.handleCancelAddRow
                        }
                        handleAddProductRow={
                            productVariantHandlers.handleAddProductRow
                        }
                        formatCurrency={formatCurrency}
                        totals={{
                            ...totals,
                            grandTotal: grandTotalWithDiscount,
                        }}
                        type="sale"
                        priceListVariants={priceListVariants}
                        priceListData={formData.price_list_info}
                    />

                    <AccountingTabs
                        formData={formData}
                        setFormData={setFormData}
                        accountingAccounts={accounting_accounts || []}
                        customerName={currentCustomer?.name || ""}
                        type="sale"
                        formatCurrency={formatCurrency}
                        createdBy={sales_receipt?.created_by || ""}
                        receiptDate={formData.receipt_date}
                        addingRows={addingRows}
                        onJournalEntriesChange={handleJournalEntriesChange}
                    />

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={
                                isSubmitting || isExportingPDF || isPrinting
                            }
                            className="border-slate-200 hover:bg-slate-100"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            size="lg"
                            className="btn-gradient-premium min-w-[200px]"
                            disabled={
                                isSubmitting || isExportingPDF || isPrinting
                            }
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {isSubmitting
                                ? "Đang lưu..."
                                : isEdit
                                  ? "Cập nhật phiếu xuất"
                                  : "Lưu phiếu xuất"}
                        </Button>
                    </div>
                </form>

                <div style={{ display: "none" }}>
                    <SalesReceiptPrint
                        ref={printRef}
                        receipt={{
                            ...formData,
                            discount_info: {
                                discount_type: formData.discount_type,
                                discount_value: formData.discount_value,
                                discount_amount: formData.discount_amount,
                                discount_total: formData.discount_total,
                                discount_note: formData.discount_note,
                            },
                            final_total_after_discount: finalTotalAfterDiscount,
                        }}
                        totals={{
                            ...totals,
                            grandTotal: grandTotalWithDiscount,
                        }}
                        user={currentUser}
                        customer={currentCustomer}
                        system_languages={system_languages}
                    />
                    <SalesReceiptPrint
                        ref={pdfRef}
                        receipt={{
                            ...formData,
                            discount_info: {
                                discount_type: formData.discount_type,
                                discount_value: formData.discount_value,
                                discount_amount: formData.discount_amount,
                                discount_total: formData.discount_total,
                                discount_note: formData.discount_note,
                            },
                            final_total_after_discount: finalTotalAfterDiscount,
                        }}
                        totals={{
                            ...totals,
                            grandTotal: grandTotalWithDiscount,
                        }}
                        user={currentUser}
                        customer={currentCustomer}
                        system_languages={system_languages}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}