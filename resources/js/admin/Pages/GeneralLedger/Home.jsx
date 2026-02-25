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
    BarChart3,
    Wallet,
    BookOpen,
    ArrowRight,
    Loader2,
    Search,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import GeneralLedgerTable from "@/admin/components/pages/book/GeneralLedgerTable";
import { Head } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { formatCurrency } from "@/admin/utils/helpers";
import { useReactToPrint } from "react-to-print";
import GeneralLedgerPrint from "@/admin/components/shared/print/GeneralLedgerPrint";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import { RangeDatePicker } from "@/admin/components/ui/date-picker";

export default function GeneralLedgerIndex({ initialFilters, accounts }) {
    useFlashToast();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(
        initialFilters?.start_date || getDefaultStartDate(),
    );
    const [endDate, setEndDate] = useState(
        initialFilters?.end_date || getDefaultEndDate(),
    );
    const [accountCode, setAccountCode] = useState(
        initialFilters?.account_code || "111",
    );
    const [summary, setSummary] = useState({
        total_debit: 0,
        total_credit: 0,
        transaction_count: 0,
    });
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [period, setPeriod] = useState({
        start_date: "",
        end_date: "",
    });
    const [accountInfo, setAccountInfo] = useState({
        code: "111",
        name: "Tiền mặt",
        normal_balance: "debit",
    });
    const [systems, setSystems] = useState({});
    const [isPrinting, setIsPrinting] = useState(false);

    // Ref cho component in
    const printRef = useRef(null);

    // Hàm lấy ngày mặc định
    function getDefaultStartDate() {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split("T")[0];
    }

    function getDefaultEndDate() {
        const date = new Date();
        return date.toISOString().split("T")[0];
    }

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
                account_code: accountCode,
            };

            const res = await axios.post(
                route("admin.book.ledger.filter"),
                params,
            );

            const response = res.data;

            if (!response.success) {
                throw new Error(response.message || "Không thể tải dữ liệu");
            }

            console.log("Dữ liệu từ API:", response.data);

            // Lưu thông tin tài khoản
            if (response.data.account) {
                setAccountInfo({
                    code: response.data.account.code,
                    name: response.data.account.name,
                    normal_balance:
                        response.data.account.normal_balance || "debit",
                });
            }

            // Lưu dữ liệu giao dịch
            setData(response.data.data || []);

            // Lưu summary
            if (response.data.summary) {
                setSummary({
                    total_debit: response.data.summary.total_debit || 0,
                    total_credit: response.data.summary.total_credit || 0,
                    transaction_count:
                        response.data.summary.transaction_count || 0,
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
    }, [startDate, endDate, accountCode]);

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
        documentTitle: `So-cai-${accountInfo.code}-${startDate}-${endDate}`,
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

    // Format options cho SelectCombobox
    const accountOptions = accounts.map((account) => ({
        value: account.code,
        label: account.display_name,
    }));

    const balanceTypeLabel =
        accountInfo.normal_balance === "debit" ? "Nợ" : "Có";

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Sổ Cái",
                },
            ]}
        >
            <Head title="Sổ Cái" />

            {/* Component in ẩn */}
            <div style={{ display: "none" }}>
                <GeneralLedgerPrint
                    ref={printRef}
                    result={{
                        account: accountInfo,
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
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                SỔ CÁI - TÀI KHOẢN {accountInfo.code}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {accountInfo.name} | Từ ngày {period.start_date}{" "}
                                đến ngày {period.end_date}
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Sổ cái
                    </Badge>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Dư {balanceTypeLabel} đầu kỳ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(openingBalance)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Tại ngày {period.start_date}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Phát sinh Nợ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary.total_debit)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Phát sinh Có
                            </p>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(summary.total_credit)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Dư {balanceTypeLabel} cuối kỳ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(closingBalance)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Tại ngày {period.end_date}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER - Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <BookOpen className="h-6 w-6" />
                                Sổ Cái - Tài khoản {accountInfo.code}
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Chi tiết phát sinh của tài khoản{" "}
                                {accountInfo.name} trong kỳ.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Account Filter - Sử dụng SelectCombobox */}
                            <div className="w-[300px]">
                                <SelectCombobox
                                    label=""
                                    value={accountCode}
                                    onChange={setAccountCode}
                                    options={accountOptions}
                                    placeholder="Chọn tài khoản..."
                                    searchPlaceholder="Tìm kiếm tài khoản..."
                                    icon={<Search className="h-4 w-4" />}
                                />
                            </div>

                            <Button
                                onClick={handleRefresh}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Làm mới
                            </Button>

                            {/* <Button
                                onClick={handleExport}
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Xuất Excel
                            </Button> */}

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
                                {isPrinting ? "Đang in..." : "In sổ cái"}
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    {/* Filter Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
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
                                />
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

                    <GeneralLedgerTable
                        data={data}
                        loading={loading}
                        accountInfo={accountInfo}
                        openingBalance={openingBalance}
                        closingBalance={closingBalance}
                        summary={summary}
                    />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}