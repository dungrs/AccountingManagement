"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    Download,
    RefreshCw,
    Calendar,
    BarChart3,
    Printer,
    Loader2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    Landmark,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Badge } from "@/admin/components/ui/badge";
import { cn } from "@/admin/lib/utils";

import BusinessResultTable from "@/admin/components/pages/report/BusinessResultTable";
import BusinessResultPrint from "@/admin/components/shared/print/BusinessResultPrint";

export default function BusinessResultHome({ initialFilters }) {
    const { systems } = usePage().props;
    const { emit } = useEventBus();

    const printRef = useRef(null);
    const pdfRef = useRef(null);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [year, setYear] = useState(initialFilters.year);

    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - 4 + i,
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { year };
            const res = await axios.post(
                route("admin.report.business-result.data"),
                params,
            );

            if (res.data.success) {
                // Chuyển đổi dữ liệu từ service sang format mà BusinessResultTable cần
                const apiData = res.data.data;

                // Format dữ liệu cho component
                const formattedData = {
                    // Doanh thu
                    revenue: {
                        total: apiData.current.revenue.total,
                        reductions: apiData.current.revenue.reductions,
                        net: apiData.current.revenue.net,
                    },

                    // Giá vốn
                    cogs: {
                        total: apiData.current.cogs.total,
                    },

                    // Lợi nhuận gộp
                    gross_profit: apiData.current.gross_profit,

                    // Chi phí
                    expenses: {
                        selling: apiData.current.expenses.selling,
                        admin: apiData.current.expenses.admin,
                    },

                    // Lợi nhuận từ HĐKD
                    operating_profit: apiData.current.operating_profit,

                    // Thu nhập khác
                    other_income: {
                        total: apiData.current.other_income,
                    },

                    // Chi phí khác
                    other_expense: {
                        total: apiData.current.other_expense,
                    },

                    // Lợi nhuận trước thuế
                    profit_before_tax: apiData.current.profit_before_tax,

                    // Thuế TNDN
                    income_tax: apiData.current.income_tax,

                    // Lợi nhuận sau thuế
                    profit_after_tax: apiData.current.profit_after_tax,

                    // So sánh với kỳ trước
                    comparison: {
                        revenue: {
                            percentage_change:
                                apiData.comparison.revenue.percentage,
                        },
                        gross_profit: {
                            percentage_change:
                                apiData.comparison.gross_profit.percentage,
                        },
                        profit_before_tax: {
                            percentage_change:
                                apiData.comparison.profit_before_tax.percentage,
                        },
                        profit_after_tax: {
                            percentage_change:
                                apiData.comparison.profit_after_tax.percentage,
                        },
                    },

                    // Thông tin kỳ báo cáo
                    period: apiData.period,

                    // Dữ liệu năm nay và năm trước để in
                    current: apiData.current,
                    previous: apiData.previous,

                    // Chi tiết theo mặt hàng (nếu có)
                    product_details: apiData.product_details || [],
                };

                setData(formattedData);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            toast.error("Không thể tải dữ liệu báo cáo!");
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
        toast.success("Đã làm mới dữ liệu");
    };

    const handleYearChange = (value) => {
        setYear(parseInt(value));
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
        tempContainer.style.width = "297mm"; // A4 ngang
        tempContainer.style.backgroundColor = "white";
        tempContainer.style.zIndex = "9999";
        tempContainer.style.padding = "10mm 15mm";
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

            // A4 ngang: 297mm x 210mm
            const pdfWidth = 297;
            const pdfHeight = 210;
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

            pdf.addImage(
                imgData,
                "JPEG",
                0,
                0,
                pdfWidth,
                Math.min(imgHeight, pdfHeight),
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
        documentTitle: `Bao-cao-KQKD-${year}`,
        pageStyle: `
            @page {
                size: A4 landscape;
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
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid black;
                    padding: 4px;
                    font-size: 11px;
                }
                th {
                    background-color: #f0f0f0 !important;
                    font-weight: bold;
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
            emit("toast:error", "Có lỗi khi in báo cáo! Vui lòng thử lại.");
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
            await generatePDF(pdfRef.current, `Bao-cao-KQKD-${year}.pdf`);
            emit("toast:success", "Xuất PDF thành công!");
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            emit("toast:error", "Có lỗi khi xuất PDF! Vui lòng thử lại.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Tính các chỉ số tăng trưởng để hiển thị trong header
    const revenueGrowth = data?.comparison?.revenue?.percentage_change;
    const profitGrowth = data?.comparison?.profit_after_tax?.percentage_change;

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                { label: "Báo cáo KQKD" },
            ]}
        >
            <Head title="Báo cáo Kết quả Kinh doanh" />

            <div className="space-y-6">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-lg shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Báo cáo Kết quả Hoạt động Kinh doanh
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                So sánh {year} với {year - 1}
                                {data && (
                                    <span className="ml-2 inline-flex items-center gap-1">
                                        {revenueGrowth > 0 ? (
                                            <TrendingUp className="h-3 w-3 text-green-300" />
                                        ) : revenueGrowth < 0 ? (
                                            <TrendingDown className="h-3 w-3 text-red-300" />
                                        ) : null}
                                        <span>DT: {revenueGrowth}%</span>
                                        <span className="mx-1">|</span>
                                        {profitGrowth > 0 ? (
                                            <TrendingUp className="h-3 w-3 text-green-300" />
                                        ) : profitGrowth < 0 ? (
                                            <TrendingDown className="h-3 w-3 text-red-300" />
                                        ) : null}
                                        <span>LN: {profitGrowth}%</span>
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                                <Calendar className="h-4 w-4 text-white/70 ml-1" />
                                <Select
                                    value={year.toString()}
                                    onValueChange={handleYearChange}
                                >
                                    <SelectTrigger className="w-[100px] bg-transparent text-white border-0 focus:ring-0">
                                        <SelectValue placeholder="Năm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem
                                                key={y}
                                                value={y.toString()}
                                            >
                                                Năm {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleRefresh}
                                variant="secondary"
                                size="sm"
                                className="bg-white/20 text-white hover:bg-white/30 border-0"
                                disabled={loading}
                            >
                                <RefreshCw
                                    className={cn(
                                        "h-4 w-4 mr-1",
                                        loading && "animate-spin",
                                    )}
                                />
                                Làm mới
                            </Button>

                            {data && (
                                <>
                                    <Button
                                        onClick={handlePrint}
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/20 text-white hover:bg-white/30 border-0"
                                        disabled={isExportingPDF}
                                    >
                                        <Printer className="h-4 w-4 mr-1" />
                                        In
                                    </Button>
                                    <Button
                                        onClick={handleExportPDF}
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/20 text-white hover:bg-white/30 border-0"
                                        disabled={isExportingPDF}
                                    >
                                        {isExportingPDF ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-1" />
                                        )}
                                        {isExportingPDF
                                            ? "Đang xuất..."
                                            : "Xuất PDF"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bảng dữ liệu */}
                <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                    <CardContent className="p-6">
                        <BusinessResultTable
                            data={data || {}}
                            loading={loading}
                        />
                    </CardContent>
                </Card>

                {/* Component cho in ấn - để trong DOM nhưng ẩn */}
                {data && (
                    <div
                        style={{
                            position: "absolute",
                            left: "-9999px",
                            top: 0,
                            visibility: "hidden",
                        }}
                    >
                        <BusinessResultPrint
                            ref={printRef}
                            data={data}
                            systems={systems}
                        />
                    </div>
                )}

                {/* Component cho xuất PDF - để trong DOM nhưng ẩn */}
                {data && (
                    <div
                        style={{
                            position: "absolute",
                            left: "-9999px",
                            top: 0,
                            visibility: "hidden",
                        }}
                    >
                        <BusinessResultPrint
                            ref={pdfRef}
                            data={data}
                            systems={systems}
                        />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}