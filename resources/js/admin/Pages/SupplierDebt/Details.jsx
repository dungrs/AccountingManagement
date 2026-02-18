"use client";

import { useRef, useMemo, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Separator } from "@/admin/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/admin/components/ui/tooltip";
import {
    Printer,
    Download,
    Building2,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Receipt,
    CreditCard,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Info,
    Loader2,
} from "lucide-react";
import SupplierDebtPrint from "@/admin/components/shared/print/SupplierDebtPrint";
import { createPortal } from "react-dom";

// Hàm dùng chung để render element ẩn và xuất PDF
const generatePDF = async (element, fileName) => {
    // Lưu style gốc
    const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        visibility: element.style.visibility,
        zIndex: element.style.zIndex,
        width: element.style.width,
    };

    // Tạm thời đưa element ra màn hình để html2canvas capture được
    element.style.position = "fixed";
    element.style.left = "0";
    element.style.top = "0";
    element.style.visibility = "visible";
    element.style.zIndex = "9999";
    element.style.width = "297mm";
    element.style.backgroundColor = "white";

    // Đợi render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Tạo canvas với chất lượng cao
    const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (_clonedDoc, clonedElement) => {
            // Đảm bảo tất cả th/td đều có màu chữ đen rõ ràng
            const allTh = clonedElement.getElementsByTagName("th");
            for (let th of allTh) {
                th.style.color = "#000000";
                th.style.backgroundColor = "#f0f0f0";
                th.style.fontWeight = "bold";
                th.style.WebkitPrintColorAdjust = "exact";
                th.style.printColorAdjust = "exact";
            }
            const allTd = clonedElement.getElementsByTagName("td");
            for (let td of allTd) {
                td.style.color = "#000000";
            }
            const allElements = clonedElement.getElementsByTagName("*");
            for (let el of allElements) {
                if (el.style) {
                    el.style.webkitFontSmoothing = "antialiased";
                    el.style.textRendering = "optimizeLegibility";
                }
            }
        },
    });

    // Khôi phục style gốc
    Object.assign(element.style, originalStyles);

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas không hợp lệ");
    }

    const pdfWidth = 297; // mm landscape
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    if (!imgData || imgData === "data:,") {
        throw new Error("Không thể tạo image từ canvas");
    }

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight, undefined, "FAST");
    pdf.save(fileName);
};

