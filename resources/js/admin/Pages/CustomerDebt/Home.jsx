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
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    ArrowRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import CustomerDebtTable from "@/admin/components/pages/customer-debt/CustomerDebtTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { formatCurrency } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function CustomerDebtIndex() {
    useFlashToast();

    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("20");
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [referenceType, setReferenceType] = useState("all");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({
        opening_balance: 0,
        total_debit: 0,
        total_credit: 0,
        closing_balance: 0,
    });
    const [period, setPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
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
                    month,
                    year,
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
        [pageSize, debouncedKeyword, month, year, referenceType],
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
            month: period.month,
            year: period.year,
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
            month,
            year,
            reference_type: referenceType !== "all" ? referenceType : undefined,
            keyword: debouncedKeyword,
        });
    };

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
                    label: "Công Nợ Khách Hàng",
                },
            ]}
        >
            <Head title="Công Nợ Khách Hàng" />

            {/* Period Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                Kỳ báo cáo: Tháng {period.month} - Năm{" "}
                                {period.year}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                Từ ngày {period.start_date} đến ngày{" "}
                                {period.end_date}
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Báo cáo công nợ
                    </Badge>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Dư đầu kỳ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(summary.opening_balance)}
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
                                PS Nợ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary.total_debit)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Bán hàng trong kỳ
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                PS Có
                            </p>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(summary.total_credit)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Thu tiền trong kỳ
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">
                                Dư cuối kỳ
                            </p>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(summary.closing_balance)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Đến ngày {period.end_date}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Balance Trend */}
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 mb-1">
                            Biến động công nợ
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Dư đầu:
                                </span>
                                <span className="text-sm font-semibold text-blue-600">
                                    {formatCurrency(summary.opening_balance)}
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Bán hàng:
                                </span>
                                <span className="text-sm font-semibold text-green-600">
                                    +{formatCurrency(summary.total_debit)}
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Thu tiền:
                                </span>
                                <span className="text-sm font-semibold text-red-600">
                                    -{formatCurrency(summary.total_credit)}
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Dư cuối:
                                </span>
                                <span className="text-sm font-semibold text-purple-600">
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

                            {/* Month Filter */}
                            <Select
                                value={month.toString()}
                                onValueChange={(value) =>
                                    setMonth(parseInt(value))
                                }
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
                                onValueChange={(value) =>
                                    setYear(parseInt(value))
                                }
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