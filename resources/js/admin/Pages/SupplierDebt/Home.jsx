"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
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
import { Download, Printer } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import SupplierDebtTable from "@/admin/components/pages/supplier-debt/SupplierDebtTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { formatCurrency } from "@/admin/utils/helpers";

export default function SupplierDebtIndex() {
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
                    route("admin.debt.supplier.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                console.log("Dữ liệu từ API:", response);

                // Mapping dữ liệu tổng hợp theo từng nhà cung cấp
                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    supplier_id: item.id,
                    supplier_code: item.supplier_code ?? "-",
                    supplier_name: item.supplier_name ?? "-",
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
            setSelectedRows(data.map((item) => item.id));
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
        router.get(route("admin.debt.supplier.details", row.supplier_id), {
            month: period.month,
            year: period.year,
        });
    };

    const handleExport = () => {
        toast.success("Đang xuất báo cáo...");
        // Implement export functionality
    };

    const handlePrint = () => {
        router.get(route("admin.debt.supplier.print"), {
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
                    label: "Công Nợ Nhà Cung Cấp",
                },
            ]}
        >
            <Head title="Công Nợ Nhà Cung Cấp" />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">
                            Tổng dư đầu kỳ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">
                            {formatCurrency(summary.opening_balance)}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                            Đến ngày {period.start_date}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">
                            Tổng PS Nợ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">
                            {formatCurrency(summary.total_debit)}
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                            Đã thanh toán trong kỳ
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">
                            Tổng PS Có
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">
                            {formatCurrency(summary.total_credit)}
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                            Mua hàng trong kỳ
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">
                            Tổng dư cuối kỳ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">
                            {formatCurrency(summary.closing_balance)}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                            Đến ngày {period.end_date}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold mb-1">
                                Công Nợ Nhà Cung Cấp
                            </CardTitle>
                            <CardDescription>
                                Tổng hợp công nợ theo từng nhà cung cấp trong
                                kỳ.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo mã NCC, tên NCC, mã số thuế..."
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Month Filter */}
                            <Select
                                value={month.toString()}
                                onValueChange={(value) =>
                                    setMonth(parseInt(value))
                                }
                            >
                                <SelectTrigger className="w-[120px] rounded-md">
                                    <SelectValue placeholder="Tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem
                                            key={m}
                                            value={m.toString()}
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
                                <SelectTrigger className="w-[120px] rounded-md">
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

                            {/* Reference Type Filter */}
                            <Select
                                value={referenceType}
                                onValueChange={setReferenceType}
                            >
                                <SelectTrigger className="w-[150px] rounded-md">
                                    <SelectValue placeholder="Loại chứng từ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="purchase_receipt">
                                        Phiếu nhập
                                    </SelectItem>
                                    <SelectItem value="payment_voucher">
                                        Phiếu chi
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTableFilter>

                    <SupplierDebtTable
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