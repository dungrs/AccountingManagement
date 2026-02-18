"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Custom hooks
import { useVoucherForm } from "@/admin/hooks/useVoucherForm";

// Components
import VoucherHeader from "@/admin/components/shared/vouchers/VoucherHeader";
import VoucherGeneralInfo from "@/admin/components/shared/vouchers/VoucherGeneralInfo";
import VoucherAccountingTabs from "@/admin/components/shared/vouchers/VoucherAccountingTabs";
import { Button } from "@/admin/components/ui/button";
import PaymentVoucherPrint from "@/admin/components/shared/print/PaymentVoucherPrint";

// Utils
import { formatCurrency } from "@/admin/utils/helpers";
import { Save, Printer, Download, Loader2 } from "lucide-react";

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
    const pdfRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!payment_voucher;
    const [isExportingPDF, setIsExportingPDF] = useState(false);

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
        handleJournalEntriesChange,
    } = useVoucherForm({
        voucher: payment_voucher,
        isEdit,
        type: "payment",
    });

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) emit("toast:success", flash.success);
    }, [flash, emit]);

    // Handle server errors
    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
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

    // Hàm xuất PDF
    const generatePDF = async (element, fileName) => {
        if (!element) {
            throw new Error("Không tìm thấy nội dung cần xuất!");
        }

        // Tạo một container tạm thời
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "0";
        tempContainer.style.width = "250mm";
        tempContainer.style.backgroundColor = "white";
        tempContainer.style.zIndex = "9999";
        tempContainer.style.padding = "15mm 20mm";
        tempContainer.style.fontFamily = "Times New Roman, serif";

        // Clone nội dung từ element gốc
        const content = element.cloneNode(true);
        tempContainer.appendChild(content);
        document.body.appendChild(tempContainer);

        try {
            // Đợi render
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Tạo canvas với chất lượng cao
            const canvas = await html2canvas(tempContainer, {
                scale: 3,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1200,
                onclone: (_clonedDoc, clonedElement) => {
                    // Đảm bảo tất cả chữ đều rõ ràng
                    const allElements = clonedElement.getElementsByTagName("*");
                    for (let el of allElements) {
                        if (el.style) {
                            el.style.color = "#000000";
                            el.style.webkitPrintColorAdjust = "exact";
                            el.style.printColorAdjust = "exact";
                        }
                    }
                },
            });

            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error("Canvas không hợp lệ");
            }

            const pdfWidth = 210; // mm portrait
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            const imgData = canvas.toDataURL("image/jpeg", 1.0);

            if (!imgData || imgData === "data:,") {
                throw new Error("Không thể tạo image từ canvas");
            }

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

    // Xử lý in (mở hộp thoại in)
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
            console.log("Preparing to print...");
        },
        onAfterPrint: () => {
            emit("toast:success", "Đã gửi lệnh in thành công!");
        },
        onPrintError: (error) => {
            console.error("Print error:", error);
            emit("toast:error", "Có lỗi khi in phiếu! Vui lòng thử lại.");
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
                `Phieu-chi-${formData.code || "Moi"}.pdf`,
            );
            emit("toast:success", "Xuất PDF thành công!");
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            emit("toast:error", "Có lỗi khi xuất PDF! Vui lòng thử lại.");
        } finally {
            setIsExportingPDF(false);
        }
    };

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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <VoucherHeader
                        isEdit={isEdit}
                        formData={formData}
                        indexRoute={route("admin.voucher.payment.index")}
                        type="payment"
                    />

                    {/* Action Buttons */}
                    {canPrint && (
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrint}
                                className="gap-2"
                                disabled={isExportingPDF}
                            >
                                <Printer className="w-4 h-4" />
                                In phiếu chi
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={isExportingPDF}
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
                        isEdit={isEdit}
                    />

                    {/* Hạch toán và Công nợ */}
                    <VoucherAccountingTabs
                        formData={formData}
                        accountingAccounts={accounting_accounts || []}
                        type="payment"
                        formatCurrency={formatCurrency}
                        onJournalEntriesChange={handleJournalEntriesChange}
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
                            disabled={isSubmitting || isExportingPDF}
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

                {/* Component cho in ấn - để trong DOM nhưng ẩn */}
                <div
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        top: 0,
                        visibility: "hidden",
                    }}
                >
                    <PaymentVoucherPrint
                        ref={printRef}
                        voucher={formData}
                        user={currentUser}
                        partner={currentSupplier}
                        system_languages={system_languages}
                    />
                </div>

                {/* Component cho xuất PDF - để trong DOM nhưng ẩn */}
                <div
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        top: 0,
                        visibility: "hidden",
                    }}
                >
                    <PaymentVoucherPrint
                        ref={pdfRef}
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