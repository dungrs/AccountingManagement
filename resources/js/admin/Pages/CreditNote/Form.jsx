"use client";

import { useCallback, useEffect, useRef, useState, useMemo, memo } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/admin/components/ui/badge";
import { Card, CardContent } from "@/admin/components/ui/card";

// Custom hooks
import { useCreditNoteForm } from "@/admin/hooks/useCreditNoteForm";

// Components
import CreditNoteGeneralInfo from "@/admin/components/shared/notes/CreditNoteGeneralInfo";
import NoteAccountingTabs from "@/admin/components/shared/notes/NoteAccountingTabs";
import { Button } from "@/admin/components/ui/button";
import CreditNotePrint from "@/admin/components/shared/print/CreditNotePrint";

// Utils
import { formatCurrency } from "@/admin/utils/helpers";
import {
    Save,
    Printer,
    Download,
    Loader2,
    Calendar,
    User,
    DollarSign,
    TrendingDown,
    CheckCircle2,
    Clock,
    FileUp,
    Users,
    Building2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

// Constants
const STATUS_MAP = {
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
        icon: AlertCircle,
    },
};

const TYPE_MAP = {
    sales_return: "Hàng trả lại",
    discount: "Chiết khấu thanh toán",
    price_adjustment: "Điều chỉnh giá giảm",
    refund: "Hoàn tiền",
    prepayment: "Ứng trước",
    other: "Khác",
};

// Helper functions outside component
const getStatusBadge = (status) => {
    return STATUS_MAP[status] || STATUS_MAP.draft;
};

