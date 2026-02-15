"use client";

import { useEffect, useRef } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";

// Custom hooks
import { useVoucherForm } from "@/admin/hooks/useVoucherForm";

// Components
import VoucherHeader from "@/admin/components/shared/vouchers/VoucherHeader";
import VoucherGeneralInfo from "@/admin/components/shared/vouchers/VoucherGeneralInfo";
import VoucherAccountingTabs from "@/admin/components/shared/vouchers/VoucherAccountingTabs";
import { Button } from "@/admin/components/ui/button";
import PaymentVoucherPrint from "@/admin/components/shared/print/PaymentVoucherPrint"; // Import component in

// Utils
import { formatCurrency } from "@/admin/utils/helpers";
import { Save, Printer } from "lucide-react";

export default function PaymentVoucherForm() {
    const {
        payment_voucher,
        suppliers,
        accounting_accounts,
        flash,
        users,
        system_languages,
        errors: serverErrors,
        bank_accounts,
    } = usePage().props;

    const printRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!payment_voucher;

    // Main form hook
    const {
        formData,
        setFormData,
        errors,
        setErrors,
        isSubmitting,
        voucherDate,
        setVoucherDate,
        openVoucherDate,
        setOpenVoucherDate,
        handleChange,
        handleSubmit: baseHandleSubmit,
    } = useVoucherForm({
        voucher: payment_voucher,
        isEdit,
        type: "payment",
    });

    // Thêm useEffect để debug khi chọn supplier
    useEffect(() => {
        if (formData.partner_id && formData.partner_info) {
            console.log(
                "Selected supplier banks:",
                formData.partner_info.banks,
            );
        }
    }, [formData.partner_id, formData.partner_info]);

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) emit("toast:success", flash.success);
        // if (flash?.error) emit("toast:error", flash.error);
    }, [flash, emit]);

    // Handle server errors
    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
            // emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
        }
    }, [serverErrors, setErrors, emit]);

    // Submit handler
    const handleSubmit = (e) => {
        const submitRoute = isEdit
            ? route("admin.voucher.payment.update", payment_voucher.id)
            : route("admin.voucher.payment.store");
        const submitMethod = isEdit ? "put" : "post";

        baseHandleSubmit(e, submitRoute, submitMethod);
    };

    // Handle print
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Phieu-chi-${formData.code || "Moi"}`,
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
                .no-print {
                    display: none !important;
                }
            }
        `,
        onBeforeGetContent: async () => {
            // Có thể thực hiện các action trước khi in ở đây
            console.log("Preparing to print...");
        },
        onAfterPrint: () => {
            // Sau khi in xong
            // emit("toast:success", "Đã gửi lệnh in thành công!");
        },
        onPrintError: (error) => {
            console.error("Print error:", error);
            emit("toast:error", "Có lỗi khi in phiếu! Vui lòng thử lại.");
        },
    });

    // Get current supplier
    const currentSupplier = suppliers?.find(
        (s) => s.id === formData.partner_id,
    );

    // Get current user
    const currentUser = users?.find((u) => u.id === formData.user_id);

    // Kiểm tra có thể in không
    const canPrint =
        isEdit &&
        payment_voucher?.status !== "draft" &&
        payment_voucher?.status === "confirmed" &&
        formData.code;

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Phiếu chi",
                    link: route("admin.voucher.payment.index"),
                },
                {
                    label: isEdit
                        ? `Chỉnh sửa ${formData.code || "phiếu chi"}`
                        : "Thêm phiếu chi",
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? `Chỉnh sửa ${formData.code || "phiếu chi"}`
                        : "Thêm phiếu chi"
                }
            />

            <div className="space-y-6">
                {/* Header - Sử dụng VoucherHeader */}
                <div className="flex items-center justify-between">
                    <VoucherHeader
                        isEdit={isEdit}
                        formData={formData}
                        indexRoute={route("admin.voucher.payment.index")}
                        type="payment"
                    />

                    {/* Print Button - Chỉ hiển thị khi phiếu đã được xác nhận */}
                    {canPrint && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrint}
                            className="gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            In phiếu chi
                        </Button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Thông tin chung */}
                    <VoucherGeneralInfo
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        voucherDate={voucherDate}
                        setVoucherDate={setVoucherDate}
                        openVoucherDate={openVoucherDate}
                        setOpenVoucherDate={setOpenVoucherDate}
                        handleChange={handleChange}
                        setErrors={setErrors}
                        type="payment"
                        partners={suppliers}
                        users={users}
                        bankAccounts={bank_accounts}
                        isEdit={isEdit} // Thêm prop này
                    />

                    {/* Hạch toán và Công nợ */}
                    <VoucherAccountingTabs
                        formData={formData}
                        accountingAccounts={accounting_accounts || []}
                        type="payment"
                        formatCurrency={formatCurrency}
                        onJournalEntriesChange={(entries) => {
                            // Cập nhật formData với journal entries mới
                            // Bạn có thể thêm logic để lưu entries vào formData nếu cần
                            console.log("Journal entries updated:", entries);

                            // Ví dụ: cập nhật formData với entries
                            // setFormData(prev => ({
                            //     ...prev,
                            //     journal_entries: entries
                            // }));
                        }}
                    />

                    {/* Nút lưu/cập nhật */}
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
                            size="lg"
                            className="min-w-[200px]"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting
                                ? "Đang lưu..."
                                : isEdit
                                  ? "Cập nhật phiếu chi"
                                  : "Lưu phiếu chi"}
                        </Button>
                    </div>
                </form>

                {/* Hidden Print Component */}
                <div style={{ display: "none" }}>
                    <PaymentVoucherPrint
                        ref={printRef}
                        voucher={formData}
                        user={currentUser}
                        partner={currentSupplier}
                        system_languages={system_languages}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
