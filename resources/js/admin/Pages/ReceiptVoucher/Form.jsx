"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/admin/components/ui/badge";
import { Card, CardContent } from "@/admin/components/ui/card";

// Custom hooks
import { useVoucherForm } from "@/admin/hooks/useVoucherForm";

// Components
import VoucherGeneralInfo from "@/admin/components/shared/vouchers/VoucherGeneralInfo";
import VoucherAccountingTabs from "@/admin/components/shared/vouchers/VoucherAccountingTabs";
import { Button } from "@/admin/components/ui/button";
import ReceiptVoucherPrint from "@/admin/components/shared/print/ReceiptVoucherPrint"; // Đổi import

// Utils
import { formatCurrency } from "@/admin/utils/helpers";
import {
    Save,
    Printer,
    Download,
    Loader2,
    Wallet,
    Calendar,
    User,
    Building2,
    DollarSign,
    TrendingUp, // Đổi từ TrendingDown
    CheckCircle2,
    Clock,
    Landmark,
    CreditCard,
    Users, // Thêm icon cho khách hàng
    Receipt, // Thêm icon cho phiếu thu
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function ReceiptVoucherForm() {
    const {
        receipt_voucher, // Đổi từ payment_voucher
        customers, // Đổi từ suppliers
        accounting_accounts,
        flash,
        users,
        system_languages,
        errors: serverErrors,
        // bank_accounts, // Có thể bỏ nếu không dùng
    } = usePage().props;

    const printRef = useRef(null);
    const pdfRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!receipt_voucher; // Đổi từ payment_voucher
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
        voucher: receipt_voucher, // Đổi từ payment_voucher
        isEdit,
        type: "receipt", // Đổi từ "payment" thành "receipt"
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
            ? route("admin.voucher.receipt.update", receipt_voucher.id) // Đổi route
            : route("admin.voucher.receipt.store"); // Đổi route
        const submitMethod = isEdit ? "put" : "post";

        baseHandleSubmit(e, submitRoute, submitMethod);
    };

    // Hàm xuất PDF
    const generatePDF = async (element, fileName) => {
        if (!element) {
            throw new Error("Không tìm thấy nội dung cần xuất!");
        }

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "0";
        tempContainer.style.width = "250mm";
        tempContainer.style.backgroundColor = "white";
        tempContainer.style.zIndex = "9999";
        tempContainer.style.padding = "15mm 20mm";
        tempContainer.style.fontFamily = "Times New Roman, serif";

        const content = element.cloneNode(true);
        tempContainer.appendChild(content);
        document.body.appendChild(tempContainer);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const canvas = await html2canvas(tempContainer, {
                scale: 3,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1200,
                onclone: (_clonedDoc, clonedElement) => {
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

            const pdfWidth = 210;
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
            if (tempContainer && tempContainer.parentNode) {
                document.body.removeChild(tempContainer);
            }
        }
    };

    // Xử lý in
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Phieu-thu-${formData.code || "Moi"}`, // Đổi tên file
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
                `Phieu-thu-${formData.code || "Moi"}.pdf`, // Đổi tên file
            );
            emit("toast:success", "Xuất PDF thành công!");
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            emit("toast:error", "Có lỗi khi xuất PDF! Vui lòng thử lại.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Get current customer (đổi từ supplier)
    const currentCustomer = customers?.find(
        (c) => c.id === formData.partner_id,
    );

    // Get current user
    const currentUser = users?.find((u) => u.id === formData.user_id);

    // Kiểm tra có thể in không
    const canPrint =
        isEdit &&
        receipt_voucher?.status !== "draft" && // Đổi từ payment_voucher
        receipt_voucher?.status === "confirmed" &&
        formData.code;

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
        };
        return statusMap[status] || statusMap.draft;
    };

    const statusBadge = formData.status
        ? getStatusBadge(formData.status)
        : null;

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Phiếu thu", // Đổi label
                    link: route("admin.voucher.receipt.index"), // Đổi route
                },
                {
                    label: isEdit
                        ? `Chỉnh sửa ${formData.code || "phiếu thu"}` // Đổi text
                        : "Thêm phiếu thu", // Đổi text
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? `Chỉnh sửa ${formData.code || "phiếu thu"}` // Đổi title
                        : "Thêm phiếu thu" // Đổi title
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
                                <Receipt className="h-5 w-5 text-blue-600" />{" "}
                                {/* Đổi icon */}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Số tiền
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(formData.amount || 0)}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Khách hàng {/* Đổi text */}
                                </p>
                                <p className="text-lg font-bold text-purple-600 truncate max-w-[150px]">
                                    {currentCustomer?.name || "Chưa chọn"}{" "}
                                    {/* Đổi từ currentSupplier */}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />{" "}
                                {/* Đổi icon */}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Trạng thái
                                </p>
                                {statusBadge && (
                                    <Badge
                                        className={cn(
                                            "mt-1",
                                            statusBadge.className,
                                        )}
                                    >
                                        <statusBadge.icon className="h-3 w-3 mr-1" />
                                        {statusBadge.label}
                                    </Badge>
                                )}
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
                                <Receipt className="h-8 w-8 text-white" />{" "}
                                {/* Đổi icon */}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {isEdit
                                        ? `Chỉnh sửa phiếu thu: ${formData.code}` // Đổi text
                                        : "Thêm phiếu thu mới"}{" "}
                                    {/* Đổi text */}
                                </h1>
                                <p className="text-white/80 mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {voucherDate
                                        ? voucherDate.toLocaleDateString(
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
                                    disabled={isExportingPDF}
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    In phiếu
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleExportPDF}
                                    disabled={isExportingPDF}
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

                {/* Quick Info Cards */}
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
                                <CreditCard className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">
                                    Phương thức
                                </p>
                                <p className="font-medium text-slate-700">
                                    {formData.payment_method === "cash"
                                        ? "Tiền mặt"
                                        : formData.payment_method === "bank"
                                          ? "Chuyển khoản"
                                          : "Chưa chọn"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600" />{" "}
                                {/* Đổi icon */}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">
                                    Tổng thu {/* Đổi text */}
                                </p>
                                <p className="font-medium text-slate-700">
                                    {formatCurrency(formData.amount || 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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
                        type="receipt" // Đổi từ "payment" thành "receipt"
                        partners={customers} // Đổi từ suppliers
                        users={users}
                        // bankAccounts={bank_accounts} // Có thể bỏ nếu không dùng
                        isEdit={isEdit}
                    />

                    {/* Hạch toán và Công nợ */}
                    <VoucherAccountingTabs
                        formData={formData}
                        accountingAccounts={accounting_accounts || []}
                        type="receipt" // Đổi từ "payment" thành "receipt"
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
                            className="border-slate-200 hover:bg-slate-100"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            size="lg"
                            className="btn-gradient-premium min-w-[200px]"
                            disabled={isSubmitting || isExportingPDF}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {isSubmitting
                                ? "Đang lưu..."
                                : isEdit
                                  ? "Cập nhật phiếu thu" // Đổi text
                                  : "Lưu phiếu thu"}{" "}
                            {/* Đổi text */}
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
                    <ReceiptVoucherPrint // Đổi component
                        ref={printRef}
                        voucher={formData}
                        user={currentUser}
                        partner={currentCustomer} // Đổi từ currentSupplier
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
                    <ReceiptVoucherPrint // Đổi component
                        ref={pdfRef}
                        voucher={formData}
                        user={currentUser}
                        partner={currentCustomer} // Đổi từ currentSupplier
                        system_languages={system_languages}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}