const getTypeBadge = (type) => {
    return TYPE_MAP[type] || type;
};


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
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await html2canvas(tempContainer, {
            scale: 3,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: 1200,
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

// Header Stats component
const HeaderStatCard = memo(({ title, value, icon: Icon, color, badge }) => {
    const colorClasses = {
        blue: "border-l-blue-500 bg-blue-100 text-blue-600",
        green: "border-l-green-500 bg-green-100 text-green-600",
        purple: "border-l-purple-500 bg-purple-100 text-purple-600",
        amber: "border-l-amber-500 bg-amber-100 text-amber-600",
    };

    return (
        <Card
            className={`border-l-4 ${colorClasses[color]} shadow-md hover:shadow-lg transition-shadow`}
        >
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-lg font-bold">{value}</p>
                    {badge && badge}
                </div>
                <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
});
HeaderStatCard.displayName = "HeaderStatCard";

// Quick Info Card component
const QuickInfoCard = memo(({ icon: Icon, title, value, color }) => {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600",
        orange: "bg-orange-100 text-orange-600",
        green: "bg-green-100 text-green-600",
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
                <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500">{title}</p>
                    <p className="font-medium text-slate-700">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
});
QuickInfoCard.displayName = "QuickInfoCard";

export default function CreditNoteForm() {
    const {
        credit_note,
        customers,
        suppliers,
        accounting_accounts,
        flash,
        users,
        system_languages,
        errors: serverErrors,
    } = usePage().props;

    const printRef = useRef(null);
    const { emit } = useEventBus();
    const isEdit = !!credit_note;
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const {
        formData,
        setFormData,
        errors,
        setErrors,
        isSubmitting,
        issueDate,
        setIssueDate,
        openIssueDate,
        setOpenIssueDate,
        handleChange,
        handleSubmit: baseHandleSubmit,
        handleJournalEntriesChange,
    } = useCreditNoteForm({
        note: credit_note,
        isEdit,
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
    }, [serverErrors, setErrors]);

    // Submit handler
    const handleSubmit = useCallback(
        (e) => {
            const submitRoute = isEdit
                ? route("admin.note.credit.update", credit_note.id)
                : route("admin.note.credit.store");
            const submitMethod = isEdit ? "put" : "post";

            baseHandleSubmit(e, submitRoute, submitMethod);
        },
        [isEdit, credit_note, baseHandleSubmit],
    );

    // Xử lý in
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `GBC-${formData.code || "Moi"}`,
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
        onAfterPrint: () => emit("toast:success", "Đã gửi lệnh in thành công!"),
        onPrintError: () =>
            emit("toast:error", "Có lỗi khi in giấy báo có! Vui lòng thử lại."),
    });

    // Xử lý xuất PDF
    const handleExportPDF = useCallback(async () => {
        if (!printRef.current) {
            alert("Không tìm thấy nội dung cần xuất!");
            return;
        }

        setIsExportingPDF(true);
        try {
            await generatePDF(
                printRef.current,
                `GBC-${formData.code || "Moi"}.pdf`,
            );
            emit("toast:success", "Xuất PDF thành công!");
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            emit("toast:error", "Có lỗi khi xuất PDF! Vui lòng thử lại.");
        } finally {
            setIsExportingPDF(false);
        }
    }, [formData.code, emit]);

    // Memoized values
    const currentCustomer = useMemo(
        () => customers?.find((c) => c.id === formData.customer_id),
        [customers, formData.customer_id],
    );
    const currentSupplier = useMemo(
        () => suppliers?.find((s) => s.id === formData.supplier_id),
        [suppliers, formData.supplier_id],
    );
    const currentParty = formData.customer_id
        ? currentCustomer
        : currentSupplier;
    const partyType = formData.customer_id ? "customer" : "supplier";
    const partyLabel = partyType === "customer" ? "Khách hàng" : "Nhà cung cấp";
    const PartyIcon = partyType === "customer" ? Users : Building2;

    const currentUser = useMemo(
        () => users?.find((u) => u.id === formData.created_by),
        [users, formData.created_by],
    );

    const statusBadge = formData.status
        ? getStatusBadge(formData.status)
        : null;
    const canPrint =
        isEdit && credit_note?.status === "confirmed" && !!formData.code;

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Giấy báo có",
                    link: route("admin.note.credit.index"),
                },
                {
                    label: isEdit
                        ? `Chỉnh sửa ${formData.code || "giấy báo có"}`
                        : "Thêm giấy báo có",
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? `Chỉnh sửa ${formData.code || "giấy báo có"}`
                        : "Thêm giấy báo có"
                }
            />

            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    <HeaderStatCard
                        title="Mã chứng từ"
                        value={formData.code || "Chưa có"}
                        icon={FileUp}
                        color="blue"
                    />
                    <HeaderStatCard
                        title="Tổng tiền"
                        value={formatCurrency(formData.total_amount || 0)}
                        icon={DollarSign}
                        color="green"
                    />
                    <HeaderStatCard
                        title="Đối tượng"
                        value={currentParty?.name || "Chưa chọn"}
                        icon={PartyIcon}
                        color="purple"
                    />
                    <HeaderStatCard
                        title="Trạng thái"
                        value={null}
                        icon={Clock}
                        color="amber"
                        badge={
                            statusBadge && (
                                <Badge
                                    className={cn(
                                        "mt-1",
                                        statusBadge.className,
                                    )}
                                >
                                    <statusBadge.icon className="h-3 w-3 mr-1" />
                                    {statusBadge.label}
                                </Badge>
                            )
                        }
                    />
                </div>

                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <FileUp className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {isEdit
                                        ? `Chỉnh sửa giấy báo có: ${formData.code}`
                                        : "Thêm giấy báo có mới"}
                                </h1>
                                <p className="text-white/80 mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {issueDate
                                        ? issueDate.toLocaleDateString("vi-VN")
                                        : "Chưa chọn ngày"}
                                    {formData.type && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                Loại:{" "}
                                                {getTypeBadge(formData.type)}
                                            </span>
                                        </>
                                    )}
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
                                    disabled={isExportingPDF}
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    In chứng từ
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
                    <QuickInfoCard
                        icon={User}
                        title="Người tạo"
                        value={currentUser?.name || "Chưa xác định"}
                        color="blue"
                    />
                    <QuickInfoCard
                        icon={PartyIcon}
                        title="Đối tượng"
                        value={partyLabel}
                        color="orange"
                    />
                    <QuickInfoCard
                        icon={TrendingDown}
                        title="Tổng tiền"
                        value={formatCurrency(formData.total_amount || 0)}
                        color="green"
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <CreditNoteGeneralInfo
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        issueDate={issueDate}
                        setIssueDate={setIssueDate}
                        openIssueDate={openIssueDate}
                        setOpenIssueDate={setOpenIssueDate}
                        handleChange={handleChange}
                        setErrors={setErrors}
                        customers={customers}
                        suppliers={suppliers}
                        users={users}
                        isEdit={isEdit}
                    />

                    <NoteAccountingTabs
                        formData={formData}
                        accountingAccounts={accounting_accounts || []}
                        type="credit"
                        formatCurrency={formatCurrency}
                        onJournalEntriesChange={handleJournalEntriesChange}
                    />

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
                                  ? "Cập nhật giấy báo có"
                                  : "Lưu giấy báo có"}
                        </Button>
                    </div>
                </form>

                {/* Hidden print component */}
                <div
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        top: 0,
                        visibility: "hidden",
                    }}
                >
                    <CreditNotePrint
                        ref={printRef}
                        note={formData}
                        user={currentUser}
                        party={currentParty}
                        partyType={partyType}
                        system_languages={system_languages}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
