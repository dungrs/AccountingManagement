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
    Plus,
    Filter,
    RefreshCw,
    Wallet,
    TrendingUp, // Đổi từ TrendingDown thành TrendingUp
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    Landmark,
    CreditCard,
    Users, // Thêm icon cho khách hàng
    Receipt, // Thêm icon cho phiếu thu
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ConfirmDeleteDialog from "@/admin/components/shared/common/ConfirmDeleteDialog";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { cn } from "@/admin/lib/utils";
import { formatCurrency } from "@/admin/utils/helpers";
import ReceiptVoucherTable from "@/admin/components/pages/receiept-voucher/ReceiptVoucherTable";

export default function ReceiptVoucherHome() {
    useFlashToast();

    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("20");
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deletingRow, setDeletingRow] = useState(null);
    const [paginationData, setPaginationData] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

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
                };

                if (statusFilter !== "all") {
                    params.status = statusFilter;
                }

                if (paymentMethodFilter !== "all") {
                    params.payment_method = paymentMethodFilter;
                }

                const res = await axios.post(
                    route("admin.voucher.receipt.filter"), // Đổi route
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    code: item.code ?? "-",
                    voucher_date: item.voucher_date ?? "-",
                    customer_id: item.customer_id, // Đổi từ supplier_id
                    customer_name: item.customer_name ?? "-", // Đổi từ supplier_name
                    amount: item.amount ?? 0,
                    payment_method: item.payment_method ?? "cash",
                    note: item.note ?? "",
                    status: item.status ?? "draft",
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                }));

                console.log("Dữ liệu phiếu thu:", mappedData);

                setData(mappedData);
                setPaginationData({
                    current_page: response.current_page || 1,
                    last_page: response.last_page || 1,
                    per_page: response.per_page || parseInt(pageSize),
                    total: response.total || 0,
                    from: response.from || 0,
                    to: response.to || 0,
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
        [pageSize, debouncedKeyword, statusFilter, paymentMethodFilter],
    );

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const handleDeleteClick = (row) => {
        setDeletingRow(row);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRow) return;

        try {
            const res = await axios.post(
                route("admin.voucher.receipt.delete", deletingRow.id), // Đổi route
            );

            toast.success(res.data?.message || "Xóa thành công!");
            setOpenDeleteDialog(false);
            setDeletingRow(null);
            fetchData(paginationData.current_page);
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            toast.error(
                err.response?.data?.message ||
                    "Có lỗi xảy ra, vui lòng thử lại!",
            );
        }
    };

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

    const handleRefresh = () => {
        fetchData(paginationData.current_page);
        toast.success("Đã làm mới dữ liệu");
    };

    // Thống kê
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const draftCount = data.filter((item) => item.status === "draft").length;
    const confirmedCount = data.filter(
        (item) => item.status === "confirmed",
    ).length;
    const cashCount = data.filter(
        (item) => item.payment_method === "cash",
    ).length;
    const bankCount = data.filter(
        (item) => item.payment_method === "bank",
    ).length;

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản Lý Phiếu Thu", // Đổi label
                },
            ]}
        >
            <Head title="Quản Lý Phiếu Thu" /> {/* Đổi title */}
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng phiếu thu {/* Đổi text */}
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {paginationData.total}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-blue-600" />{" "}
                            {/* Đổi icon */}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Đã xác nhận
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {confirmedCount}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nháp
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {draftCount}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng thu {/* Đổi text */}
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(totalAmount)}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-purple-600" />{" "}
                            {/* Đổi icon */}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Payment Method Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-800">
                                    Tiền mặt
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {cashCount} phiếu
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-blue-200 text-blue-800 border-blue-300">
                            {((cashCount / (data.length || 1)) * 100).toFixed(
                                1,
                            )}
                            %
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                                <Landmark className="h-5 w-5 text-purple-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-800">
                                    Chuyển khoản
                                </p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {bankCount} phiếu
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-purple-200 text-purple-800 border-purple-300">
                            {((bankCount / (data.length || 1)) * 100).toFixed(
                                1,
                            )}
                            %
                        </Badge>
                    </CardContent>
                </Card>
            </div>
            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER - Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <Wallet className="h-6 w-6" />
                                Quản Lý Phiếu Thu {/* Đổi text */}
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Quản lý danh sách phiếu thu, khách hàng, ngày
                                thu và trạng thái. {/* Đổi text */}
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
                                className="btn-gradient-premium rounded-md shadow-lg"
                                onClick={() =>
                                    router.visit(
                                        route("admin.voucher.receipt.create"), // Đổi route
                                    )
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm phiếu thu {/* Đổi text */}
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo mã phiếu, khách hàng hoặc ghi chú..." // Đổi placeholder
                        className="bg-white"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />

                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] rounded-md border-slate-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>

                                <SelectContent className="dropdown-premium-content">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        Tất cả trạng thái
                                    </SelectItem>
                                    <SelectItem
                                        value="draft"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                            Nháp
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        value="confirmed"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            Đã xác nhận
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Payment Method Filter */}
                            <Select
                                value={paymentMethodFilter}
                                onValueChange={setPaymentMethodFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] rounded-md border-slate-200 focus:ring-purple-500">
                                    <SelectValue placeholder="Phương thức" />
                                </SelectTrigger>

                                <SelectContent className="dropdown-premium-content">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        Tất cả phương thức
                                    </SelectItem>
                                    <SelectItem
                                        value="cash"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <CreditCard className="h-3 w-3 text-blue-600" />
                                            Tiền mặt
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        value="bank"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Landmark className="h-3 w-3 text-purple-600" />
                                            Chuyển khoản
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTableFilter>

                    <ReceiptVoucherTable
                        data={data}
                        loading={loading}
                        selectedRows={selectedRows}
                        toggleAll={toggleAll}
                        toggleRow={toggleRow}
                        handleDeleteClick={handleDeleteClick}
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
            <ConfirmDeleteDialog
                open={openDeleteDialog}
                title="Xóa phiếu thu" // Đổi title
                description={`Bạn có chắc chắn muốn xóa phiếu thu "${deletingRow?.code}" không?`} // Đổi description
                onCancel={() => {
                    setOpenDeleteDialog(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}