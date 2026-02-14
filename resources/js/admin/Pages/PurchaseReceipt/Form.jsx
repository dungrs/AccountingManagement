"use client";

import { useEffect, useRef } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";

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
import {
    formatCurrency,
    calculateTotals,
    getVariantInfo,
} from "@/admin/utils/receiptUtils";
import { Save, Printer } from "lucide-react";

export default function PurchaseReceiptForm() {
    const {
        product_variants,
        vat_taxes,
        purchase_receipt,
        suppliers,
        accounting_accounts,
        flash,
        users,
        errors: serverErrors,
    } = usePage().props;

    useEffect(() => {
        console.log(purchase_receipt);
    }, []);

    const printRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!purchase_receipt;

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
        addingRows,
        setAddingRows,
        editingIndexes,
        setEditingIndexes,
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
        const submitRoute = isEdit
            ? route("admin.purchase_receipt.update", purchase_receipt.id)
            : route("admin.purchase_receipt.store");
        const submitMethod = isEdit ? "put" : "post";

        baseHandleSubmit(e, submitRoute, submitMethod);
    };

    // Handle print - Updated for react-to-print v3
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
        onPrintError: (error) => {
            console.error("Print error:", error);
            emit("toast:error", "Có lỗi khi in phiếu!");
        },
    });

    // Calculate totals
    const totals = calculateTotals(formData.product_variants);

    // Get current supplier
    const currentSupplier = suppliers?.find(
        (s) => s.id === formData.supplier_id,
    );

    // Get current user
    const currentUser = users?.find((u) => u.id === formData.user_id);

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Phiếu nhập hàng",
                    link: route("admin.purchase_receipt.index"),
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
                        indexRoute={route("admin.purchase_receipt.index")}
                        type="purchase"
                    />

                    {/* Print Button - Only show if have products */}
                    {isEdit && (
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrint}
                                className="gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                In phiếu nhập kho
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
                    />

                    {/* Danh sách sản phẩm với Summary */}
                    <ProductVariantsTable
                        formData={formData}
                        addingRows={addingRows}
                        editingIndexes={editingIndexes}
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
                    />

                    {/* Nút lưu/cập nhật ở cuối form */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                formData.product_variants?.length === 0
                            }
                            size="lg"
                            className="min-w-[200px]"
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

                {/* Hidden Print Component */}
                <div style={{ display: "none" }}>
                    <PurchaseReceiptPrint
                        ref={printRef}
                        receipt={formData}
                        totals={totals}
                        user={currentUser}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
