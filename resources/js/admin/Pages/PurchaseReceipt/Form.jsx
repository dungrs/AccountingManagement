"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Custom hooks
import { useReceiptForm } from "@/admin/hooks/useReceiptForm";
import { useProductVariants } from "@/admin/hooks/useProductVariants";

// Components
import ReceiptHeader from "@/admin/components/shared/receipts/ReceiptHeader";
import ReceiptGeneralInfo from "@/admin/components/shared/receipts/ReceiptGeneralInfo";
import ProductVariantsTable from "@/admin/components/shared/receipts/ProductVariantsTable";
import AccountingTabs from "@/admin/components/shared/receipts/AccountingTabs";
import { Button } from "@/admin/components/ui/button";
import PurchaseReceiptPrint from "@/admin/components/shared/print/PurchaseReceiptPrint";

// Utils
import { calculateTotals, getVariantInfo } from "@/admin/utils/receiptUtils";
import { formatCurrency, formatNumber } from "@/admin/utils/helpers";

import { Save, Printer, Download, Loader2 } from "lucide-react";

// Hàm xuất PDF - giữ nguyên logic nhưng không thay đổi form
const generatePDF = async (element, fileName) => {
    if (!element) {
        throw new Error("Không tìm thấy nội dung cần xuất!");
    }

    // Tạo một container tạm thời để capture - KHÔNG làm thay đổi form gốc
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.zIndex = "9999";

    // Clone nội dung từ element gốc - giữ nguyên style
    const content = element.cloneNode(true);
    tempContainer.appendChild(content);
    document.body.appendChild(tempContainer);

    try {
        // Đợi render
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Tạo canvas với chất lượng cao
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: (_clonedDoc, clonedElement) => {
                // KHÔNG thay đổi bất kỳ style nào, giữ nguyên form mẫu
                console.log("Cloning for PDF export");
            },
        });

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error("Canvas không hợp lệ");
        }

        // Sử dụng kích thước A4 dọc như form mẫu
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        const pdfWidth = 210; // mm
        const pdfHeight = 297; // mm
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
        // Xóa container tạm thời
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

    // Get default VAT tax
    const getDefaultVatTax = () => {
        return (
            vat_taxes?.find((tax) => parseFloat(tax.rate) === 10) ||
            vat_taxes?.[0]
        );
    };

    // Main form hook
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
    } = useReceiptForm({
        receipt: purchase_receipt,
        defaultVatTax: getDefaultVatTax(),
        isEdit,
        type: "purchase",
    });

    // Product variants hook
    const productVariantHandlers = useProductVariants({
        formData,
        setFormData,
        addingRows: [],
        setAddingRows: () => {},
        editingIndexes: [],
        setEditingIndexes: () => {},
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
        const submitRoute = isEdit
            ? route("admin.receipt.purchase.update", purchase_receipt.id)
            : route("admin.receipt.purchase.store");
        const submitMethod = isEdit ? "put" : "post";

        baseHandleSubmit(e, submitRoute, submitMethod);
    };

    // Xử lý in (mở hộp thoại in) - KHÔNG thay đổi form
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

    // Xử lý xuất PDF - KHÔNG thay đổi form
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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <ReceiptHeader
                        isEdit={isEdit}
                        formData={formData}
                        indexRoute={route("admin.receipt.purchase.index")}
                        type="purchase"
                    />

                    {/* Action Buttons */}
                    {canPrint && (
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrint}
                                className="gap-2"
                                disabled={isPrinting || isExportingPDF}
                            >
                                {isPrinting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Printer className="w-4 h-4" />
                                )}
                                {isPrinting ? "Đang in..." : "In phiếu nhập"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={isExportingPDF || isPrinting}
                                className="gap-2"
                            >
                                {isExportingPDF ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {isExportingPDF ? "Đang xuất..." : "Xuất PDF"}
                            </Button>
                        </div>
                    )}
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
                    />

                    {/* Danh sách sản phẩm với Summary */}
                    <ProductVariantsTable
                        formData={formData}
                        addingRows={[]}
                        editingIndexes={[]}
                        productVariants={product_variants}
                        vatTaxes={vat_taxes}
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
                        accountingAccounts={accounting_accounts || []}
                        supplierName={currentSupplier?.name || ""}
                        type="purchase"
                        formatCurrency={formatCurrency}
                        createdBy={purchase_receipt?.created_by || ""}
                        receiptDate={formData.receipt_date}
                        addingRows={[]}
                    />

                    {/* Nút lưu/cập nhật ở cuối form */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={
                                isSubmitting || isExportingPDF || isPrinting
                            }
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            size="lg"
                            className="min-w-[200px]"
                            disabled={
                                isSubmitting || isExportingPDF || isPrinting
                            }
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting
                                ? "Đang lưu..."
                                : isEdit
                                  ? "Cập nhật phiếu nhập"
                                  : "Lưu phiếu nhập"}
                        </Button>
                    </div>
                </form>

                {/* Hidden Print Component - GIỮ NGUYÊN form mẫu */}
                <div style={{ display: "none" }}>
                    <PurchaseReceiptPrint
                        ref={printRef}
                        receipt={formData}
                        totals={totals}
                        user={currentUser}
                        system_languages={system_languages}
                    />
                </div>

                {/* Hidden PDF Component - GIỮ NGUYÊN form mẫu */}
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