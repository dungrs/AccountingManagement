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
    Eye,
    BookOpen,
    User,
    Users,
} from "lucide-react";
import CustomerDebtPrint from "@/admin/components/shared/print/CustomerDebtPrint";
import { cn } from "@/admin/lib/utils";

const generatePDF = async (element, fileName) => {
    const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        visibility: element.style.visibility,
        zIndex: element.style.zIndex,
        width: element.style.width,
    };

    element.style.position = "fixed";
    element.style.left = "0";
    element.style.top = "0";
    element.style.visibility = "visible";
    element.style.zIndex = "9999";
    element.style.width = "297mm";
    element.style.backgroundColor = "white";

    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (_clonedDoc, clonedElement) => {
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

    Object.assign(element.style, originalStyles);

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas không hợp lệ");
    }

    const pdfWidth = 297;
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

export default function CustomerDebtPreview() {
    const { result, systems } = usePage().props;
    const printRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

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

    const formatMoney = (amount) => {
        if (amount === null || amount === undefined) return "";
        return new Intl.NumberFormat("vi-VN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Sắp xếp và lọc chỉ các dòng đối ứng (không phải dòng 131)
    const sortedFilteredTransactions = useMemo(() => {
        if (!result.transactions || !Array.isArray(result.transactions)) {
            return [];
        }

        // Lọc bỏ dòng TK 331
        const nonPayable = result.transactions.filter(
            (item) => !item.is_payable_account,
        );

        // Group theo reference_code + account_code (mỗi TK đối ứng 1 dòng, không duplicate)
        const groupMap = new Map();

        nonPayable.forEach((item) => {
            const key = `${item.formatted_date}_${item.reference_code}_${item.reference_type_label}_${item.account_code}`;

            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    ...item,
                    debit: Number(item.debit) || 0,
                    credit: Number(item.credit) || 0,
                });
            } else {
                const existing = groupMap.get(key);
                existing.debit += Number(item.debit) || 0;
                existing.credit += Number(item.credit) || 0;
            }
        });

        return Array.from(groupMap.values()).sort((a, b) => {
            if (a.formatted_date !== b.formatted_date) {
                const dateA = a.formatted_date.split("/").reverse().join("-");
                const dateB = b.formatted_date.split("/").reverse().join("-");
                return dateA.localeCompare(dateB);
            }
            return a.sort_key?.localeCompare(b.sort_key ?? "") ?? 0;
        });
    }, [result.transactions]);

    // Tính running balance per-row
    // TK 131 là tài khoản phải thu, số dư bên Nợ:
    // - TK đối ứng ghi Có (doanh thu, thuế: 511, 333...) → 131 ghi Nợ → số dư Nợ tăng: +credit
    // - TK đối ứng ghi Nợ (thu tiền: 112, 111...) → 131 ghi Có → số dư Nợ giảm: -debit
    const transactionsWithBalance = useMemo(() => {
        if (!sortedFilteredTransactions.length) return [];

        let runningBalance = result.opening_balance || 0;

        return sortedFilteredTransactions.map((item) => {
            const debitAmount = Number(item.debit) || 0;
            const creditAmount = Number(item.credit) || 0;

            runningBalance = runningBalance + (creditAmount - debitAmount);

            return {
                ...item,
                running_balance: runningBalance,
            };
        });
    }, [sortedFilteredTransactions, result.opening_balance]);

    // Số dư cuối kỳ = running balance của dòng cuối
    const closingBalance = useMemo(() => {
        if (transactionsWithBalance.length > 0) {
            return transactionsWithBalance[transactionsWithBalance.length - 1]
                .running_balance;
        }
        return result.opening_balance || 0;
    }, [transactionsWithBalance, result.opening_balance]);

    // Tổng phát sinh Nợ/Có: chỉ tính từ các dòng 131
    const totals = useMemo(() => {
        const receivableTransactions = (result.transactions || []).filter(
            (item) => item.is_receivable_account,
        );
        return {
            total_debit: receivableTransactions.reduce(
                (sum, item) => sum + (Number(item.debit) || 0),
                0,
            ),
            total_credit: receivableTransactions.reduce(
                (sum, item) => sum + (Number(item.credit) || 0),
                0,
            ),
        };
    }, [result.transactions]);

    const getPdfFileName = () => {
        const startDate = result.period?.start_date?.replace(/\//g, "-") || "";
        const endDate = result.period?.end_date?.replace(/\//g, "-") || "";
        return `So-chi-tiet-cong-no-131-${result.customer?.customer_id || ""}-${startDate}-${endDate}.pdf`;
    };

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

    const handlePrint = () => {
        if (!printRef.current) {
            alert("Không tìm thấy nội dung cần in!");
            return;
        }

        setIsPrinting(true);

        try {
            const printContent = printRef.current.innerHTML;
            const printWindow = window.open("", "_blank");

            if (!printWindow) {
                alert(
                    "Trình duyệt đã chặn cửa sổ popup. Vui lòng cho phép popup để in.",
                );
                setIsPrinting(false);
                return;
            }

            const styles = document.querySelectorAll(
                'style, link[rel="stylesheet"]',
            );
            let stylesHTML = "";
            styles.forEach((style) => {
                if (style.tagName === "STYLE") {
                    stylesHTML += style.outerHTML;
                } else if (
                    style.tagName === "LINK" &&
                    style.rel === "stylesheet"
                ) {
                    stylesHTML += style.outerHTML;
                }
            });

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>In sổ chi tiết công nợ khách hàng</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    ${stylesHTML}
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; background: white; }
                            * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        }
                        body { background: white; margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
                        .print-container { width: 297mm; margin: 0 auto; background: white; }
                    </style>
                </head>
                <body>
                    <div class="print-container">${printContent}</div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.onafterprint = function() { window.close(); };
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
                { label: "Công nợ", link: route("admin.debt.customer.index") },
                { label: "Xem trước sổ chi tiết công nợ" },
            ]}
        >
            <Head title="Xem trước sổ chi tiết công nợ khách hàng TK 131" />

            {/* Print component - ẩn ngoài màn hình */}
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
                <CustomerDebtPrint result={result} systems={systems} />
            </div>

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                        <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Xem trước sổ chi tiết công nợ
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Tài khoản 131 - Phải thu của khách hàng
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={exportToPDF}
                                    className="btn-gradient-premium"
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
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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

            {/* Nội dung preview */}
            <div className="space-y-6">
                {/* Card thông tin chung */}
                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl uppercase text-slate-800">
                                        Sổ chi tiết công nợ
                                    </CardTitle>
                                    <CardDescription>
                                        Tài khoản: 131 - Phải thu của khách hàng
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                                Mẫu số: S31-DN
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Thông tin công ty */}
                            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                <h3 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    THÔNG TIN CÔNG TY
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium text-slate-800">
                                            {companyInfo.name}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600">
                                            {companyInfo.address}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600">
                                            MST: {companyInfo.taxCode}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin khách hàng */}
                            <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                                <h3 className="font-semibold text-sm text-purple-700 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    THÔNG TIN KHÁCH HÀNG
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Users className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium text-slate-800">
                                            {result.customer.customer_name}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600">
                                            {result.customer.address}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600">
                                            MST: {result.customer.tax_code}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Phone className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600">
                                            {result.customer.phone}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Mail className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600">
                                            {result.customer.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent" />

                        {/* Kỳ báo cáo và số dư */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            KỲ BÁO CÁO
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {result.period?.start_date} -{" "}
                                        {result.period?.end_date}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
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

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            PHÁT SINH NỢ (131)
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatMoney(totals.total_debit)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-red-600 mb-1">
                                        <TrendingDown className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                            PHÁT SINH CÓ (131)
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-red-600">
                                        {formatMoney(totals.total_credit)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                {/* Bảng chi tiết */}
                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-base text-slate-800">
                                    Chi tiết phát sinh
                                </CardTitle>
                                <CardDescription>
                                    Danh sách các giao dịch phát sinh trong kỳ
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                    <TableRow>
                                        <TableHead
                                            colSpan={2}
                                            className="text-center border-r border-slate-200 font-semibold text-slate-700"
                                        >
                                            Chứng từ
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-center w-16 align-middle border-r font-semibold text-slate-700"
                                        >
                                            Loại
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="align-middle font-semibold border-r text-slate-700"
                                        >
                                            Diễn giải
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-center w-24 align-middle font-semibold text-slate-700"
                                        >
                                            TK ĐƯ
                                        </TableHead>
                                        <TableHead
                                            colSpan={2}
                                            className="text-center border-x border-slate-200 font-semibold text-slate-700"
                                        >
                                            Số phát sinh
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-right w-32 align-middle font-semibold text-slate-700"
                                        >
                                            Số dư Nợ
                                            <br />
                                            <span className="text-xs font-normal">
                                                (Khách nợ)
                                            </span>
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="text-center border-r w-20 font-semibold text-slate-700">
                                            Ngày
                                        </TableHead>
                                        <TableHead className="text-center border-r w-24 font-semibold text-slate-700">
                                            Số CT
                                        </TableHead>
                                        <TableHead className="text-center w-28 font-semibold text-slate-700">
                                            <span className="text-green-600">
                                                Nợ
                                            </span>
                                            <br />
                                            <span className="text-xs font-normal">
                                                (TK đối ứng)
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-center w-28 font-semibold text-slate-700">
                                            <span className="text-red-600">
                                                Có
                                            </span>
                                            <br />
                                            <span className="text-xs font-normal">
                                                (TK đối ứng)
                                            </span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Dòng số dư đầu kỳ */}
                                    <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50">
                                        <TableCell className="text-center" />
                                        <TableCell className="text-center" />
                                        <TableCell className="text-center" />
                                        <TableCell colSpan={2}>
                                            <div className="flex items-center gap-2">
                                                <Info className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold text-slate-800">
                                                    Số dư đầu kỳ
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right" />
                                        <TableCell className="text-right" />
                                        <TableCell className="text-right font-bold text-blue-600 text-base">
                                            {formatMoney(
                                                result.opening_balance,
                                            )}
                                        </TableCell>
                                    </TableRow>

                                    {/* Các dòng phát sinh (chỉ dòng đối ứng) */}
                                    {transactionsWithBalance.map(
                                        (item, index) => {
                                            const balance =
                                                item.running_balance;
                                            return (
                                                <TableRow
                                                    key={
                                                        item.journal_entry_detail_id ||
                                                        index
                                                    }
                                                    className={cn(
                                                        "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5",
                                                        index % 2 === 0
                                                            ? "bg-white"
                                                            : "bg-slate-50/50",
                                                    )}
                                                >
                                                    <TableCell className="text-center text-sm text-slate-600">
                                                        {item.formatted_date}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm font-mono">
                                                        {item.reference_code}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            className={cn(
                                                                "text-xs",
                                                                item.reference_type_label ===
                                                                    "PXK"
                                                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                                                    : "bg-purple-100 text-purple-700 border-purple-200",
                                                            )}
                                                        >
                                                            {item.reference_type_label ===
                                                            "PXK" ? (
                                                                <Receipt className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <CreditCard className="h-3 w-3 mr-1" />
                                                            )}
                                                            {
                                                                item.reference_type_label
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-600">
                                                        {item.reference_note ||
                                                            ""}
                                                        {item.is_tax_account && (
                                                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                                                Thuế
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm font-medium text-purple-600">
                                                        {item.account_code}
                                                    </TableCell>
                                                    {/* Nợ của TK đối ứng */}
                                                    <TableCell className="text-right text-sm">
                                                        {item.debit > 0 ? (
                                                            <span className="text-green-600 font-medium">
                                                                {formatMoney(
                                                                    item.debit,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            ""
                                                        )}
                                                    </TableCell>
                                                    {/* Có của TK đối ứng */}
                                                    <TableCell className="text-right text-sm">
                                                        {item.credit > 0 ? (
                                                            <span className="text-red-600 font-medium">
                                                                {formatMoney(
                                                                    item.credit,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            ""
                                                        )}
                                                    </TableCell>
                                                    {/* Số dư Nợ sau dòng này */}
                                                    <TableCell className="text-right text-sm font-bold">
                                                        {balance >= 0 ? (
                                                            <span className="text-blue-600">
                                                                {formatMoney(
                                                                    balance,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600">
                                                                (
                                                                {formatMoney(
                                                                    Math.abs(
                                                                        balance,
                                                                    ),
                                                                )}
                                                                )
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        },
                                    )}

                                    {/* Tổng cộng phát sinh (từ dòng 131) */}
                                    <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 font-bold">
                                        <TableCell
                                            colSpan={5}
                                            className="text-center font-semibold"
                                        >
                                            Tổng cộng phát sinh
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {formatMoney(totals.total_debit)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {formatMoney(totals.total_credit)}
                                        </TableCell>
                                        <TableCell className="text-right" />
                                    </TableRow>

                                    {/* Số dư cuối kỳ */}
                                    <TableRow className="bg-gradient-to-r from-blue-100 to-purple-100 font-bold">
                                        <TableCell
                                            colSpan={5}
                                            className="text-center font-semibold"
                                        >
                                            Số dư cuối kỳ
                                        </TableCell>
                                        <TableCell className="text-right" />
                                        <TableCell className="text-right" />
                                        <TableCell className="text-right text-lg">
                                            {closingBalance >= 0 ? (
                                                <span className="text-blue-600">
                                                    {formatMoney(
                                                        closingBalance,
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-red-600">
                                                    (
                                                    {formatMoney(
                                                        Math.abs(
                                                            closingBalance,
                                                        ),
                                                    )}
                                                    )
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between text-xs text-slate-500 py-3 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Ngày in: {new Date().toLocaleDateString("vi-VN")}
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Người in: {result.customer?.customer_name || ""}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </AdminLayout>
    );
}
