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

export default function CashBookIndex() {
    useFlashToast();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [paymentMethod, setPaymentMethod] = useState("cash"); // cash hoặc bank
    const [summary, setSummary] = useState({
        total_receipt: 0,
        total_payment: 0,
        receipt_count: 0,
        payment_count: 0,
    });
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [period, setPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                month,
                year,
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
    }, [month, year, paymentMethod]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
        toast.success("Đã làm mới dữ liệu");
    };

    const handleExport = () => {
        toast.success("Đang xuất báo cáo...");
        // Implement export functionality
    };

    // Xử lý in trực tiếp
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `So-quy-${accountInfo.payment_method}-thang-${month}-${year}`,
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

    // Tạo danh sách tháng và năm
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - 2 + i,
    );

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
                        month: period.month,
                        year: period.year,
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
                                Tháng {period.month} - Năm {period.year} | Từ
                                ngày {period.start_date} đến ngày{" "}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Số dư đầu kỳ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(openingBalance)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Đến ngày {period.start_date}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Tổng thu
                            </p>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary.total_receipt)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {summary.receipt_count} giao dịch
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Tổng chi
                            </p>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(summary.total_payment)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {summary.payment_count} giao dịch
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Số dư cuối kỳ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(closingBalance)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Đến ngày {period.end_date}
                        </p>
                    </CardContent>
                </Card>
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
                        <div className="flex items-center gap-4">
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
                                onClick={handleExport}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Xuất Excel
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
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Filter className="h-4 w-4 text-slate-400" />

                        {/* Month Filter */}
                        <Select
                            value={month.toString()}
                            onValueChange={(value) => setMonth(parseInt(value))}
                        >
                            <SelectTrigger className="w-[120px] rounded-md border-slate-200 focus:ring-blue-500">
                                <SelectValue placeholder="Tháng" />
                            </SelectTrigger>
                            <SelectContent className="dropdown-premium-content">
                                {months.map((m) => (
                                    <SelectItem
                                        key={m}
                                        value={m.toString()}
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        Tháng {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Year Filter */}
                        <Select
                            value={year.toString()}
                            onValueChange={(value) => setYear(parseInt(value))}
                        >
                            <SelectTrigger className="w-[120px] rounded-md border-slate-200 focus:ring-purple-500">
                                <SelectValue placeholder="Năm" />
                            </SelectTrigger>
                            <SelectContent className="dropdown-premium-content">
                                {years.map((y) => (
                                    <SelectItem
                                        key={y}
                                        value={y.toString()}
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        Năm {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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