"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/admin/components/ui/badge";

// Custom hooks
import { useReceiptForm } from "@/admin/hooks/useReceiptForm";
import { useProductVariants } from "@/admin/hooks/useProductVariants";

// Components
import ReceiptGeneralInfo from "@/admin/components/shared/receipts/ReceiptGeneralInfo";
import ProductVariantsTable from "@/admin/components/shared/receipts/ProductVariantsTable";
import AccountingTabs from "@/admin/components/shared/receipts/AccountingTabs";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import PurchaseReceiptPrint from "@/admin/components/shared/print/PurchaseReceiptPrint";

// Utils
import { calculateTotals, getVariantInfo } from "@/admin/utils/receiptUtils";
import { formatCurrency } from "@/admin/utils/helpers";

import {
    Save,
    Printer,
    Download,
    Loader2,
    Package,
    Truck,
    User,
    Calendar,
    FileText,
    DollarSign,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Clock,
    Info,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

// Hàm xuất PDF - giữ nguyên logic nhưng không thay đổi form
const generatePDF = async (element, fileName) => {
    if (!element) {
        throw new Error("Không tìm thấy nội dung cần xuất!");
    }

    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.zIndex = "9999";

    const content = element.cloneNode(true);
    tempContainer.appendChild(content);
    document.body.appendChild(tempContainer);

    try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: (_clonedDoc, clonedElement) => {
                console.log("Cloning for PDF export");
            },
        });

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error("Canvas không hợp lệ");
        }

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        const pdfWidth = 210;
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        if (!imgData || imgData === "data:,") {
            throw new Error("Không thể tạo image từ canvas");
        }

        pdf.addImage(
            imgData,
            "JPEG",
            0,
            0,
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
        );
        pdf.save(fileName);
    } catch (error) {
        console.error("Lỗi khi xuất PDF:", error);
        throw error;
    } finally {
        if (tempContainer && tempContainer.parentNode) {
            document.body.removeChild(tempContainer);
        }
    }
};