export default function SupplierDebtPreview() {
    const { result, systems } = usePage().props;
    const printRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Lọc bỏ các tài khoản 331 và chỉ lấy các tài khoản đối ứng
    const filteredTransactions = useMemo(() => {
        return result.transactions.filter((item) => !item.is_payable_account);
    }, [result.transactions]);

    // Lấy thông tin công ty từ systems
    const companyInfo = useMemo(
        () => ({
            name: systems?.homepage_company || "CÔNG TY TNHH ABC",
            address:
                systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM",
            taxCode: systems?.contact_tax_code || "0123456789",
            phone: systems?.contact_hotline || "",
            email: systems?.contact_email || "",
        }),
        [systems],
    );

    // Format số tiền
    const formatMoney = (amount) => {
        if (amount === null || amount === undefined) return "";
        return new Intl.NumberFormat("vi-VN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Tính số dư cuối kỳ: Dư cuối = Dư đầu + Phát sinh Có - Phát sinh Nợ
    const closingBalance = useMemo(() => {
        return (
            result.opening_balance +
            result.summary.total_credit -
            result.summary.total_debit
        );
    }, [result.opening_balance, result.summary]);

    // Tính running balance cho từng dòng
    const transactionsWithBalance = useMemo(() => {
        let runningBalance = result.opening_balance;
        const processedJournalEntries = [];

        return filteredTransactions.map((item) => {
            if (!processedJournalEntries.includes(item.journal_entry_id)) {
                const payableEntry = result.transactions.find(
                    (t) =>
                        t.journal_entry_id === item.journal_entry_id &&
                        t.is_payable_account,
                );

                if (payableEntry) {
                    runningBalance =
                        runningBalance +
                        (payableEntry.credit - payableEntry.debit);
                }
                processedJournalEntries.push(item.journal_entry_id);
            }

            return {
                ...item,
                running_balance: runningBalance,
            };
        });
    }, [filteredTransactions, result.transactions, result.opening_balance]);

    // Tạo tên file PDF
    const getPdfFileName = () =>
        `So-chi-tiet-cong-no-331-${result.supplier.supplier_code}-thang-${result.period.month}-${result.period.year}.pdf`;

    // Xuất PDF
    const exportToPDF = async () => {
        if (!printRef.current) {
            alert("Không tìm thấy nội dung cần xuất!");
            return;
        }
        setIsExporting(true);
        try {
            await generatePDF(printRef.current, getPdfFileName());
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại!");
        } finally {
            setIsExporting(false);
        }
    };

    // Hàm in trực tiếp (mở hộp thoại in của trình duyệt)
    const handlePrint = () => {
        if (!printRef.current) {
            alert("Không tìm thấy nội dung cần in!");
            return;
        }

        setIsPrinting(true);

        try {
            // Lấy nội dung cần in
            const printContent = printRef.current.innerHTML;
            
            // Tạo cửa sổ in mới
            const printWindow = window.open('', '_blank');
            
            if (!printWindow) {
                alert("Trình duyệt đã chặn cửa sổ popup. Vui lòng cho phép popup để in.");
                setIsPrinting(false);
                return;
            }

            // Lấy styles từ document hiện tại
            const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
            let stylesHTML = '';
            
            styles.forEach(style => {
                if (style.tagName === 'STYLE') {
                    stylesHTML += style.outerHTML;
                } else if (style.tagName === 'LINK' && style.rel === 'stylesheet') {
                    stylesHTML += style.outerHTML;
                }
            });

            // Viết nội dung vào cửa sổ in
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>In sổ chi tiết công nợ</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    ${stylesHTML}
                    <style>
                        /* Đảm bảo in ấn tốt */
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                                background: white;
                            }
                            * {
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                            }
                        }
                        body {
                            background: white;
                            margin: 0;
                            padding: 20px;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        /* Điều chỉnh kích thước cho in */
                        .print-container {
                            width: 297mm;
                            margin: 0 auto;
                            background: white;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContent}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            }, 500);
                        };
                    <\/script>
                </body>
                </html>
            `);

            printWindow.document.close();
        } catch (error) {
            console.error("Lỗi khi in:", error);
            alert("Có lỗi xảy ra khi in. Vui lòng thử lại!");
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                {
                    label: "Công nợ",
                    link: route("admin.debt.supplier.index"),
                },
                {
                    label: "Xem trước sổ chi tiết công nợ",
                },
            ]}
        >
            <Head title="Xem trước sổ chi tiết công nợ TK 331" />

            {/* Print component - Ẩn bằng cách đưa ra ngoài màn hình */}
            <div
                ref={printRef}
                style={{
                    position: "absolute",
                    left: "-9999px",
                    top: 0,
                    width: "297mm",
                    backgroundColor: "white",
                    visibility: "hidden",
                    pointerEvents: "none",
                }}
            >
                <SupplierDebtPrint result={result} systems={systems} />
            </div>

            {/* Header với actions */}
            <div className="mb-6 flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Xem trước sổ chi tiết công nợ
                    </h1>
                    <p className="text-muted-foreground">
                        Xem trước báo cáo trước khi in ấn hoặc xuất dữ liệu
                    </p>
                </div>
                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={exportToPDF}
                                    size="sm"
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                    )}
                                    {isExporting ? "Đang xuất..." : "Xuất PDF"}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Xuất sổ chi tiết công nợ ra file PDF</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handlePrint}
                                    variant="outline"
                                    size="sm"
                                    disabled={isPrinting}
                                >
                                    {isPrinting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Printer className="h-4 w-4 mr-2" />
                                    )}
                                    {isPrinting ? "Đang chuẩn bị..." : "In"}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>In sổ chi tiết công nợ</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Nội dung preview (giữ nguyên phần còn lại) */}
            <div className="space-y-6">
                {/* Card thông tin chung */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl uppercase">
                                    Sổ chi tiết công nợ
                                </CardTitle>
                                <CardDescription>
                                    Tài khoản: 331 - Phải trả cho người bán
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                Mẫu số: S31-DN
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Thông tin công ty */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                                    THÔNG TIN CÔNG TY
                                </h3>
                                <div className="space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium">
                                            {companyInfo.name}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm">
                                            {companyInfo.address}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm">
                                            MST: {companyInfo.taxCode}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin nhà cung cấp */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                                    THÔNG TIN NHÀ CUNG CẤP
                                </h3>
                                <div className="space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium">
                                            {result.supplier.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {result.supplier.supplier_code}
                                        </Badge>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm">
                                            {result.supplier.address}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm">
                                            MST: {result.supplier.tax_code}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm">
                                            {result.supplier.phone}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-sm">
                                            {result.supplier.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Kỳ báo cáo và số dư */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            KỲ BÁO CÁO
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {result.period.start_date} -{" "}
                                        {result.period.end_date}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <DollarSign className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            SỐ DƯ ĐẦU KỲ
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-blue-600">
                                        {formatMoney(result.opening_balance)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <TrendingDown className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            PHÁT SINH NỢ (Giảm nợ)
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-red-600">
                                        {formatMoney(
                                            result.summary.total_debit,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            PHÁT SINH CÓ (Tăng nợ)
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatMoney(
                                            result.summary.total_credit,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                {/* Bảng chi tiết */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Chi tiết phát sinh
                        </CardTitle>
                        <CardDescription>
                            Danh sách các giao dịch phát sinh trong kỳ
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    {/* Hàng 1: nhóm cột */}
                                    <TableRow>
                                        <TableHead
                                            colSpan={2}
                                            className="text-center border-r"
                                        >
                                            Chứng từ
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-center w-16 align-middle"
                                        >
                                            Loại
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="align-middle"
                                        >
                                            Diễn giải
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-center w-24 align-middle"
                                        >
                                            TK ĐƯ
                                        </TableHead>
                                        <TableHead
                                            colSpan={2}
                                            className="text-center border-r"
                                        >
                                            Số phát sinh
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-right w-28 align-middle"
                                        >
                                            Số dư
                                            <br />
                                            <span className="text-xs font-normal">
                                                (Còn nợ)
                                            </span>
                                        </TableHead>
                                    </TableRow>
                                    {/* Hàng 2: sub-column */}
                                    <TableRow>
                                        <TableHead className="text-center w-20">
                                            Ngày
                                        </TableHead>
                                        <TableHead className="text-center w-24">
                                            Số CT
                                        </TableHead>
                                        <TableHead className="text-right w-28">
                                            Nợ
                                            <br />
                                            <span className="text-xs font-normal">
                                                (Giảm nợ)
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-right w-28">
                                            Có
                                            <br />
                                            <span className="text-xs font-normal">
                                                (Tăng nợ)
                                            </span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Dòng số dư đầu kỳ */}
                                    <TableRow className="bg-blue-50/50 hover:bg-blue-50/70">
                                        <TableCell className="text-center"></TableCell>
                                        <TableCell className="text-center"></TableCell>
                                        <TableCell className="text-center"></TableCell>
                                        <TableCell
                                            className="font-medium"
                                            colSpan={2}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Info className="h-4 w-4 text-blue-600" />
                                                Số dư đầu kỳ
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right"></TableCell>
                                        <TableCell className="text-right"></TableCell>
                                        <TableCell className="text-right font-bold text-blue-600">
                                            {formatMoney(
                                                result.opening_balance,
                                            )}
                                        </TableCell>
                                    </TableRow>

                                    {/* Các dòng phát sinh */}
                                    {transactionsWithBalance.map(
                                        (item, index) => (
                                            <TableRow
                                                key={
                                                    item.journal_entry_detail_id
                                                }
                                                className={
                                                    index % 2 === 0
                                                        ? ""
                                                        : "bg-muted/20"
                                                }
                                            >
                                                <TableCell className="text-center text-sm">
                                                    {item.formatted_date}
                                                </TableCell>
                                                <TableCell className="text-center text-sm">
                                                    {item.reference_code}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={
                                                            item.reference_type_label ===
                                                            "PN"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {item.reference_type_label ===
                                                        "PN" ? (
                                                            <Receipt className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <CreditCard className="h-3 w-3 mr-1" />
                                                        )}
                                                        {
                                                            item.reference_type_label
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {item.reference_note || ""}
                                                    {item.is_tax_account && (
                                                        <span className="ml-2 text-xs text-yellow-600">
                                                            (Thuế)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center text-sm font-medium">
                                                    {item.account_code}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {item.debit > 0 ? (
                                                        <span className="text-red-600 font-medium">
                                                            {formatMoney(
                                                                item.debit,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        ""
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {item.credit > 0 ? (
                                                        <span className="text-green-600 font-medium">
                                                            {formatMoney(
                                                                item.credit,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        ""
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-bold">
                                                    {formatMoney(
                                                        item.running_balance,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}

                                    {/* Dòng tổng cộng */}
                                    <TableRow className="bg-gray-100 font-bold">
                                        <TableCell
                                            className="text-center"
                                            colSpan={5}
                                        >
                                            Tổng cộng phát sinh
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {formatMoney(
                                                result.summary.total_debit,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {formatMoney(
                                                result.summary.total_credit,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right"></TableCell>
                                    </TableRow>

                                    {/* Dòng số dư cuối kỳ */}
                                    <TableRow className="bg-blue-100 font-bold">
                                        <TableCell
                                            className="text-center"
                                            colSpan={5}
                                        >
                                            Số dư cuối kỳ
                                        </TableCell>
                                        <TableCell className="text-right"></TableCell>
                                        <TableCell className="text-right"></TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            {formatMoney(closingBalance)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between text-xs text-muted-foreground py-3">
                        <div>
                            Ngày in: {new Date().toLocaleDateString("vi-VN")}
                        </div>
                        <div>Người in: {result.supplier.name}</div>
                    </CardFooter>
                </Card>
            </div>
            {/* ... */}
        </AdminLayout>
    );
}