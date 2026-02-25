"use client";

import { useEffect, useState, useCallback } from "react";
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
    Users,
    FileText,
    ArrowRight,
    BarChart3,
    Loader2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import CustomerDebtTable from "@/admin/components/pages/customer-debt/CustomerDebtTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { formatCurrency } from "@/admin/utils/helpers";
import { RangeDatePicker } from "@/admin/components/ui/date-picker";

export default function CustomerDebtIndex({ initialFilters }) {
    useFlashToast();

    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState(
        initialFilters?.perpage?.toString() || "20",
    );
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [startDate, setStartDate] = useState(
        initialFilters?.start_date || getDefaultStartDate(),
    );
    const [endDate, setEndDate] = useState(
        initialFilters?.end_date || getDefaultEndDate(),
    );
    const [referenceType, setReferenceType] = useState("all");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({
        opening_balance: 0,
        total_debit: 0,
        total_credit: 0,
        closing_balance: 0,
    });
    const [period, setPeriod] = useState({
        start_date: "",
        end_date: "",
    });
    const [paginationData, setPaginationData] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });

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

    // Debounce keyword search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const params = {
                    page,
                    perpage: parseInt(pageSize),
                    keyword: debouncedKeyword.trim(),
                    start_date: startDate,
                    end_date: endDate,
                    reference_type:
                        referenceType !== "all" ? referenceType : undefined,
                };

                const res = await axios.post(
                    route("admin.debt.customer.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                console.log("Dữ liệu từ API:", response);

                // Mapping dữ liệu tổng hợp theo từng khách hàng
                const mappedData = response.data.map((item) => ({
                    id: item.customer_id,
                    customer_id: item.customer_id,
                    customer_name: item.customer_name ?? "-",
                    tax_code: item.tax_code ?? "",
                    phone: item.phone ?? "",
                    email: item.email ?? "",
                    address: item.address ?? "",
                    opening_balance: parseFloat(item.opening_balance) || 0,
                    total_debit: parseFloat(item.total_debit) || 0,
                    total_credit: parseFloat(item.total_credit) || 0,
                    closing_balance: parseFloat(item.closing_balance) || 0,
                    transaction_count: item.transaction_count || 0,
                }));

                console.log("Dữ liệu mapped:", mappedData);

                setData(mappedData);

                // Lưu summary và period từ response
                if (response.summary) {
                    setSummary({
                        opening_balance: response.summary.opening_balance || 0,
                        total_debit: response.summary.total_debit || 0,
                        total_credit: response.summary.total_credit || 0,
                        closing_balance: response.summary.closing_balance || 0,
                    });
                }

                if (response.period) {
                    setPeriod(response.period);
                }

                setPaginationData({
                    current_page: response.pagination?.current_page || 1,
                    last_page: response.pagination?.last_page || 1,
                    per_page:
                        response.pagination?.per_page || parseInt(pageSize),
                    total: response.pagination?.total || 0,
                    from: response.pagination?.from || 0,
                    to: response.pagination?.to || 0,
                });
                setSelectedRows([]);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                toast.error(
                    error.response?.data?.message || "Không thể tải dữ liệu!",
                );
                setData([]);
                setPaginationData({
                    current_page: 1,
                    last_page: 1,
                    per_page: parseInt(pageSize),
                    total: 0,
                    from: 0,
                    to: 0,
                });
            } finally {
                setLoading(false);
            }
        },
        [pageSize, debouncedKeyword, startDate, endDate, referenceType],
    );

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const toggleRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === data.length && data.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(data.map((item) => item.customer_id));
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= paginationData.last_page) {
            fetchData(page);
        }
    };

    const goToFirstPage = () => goToPage(1);
    const goToPreviousPage = () => goToPage(paginationData.current_page - 1);
    const goToNextPage = () => goToPage(paginationData.current_page + 1);
    const goToLastPage = () => goToPage(paginationData.last_page);

    const handleChangePageSize = (value) => {
        setPageSize(value);
    };

    const handleViewDetail = (row) => {
        router.get(route("admin.debt.customer.details", row.customer_id), {
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleRefresh = () => {
        fetchData(paginationData.current_page);
        toast.success("Đã làm mới dữ liệu");
    };

    const handleExport = () => {
        toast.success("Đang xuất báo cáo...");
        // Implement export functionality
    };

    const handlePrint = () => {
        router.get(route("admin.debt.customer.print"), {
            start_date: startDate,
            end_date: endDate,
            reference_type: referenceType !== "all" ? referenceType : undefined,
            keyword: debouncedKeyword,
        });
    };

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Công Nợ Khách Hàng",
                },
            ]}
        >
            <Head title="Công Nợ Khách Hàng" />

            {/* Period Info */}
            <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-xl font-bold">
                                Báo cáo công nợ khách hàng
                            </h2>
                            <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">
                                Từ ngày {period.start_date} đến ngày{" "}
                                {period.end_date}
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-[10px] sm:text-xs h-6 sm:h-7 w-fit">
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Báo cáo công nợ
                    </Badge>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    {
                        title: "Dư đầu kỳ",
                        value: summary.opening_balance,
                        date: period.start_date,
                        icon: DollarSign,
                        color: "blue",
                        bgColor: "bg-blue-100",
                        textColor: "text-blue-600",
                    },
                    {
                        title: "PS Nợ",
                        value: summary.total_debit,
                        subText: "Bán hàng trong kỳ",
                        icon: TrendingUp,
                        color: "green",
                        bgColor: "bg-green-100",
                        textColor: "text-green-600",
                    },
                    {
                        title: "PS Có",
                        value: summary.total_credit,
                        subText: "Thu tiền trong kỳ",
                        icon: TrendingDown,
                        color: "red",
                        bgColor: "bg-red-100",
                        textColor: "text-red-600",
                    },
                    {
                        title: "Dư cuối kỳ",
                        value: summary.closing_balance,
                        date: period.end_date,
                        icon: DollarSign,
                        color: "purple",
                        bgColor: "bg-purple-100",
                        textColor: "text-purple-600",
                    },
                ].map((stat, index) => (
                    <Card
                        key={index}
                        className={`border-l-4 border-l-${stat.color}-500 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                                <p className="text-xs text-slate-500">
                                    {stat.title}
                                </p>
                                <div
                                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full ${stat.bgColor} flex items-center justify-center`}
                                >
                                    <stat.icon
                                        className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.textColor}`}
                                    />
                                </div>
                            </div>
                            <p
                                className={`text-base sm:text-lg font-bold ${stat.textColor}`}
                            >
                                {formatCurrency(stat.value)}
                            </p>
                            {stat.date ? (
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                                    Tại ngày {stat.date}
                                </p>
                            ) : (
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                                    {stat.subText}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Balance Trend */}
            <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 w-full">
                        <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">
                            Biến động công nợ
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs text-slate-500">
                                    Dư đầu:
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-blue-600">
                                    {formatCurrency(summary.opening_balance)}
                                </span>
                            </div>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs text-slate-500">
                                    Bán hàng:
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-green-600">
                                    +{formatCurrency(summary.total_debit)}
                                </span>
                            </div>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs text-slate-500">
                                    Thu tiền:
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-red-600">
                                    -{formatCurrency(summary.total_credit)}
                                </span>
                            </div>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs text-slate-500">
                                    Dư cuối:
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-purple-600">
                                    {formatCurrency(summary.closing_balance)}
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
                                <Users className="h-6 w-6" />
                                Công Nợ Khách Hàng
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Tổng hợp công nợ theo từng khách hàng trong kỳ.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
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
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                In báo cáo
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo tên KH, mã số thuế, số điện thoại..."
                        className="bg-white"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />

                            {/* Date Range Picker */}
                            <div className="min-w-[300px]">
                                <RangeDatePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onStartDateChange={setStartDate}
                                    onEndDateChange={setEndDate}
                                    placeholder="Chọn khoảng thời gian"
                                    clearable={true}
                                />
                            </div>

                            {/* Quick Range Buttons */}
                            <div className="flex flex-wrap gap-1">
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

                            {/* Reference Type Filter */}
                            <Select
                                value={referenceType}
                                onValueChange={setReferenceType}
                            >
                                <SelectTrigger className="w-[180px] rounded-md border-slate-200 focus:ring-green-500">
                                    <SelectValue placeholder="Loại chứng từ" />
                                </SelectTrigger>
                                <SelectContent className="dropdown-premium-content">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        Tất cả
                                    </SelectItem>
                                    <SelectItem
                                        value="sales_receipt"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-blue-600" />
                                            Phiếu xuất
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        value="receipt_voucher"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-purple-600" />
                                            Phiếu thu
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => fetchData(1)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Filter className="w-4 h-4 mr-2" />
                                )}
                                {loading ? "Đang lọc..." : "Lọc"}
                            </Button>
                        </div>
                    </DataTableFilter>

                    <CustomerDebtTable
                        data={data}
                        loading={loading}
                        selectedRows={selectedRows}
                        toggleAll={toggleAll}
                        toggleRow={toggleRow}
                        handleViewDetail={handleViewDetail}
                    />

                    <DataTablePagination
                        selectedCount={selectedRows.length}
                        total={paginationData.total}
                        currentPage={paginationData.current_page}
                        lastPage={paginationData.last_page}
                        pageSize={pageSize}
                        setPageSize={handleChangePageSize}
                        goToFirstPage={goToFirstPage}
                        goToPreviousPage={goToPreviousPage}
                        goToNextPage={goToNextPage}
                        goToLastPage={goToLastPage}
                    />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