export default function PurchaseReceiptForm() {
    const {
        product_variants,
        vat_taxes,
        purchase_receipt,
        suppliers,
        accounting_accounts,
        flash,
        users,
        system_languages,
        errors: serverErrors,
    } = usePage().props;

    useEffect(() => {
        console.log(accounting_accounts);
    }, []);

    const printRef = useRef(null);
    const pdfRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!purchase_receipt;
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // ─── State cho addingRows và editingIndexes ───────────────────────────────
    const [addingRows, setAddingRows] = useState([]);
    const [editingIndexes, setEditingIndexes] = useState([]);

    // Get default VAT tax
    const getDefaultVatTax = () => {
        return (
            vat_taxes?.find((tax) => parseFloat(tax.rate) === 10) ||
            vat_taxes?.[0]
        );
    };

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
        handleChange,
        handleSubmit: baseHandleSubmit,
        handleJournalEntriesChange, // ✅ Giờ hook đã export, dòng này hoạt động
    } = useReceiptForm({
        // ✅ Đổi từ usePu sang useReceiptForm
        receipt: purchase_receipt,
        defaultVatTax: getDefaultVatTax(),
        isEdit,
        type: "purchase",
    });

    // Product variants hook
    const productVariantHandlers = useProductVariants({
        formData,
        setFormData,
        addingRows,
        setAddingRows,
        editingIndexes,
        setEditingIndexes,
        vatTaxes: vat_taxes,
        receipt: purchase_receipt,
    });

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) emit("toast:success", flash.success);
        if (flash?.error) emit("toast:error", flash.error);
    }, [flash, emit]);

    // Handle server errors
    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
            emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
        }
    }, [serverErrors, setErrors, emit]);

    // Submit handler
    const handleSubmit = (e) => {
        if (addingRows.length > 0) {
            e.preventDefault();
            emit(
                "toast:error",
                `Bạn còn ${addingRows.length} sản phẩm chưa được lưu vào phiếu. Vui lòng lưu hoặc hủy trước khi tiếp tục!`,
            );
            return;
        }

        const submitRoute = isEdit
            ? route("admin.receipt.purchase.update", purchase_receipt.id)
            : route("admin.receipt.purchase.store");
        const submitMethod = isEdit ? "put" : "post";

        baseHandleSubmit(e, submitRoute, submitMethod);
    };

    // Xử lý in
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Phieu-nhap-kho-${formData.code || "Moi"}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
        onBeforeGetContent: async () => {
            setIsPrinting(true);
        },
        onAfterPrint: () => {
            setIsPrinting(false);
            emit("toast:success", "Đã gửi lệnh in thành công!");
        },
        onPrintError: (error) => {
            setIsPrinting(false);
            console.error("Print error:", error);
            emit("toast:error", "Có lỗi khi in phiếu!");
        },
    });

    // Xử lý xuất PDF
    const handleExportPDF = async () => {
        if (!pdfRef.current) {
            alert("Không tìm thấy nội dung cần xuất!");
            return;
        }

        setIsExportingPDF(true);
        try {
            await generatePDF(
                pdfRef.current,
                `Phieu-nhap-kho-${formData.code || "Moi"}.pdf`,
            );
            emit("toast:success", "Xuất PDF thành công!");
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            emit("toast:error", "Có lỗi khi xuất PDF! Vui lòng thử lại.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Calculate totals
    const totals = calculateTotals(formData.product_variants || []);

    // Get current supplier
    const currentSupplier = suppliers?.find(
        (s) => s.id === formData.supplier_id,
    );

    // Get current user
    const currentUser = users?.find((u) => u.id === formData.user_id);

    // Kiểm tra có thể in không
    const canPrint = isEdit && purchase_receipt?.status !== "draft";

    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
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
        return statusMap[status] || statusMap.draft;
    };

    const statusBadge = getStatusBadge(formData.status);

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Phiếu nhập hàng",
                    link: route("admin.receipt.purchase.index"),
                },
                {
                    label: isEdit
                        ? `Chỉnh sửa ${formData.code}`
                        : "Thêm phiếu nhập",
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? `Chỉnh sửa ${formData.code}`
                        : "Thêm phiếu nhập hàng"
                }
            />

            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
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

                    <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tổng tiền
                                </p>
                                <p className="text-lg font-bold text-purple-600">
                                    {formatCurrency(totals.totalAfterTax)}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Nhà cung cấp
                                </p>
                                <p className="text-lg font-bold text-green-600 truncate max-w-[150px]">
                                    {currentSupplier?.name || "Chưa chọn"}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
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

                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Package className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {isEdit
                                        ? `Chỉnh sửa phiếu nhập: ${formData.code}`
                                        : "Thêm phiếu nhập mới"}
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

                        {/* Action Buttons */}
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
                                    disabled={isExportingPDF || isPrinting}
                                    className="bg-white/20 text-white hover:bg-white/30 border-0"
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
                </div>

                {/* Quick Info Card */}
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
                                    {formatCurrency(totals.totalVat)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Thông tin chung */}
                    <ReceiptGeneralInfo
                        formData={formData}
                        errors={errors}
                        receiptDate={receiptDate}
                        setReceiptDate={setReceiptDate}
                        openReceiptDate={openReceiptDate}
                        setOpenReceiptDate={setOpenReceiptDate}
                        handleChange={handleChange}
                        setErrors={setErrors}
                        type="purchase"
                        suppliers={suppliers}
                        users={users}
                        isEdit={isEdit}
                    ></ReceiptGeneralInfo>

                    {/* Danh sách sản phẩm */}
                    <ProductVariantsTable
                        formData={formData}
                        addingRows={addingRows}
                        editingIndexes={editingIndexes}
                        productVariants={product_variants}
                        vatTaxes={vat_taxes}
                        setAddingRows={setAddingRows}
                        getVariantInfo={(variantId) =>
                            getVariantInfo(product_variants, variantId)
                        }
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
                        totals={totals}
                    />

                    {/* Hạch toán và Công nợ */}
                    <AccountingTabs
                        formData={formData}
                        setFormData={setFormData}
                        accountingAccounts={accounting_accounts || []}
                        supplierName={currentSupplier?.name || ""}
                        type="purchase"
                        formatCurrency={formatCurrency}
                        createdBy={purchase_receipt?.created_by || ""}
                        receiptDate={formData.receipt_date}
                        addingRows={addingRows}
                        onJournalEntriesChange={handleJournalEntriesChange} // ✅ Dùng từ useReceiptForm
                    />

                    {/* Nút lưu/cập nhật */}
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
                                  ? "Cập nhật phiếu nhập"
                                  : "Lưu phiếu nhập"}
                        </Button>
                    </div>
                </form>

                {/* Hidden Print Component */}
                <div style={{ display: "none" }}>
                    <PurchaseReceiptPrint
                        ref={printRef}
                        receipt={formData}
                        totals={totals}
                        user={currentUser}
                        system_languages={system_languages}
                    />
                </div>

                {/* Hidden PDF Component */}
                <div style={{ display: "none" }}>
                    <PurchaseReceiptPrint
                        ref={pdfRef}
                        receipt={formData}
                        totals={totals}
                        user={currentUser}
                        system_languages={system_languages}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
