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
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import GeneralJournalTable from "@/admin/components/pages/book/GeneralJournalTable";
import { Head } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { formatCurrency } from "@/admin/utils/helpers";
import { useReactToPrint } from "react-to-print";
import GeneralJournalPrint from "@/admin/components/shared/print/GeneralJournalPrint";
import { RangeDatePicker } from "@/admin/components/ui/date-picker";

export default function GeneralJournalIndex({ initialFilters }) {
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
        initialFilters?.account_code || "all",
    );
    const [summary, setSummary] = useState({
        total_debit: 0,
        total_credit: 0,
        total_entries: 0,
        balance_diff: 0,
    });
    const [period, setPeriod] = useState({ start_date: "", end_date: "" });
    const [accountInfo, setAccountInfo] = useState({
        account_code: "all",
        account_name: "Tất cả tài khoản",
    });
    const [systems, setSystems] = useState({});
    const [isPrinting, setIsPrinting] = useState(false);

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

    const accounts = [
        { value: "all", label: "Tất cả tài khoản" },
        { value: "111", label: "111 - Tiền mặt" },
        { value: "112", label: "112 - Tiền gửi ngân hàng" },
        { value: "131", label: "131 - Phải thu khách hàng" },
        { value: "156", label: "156 - Hàng hóa" },
        { value: "331", label: "331 - Phải trả người bán" },
        { value: "511", label: "511 - Doanh thu bán hàng" },
        { value: "632", label: "632 - Giá vốn hàng bán" },
        { value: "641", label: "641 - Chi phí bán hàng" },
        { value: "642", label: "642 - Chi phí quản lý" },
    ];

    const quickRanges = [
        { label: "Hôm nay", days: 0 },
        { label: "7 ngày qua", days: 7 },
        { label: "30 ngày qua", days: 30 },
        { label: "Tháng này", type: "month" },
        { label: "Tháng trước", type: "prevMonth" },
        { label: "Quý này", type: "quarter" },
        { label: "Năm nay", type: "year" },
    ];

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
            start = today;
            end = today;
        } else {
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
                route("admin.book.journal.filter"),
                params,
            );
            const response = res.data;

            if (!response.success)
                throw new Error(response.message || "Không thể tải dữ liệu");

            if (response.data.account_code) {
                setAccountInfo({
                    account_code: response.data.account_code,
                    account_name: response.data.account_name,
                });
            }

            setData(response.data.data || []);

            if (response.data.summary) {
                setSummary({
                    total_debit: response.data.summary.total_debit || 0,
                    total_credit: response.data.summary.total_credit || 0,
                    total_entries: response.data.summary.total_entries || 0,
                    balance_diff: response.data.summary.balance_diff || 0,
                });
            }

            if (response.data.period) setPeriod(response.data.period);
            if (response.systems) setSystems(response.systems);
        } catch (error) {
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

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `So-nhat-ky-chung-${startDate}-${endDate}`,
        pageStyle: `
            @page { size: A4 landscape; margin: 10mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none !important; }
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
            toast.error("Có lỗi khi in! Vui lòng thử lại.");
        },
    });

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                { label: "Sổ Nhật Ký Chung" },
            ]}
        >
            <Head title="Sổ Nhật Ký Chung" />

            {/* Component in ẩn */}
            <div style={{ display: "none" }}>
                <GeneralJournalPrint
                    ref={printRef}
                    data={{
                        account_code: accountInfo.account_code,
                        account_name: accountInfo.account_name,
                        start_date: period.start_date,
                        end_date: period.end_date,
                        period: period,
                        data: data,
                        summary: summary,
                    }}
                    systems={systems}
                />
            </div>

            {/* Summary Cards - Giống General Ledger */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Tổng phát sinh Nợ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(summary.total_debit)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {summary.total_entries} chứng từ
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Tổng phát sinh Có
                            </p>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary.total_credit)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {summary.total_entries} chứng từ
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Chênh lệch
                            </p>
                            <div
                                className={`h-8 w-8 rounded-full ${
                                    summary.balance_diff === 0
                                        ? "bg-green-100"
                                        : "bg-red-100"
                                } flex items-center justify-center`}
                            >
                                <BarChart3
                                    className={`h-4 w-4 ${
                                        summary.balance_diff === 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                />
                            </div>
                        </div>
                        <p
                            className={`text-2xl font-bold ${
                                summary.balance_diff === 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {formatCurrency(Math.abs(summary.balance_diff))}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {summary.balance_diff === 0
                                ? "Cân đối"
                                : summary.balance_diff > 0
                                  ? "Nợ > Có"
                                  : "Có > Nợ"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Số chứng từ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                            {summary.total_entries}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Trong kỳ</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER - Gradient Header giống General Ledger */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <BookOpen className="h-6 w-6" />
                                Sổ Nhật Ký Chung
                                {accountInfo.account_code !== "all" &&
                                    ` - Tài khoản ${accountInfo.account_code}`}
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                {accountInfo.account_code !== "all"
                                    ? `Chi tiết phát sinh của tài khoản ${accountInfo.account_name} trong kỳ.`
                                    : "Theo dõi tất cả các nghiệp vụ kinh tế phát sinh trong kỳ."}
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Account Filter */}
                            <Select
                                value={accountCode}
                                onValueChange={setAccountCode}
                            >
                                <SelectTrigger className="w-[220px] bg-white/20 text-white border-white/30 focus:ring-white">
                                    <SelectValue placeholder="Chọn tài khoản" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem
                                            key={account.value}
                                            value={account.value}
                                            className="cursor-pointer"
                                        >
                                            {account.label}
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
                                {isPrinting ? "Đang in..." : "In sổ"}
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    {/* Filter Section - Giống General Ledger */}
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

                    {/* Table */}
                    <GeneralJournalTable
                        data={data}
                        loading={loading}
                        accountInfo={accountInfo}
                    />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}