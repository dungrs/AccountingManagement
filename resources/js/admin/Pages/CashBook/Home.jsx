"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    Download,
    Printer,
    Filter,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Wallet,
    Landmark,
    CreditCard,
    ArrowRight,
    Loader2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import CashBookTable from "@/admin/components/pages/book/CashBookTable";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { formatCurrency } from "@/admin/utils/helpers";
import { useReactToPrint } from "react-to-print";
import CashBookPrint from "@/admin/components/shared/print/CashBookPrint";
import { RangeDatePicker } from "@/admin/components/ui/date-picker";

export default function CashBookIndex({ initialFilters }) {
    useFlashToast();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState("2025-01-01");
    const [endDate, setEndDate] = useState("2026-01-31");

    const [paymentMethod, setPaymentMethod] = useState(
        initialFilters?.payment_method || "cash",
    );
    const [summary, setSummary] = useState({
        total_receipt: 0,
        total_payment: 0,
        receipt_count: 0,
        payment_count: 0,
    });
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [period, setPeriod] = useState({
        start_date: "",
        end_date: "",
    });
    const [accountInfo, setAccountInfo] = useState({
        payment_method: "cash",
        payment_method_name: "Tiền mặt",
        account_code: "111",
        account_name: "Tiền mặt",
    });
    const [systems, setSystems] = useState({});
    const [isPrinting, setIsPrinting] = useState(false);

    // Ref cho component in
    const printRef = useRef(null);

    // Danh sách phương thức thanh toán
    const paymentMethods = [
        { value: "cash", label: "Tiền mặt", icon: CreditCard },
        { value: "bank", label: "Chuyển khoản", icon: Landmark },
    ];

    // Các tùy chọn khoảng thời gian nhanh
    const quickRanges = [
        { label: "Hôm nay", days: 0 },
        { label: "7 ngày qua", days: 7 },
        { label: "30 ngày qua", days: 30 },
        { label: "Tháng này", type: "month" },
        { label: "Tháng trước", type: "prevMonth" },
        { label: "Quý này", type: "quarter" },
        { label: "Năm nay", type: "year" },
    ];

    // Xử lý chọn khoảng thời gian nhanh
    const handleQuickRange = (range) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (range.type === "month") {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (range.type === "prevMonth") {
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (range.type === "quarter") {
            const quarter = Math.floor(today.getMonth() / 3);
            start = new Date(today.getFullYear(), quarter * 3, 1);
            end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        } else if (range.type === "year") {
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31);
        } else if (range.days === 0) {
            // Hôm nay
            start = today;
            end = today;
        } else {
            // days ago
            start = new Date(today);
            start.setDate(today.getDate() - range.days);
            end = today;
        }

        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                start_date: startDate,
                end_date: endDate,
                payment_method: paymentMethod,
            };

            const res = await axios.post(
                route("admin.book.cash.filter"),
                params,
            );

            const response = res.data;

            if (!response.success) {
                throw new Error(response.message || "Không thể tải dữ liệu");
            }

            console.log("Dữ liệu từ API:", response.data);

            // Lưu thông tin tài khoản
            if (response.data.account_code) {
                setAccountInfo({
                    payment_method: response.data.payment_method,
                    payment_method_name: response.data.payment_method_name,
                    account_code: response.data.account_code,
                    account_name: response.data.account_name,
                });
            }

            // Lưu dữ liệu giao dịch
            setData(response.data.data || []);

            // Lưu summary
            if (response.data.summary) {
                setSummary({
                    total_receipt: response.data.summary.total_receipt || 0,
                    total_payment: response.data.summary.total_payment || 0,
                    receipt_count: response.data.summary.receipt_count || 0,
                    payment_count: response.data.summary.payment_count || 0,
                });
            }

            // Lưu số dư
            setOpeningBalance(response.data.opening_balance || 0);
            setClosingBalance(response.data.closing_balance || 0);

            // Lưu kỳ báo cáo
            if (response.data.period) {
                setPeriod(response.data.period);
            }

            // Lưu systems từ response
            if (response.systems) {
                setSystems(response.systems);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            toast.error(
                error.response?.data?.message || "Không thể tải dữ liệu!",
            );
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, paymentMethod]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
        toast.success("Đã làm mới dữ liệu");
    };

    // Xử lý in trực tiếp
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `So-quy-${accountInfo.payment_method}-${startDate}-${endDate}`,
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
            }
        `,
        onBeforeGetContent: async () => {
            setIsPrinting(true);
            toast.loading("Đang chuẩn bị in...", { id: "print-loading" });
        },
        onAfterPrint: () => {
            setIsPrinting(false);
            toast.dismiss("print-loading");
            toast.success("Đã gửi lệnh in thành công!");
        },
        onPrintError: (error) => {
            setIsPrinting(false);
            toast.dismiss("print-loading");
            console.error("Print error:", error);
            toast.error("Có lỗi khi in! Vui lòng thử lại.");
        },
    });

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Sổ Quỹ",
                },
            ]}
        >
            <Head title="Sổ Quỹ" />

            {/* Component in ẩn */}
            <div style={{ display: "none" }}>
                <CashBookPrint
                    ref={printRef}
                    result={{
                        payment_method: accountInfo.payment_method,
                        payment_method_name: accountInfo.payment_method_name,
                        account_code: accountInfo.account_code,
                        account_name: accountInfo.account_name,
                        start_date: period.start_date,
                        end_date: period.end_date,
                        period: period,
                        opening_balance: openingBalance,
                        closing_balance: closingBalance,
                        data: data,
                        summary: summary,
                    }}
                    systems={systems}
                />
            </div>

            {/* Period Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                SỔ QUỸ {accountInfo.payment_method_name} - TÀI
                                KHOẢN {accountInfo.account_code}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                Từ ngày {period.start_date} đến ngày{" "}
                                {period.end_date}
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">
                        <Wallet className="h-4 w-4 mr-1" />
                        {accountInfo.payment_method_name}
                    </Badge>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    {
                        title: "Số dư đầu kỳ",
                        value: openingBalance,
                        date: period.start_date,
                        icon: DollarSign,
                        color: "blue",
                        bgColor: "bg-blue-100",
                        textColor: "text-blue-600",
                        subText: `Tại ngày ${period.start_date}`,
                    },
                    {
                        title: "Tổng thu",
                        value: summary.total_receipt,
                        count: summary.receipt_count,
                        icon: TrendingUp,
                        color: "green",
                        bgColor: "bg-green-100",
                        textColor: "text-green-600",
                        subText: `${summary.receipt_count} giao dịch`,
                    },
                    {
                        title: "Tổng chi",
                        value: summary.total_payment,
                        count: summary.payment_count,
                        icon: TrendingDown,
                        color: "red",
                        bgColor: "bg-red-100",
                        textColor: "text-red-600",
                        subText: `${summary.payment_count} giao dịch`,
                    },
                    {
                        title: "Số dư cuối kỳ",
                        value: closingBalance,
                        date: period.end_date,
                        icon: DollarSign,
                        color: "purple",
                        bgColor: "bg-purple-100",
                        textColor: "text-purple-600",
                        subText: `Tại ngày ${period.end_date}`,
                    },
                ].map((stat, index) => (
                    <Card
                        key={index}
                        className={`border-l-4 border-l-${stat.color}-500 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-1">
                                <p className="text-xs text-slate-500">
                                    {stat.title}
                                </p>
                                <div
                                    className={`h-6 w-6 rounded-full ${stat.bgColor} flex items-center justify-center`}
                                >
                                    <stat.icon
                                        className={`h-3 w-3 ${stat.textColor}`}
                                    />
                                </div>
                            </div>
                            <p
                                className={`text-base font-bold ${stat.textColor}`}
                            >
                                {formatCurrency(stat.value)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                                {stat.subText}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Cash Flow Trend */}
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 mb-1">
                            Biến động dòng tiền
                        </p>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Đầu kỳ:
                                </span>
                                <span className="text-sm font-semibold text-blue-600">
                                    {formatCurrency(openingBalance)}
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Thu:
                                </span>
                                <span className="text-sm font-semibold text-green-600">
                                    +{formatCurrency(summary.total_receipt)}
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Chi:
                                </span>
                                <span className="text-sm font-semibold text-red-600">
                                    -{formatCurrency(summary.total_payment)}
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Cuối kỳ:
                                </span>
                                <span className="text-sm font-semibold text-purple-600">
                                    {formatCurrency(closingBalance)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER - Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <Wallet className="h-6 w-6" />
                                Sổ Quỹ {accountInfo.payment_method_name}
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Theo dõi các giao dịch thu chi{" "}
                                {accountInfo.payment_method_name.toLowerCase()}{" "}
                                trong kỳ.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Payment Method Filter */}
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                            >
                                <SelectTrigger className="w-[180px] bg-white/20 text-white border-white/30 focus:ring-white">
                                    <SelectValue placeholder="Chọn loại quỹ" />
                                </SelectTrigger>
                                <SelectContent className="dropdown-premium-content">
                                    {paymentMethods.map((method) => (
                                        <SelectItem
                                            key={method.value}
                                            value={method.value}
                                            className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                        >
                                            <span className="flex items-center gap-2">
                                                <method.icon className="h-4 w-4" />
                                                {method.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleRefresh}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Làm mới
                            </Button>

                            <Button
                                onClick={handlePrint}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                                disabled={isPrinting || loading}
                            >
                                {isPrinting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Printer className="w-4 h-4 mr-2" />
                                )}
                                {isPrinting ? "Đang in..." : "In sổ quỹ"}
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    {/* Filter Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                                        Khoảng thời gian
                                    </label>
                                    <RangeDatePicker
                                        startDate={startDate}
                                        endDate={endDate}
                                        onStartDateChange={setStartDate}
                                        onEndDateChange={setEndDate}
                                        placeholder="Chọn khoảng thời gian"
                                        clearable={true}
                                        minDate="2020-01-01" // Giới hạn tối thiểu
                                        maxDate="2030-12-31" // Giới hạn tối đa
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={fetchData}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 min-w-[120px]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Filter className="w-4 h-4 mr-2" />
                                )}
                                {loading ? "Đang lọc..." : "Lọc dữ liệu"}
                            </Button>
                        </div>

                        {/* Quick Range Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className="text-sm text-slate-500 py-1">
                                Nhanh:
                            </span>
                            {quickRanges.map((range, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickRange(range)}
                                    className="text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <CashBookTable
                        data={data}
                        loading={loading}
                        accountInfo={accountInfo}
                    />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
