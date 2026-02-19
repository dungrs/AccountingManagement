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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    MoreHorizontal,
    Plus,
    CheckCircle2,
    XCircle,
    Receipt,
    Filter,
    RefreshCw,
    Percent,
    ArrowUpRight,
    ArrowDownRight,
    Calculator,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import VatTaxFormModal from "@/admin/components/pages/vattax/VatTaxFormModal";
import ConfirmDeleteDialog from "@/admin/components/shared/common/ConfirmDeleteDialog";
import VatTaxTable from "@/admin/components/pages/vattax/VatTaxTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head } from "@inertiajs/react";
import { useBulkUpdateStatus } from "@/admin/hooks/useBulkUpdateStatus";
import { cn } from "@/admin/lib/utils";

export default function Home() {
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("20");
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editingRow, setEditingRow] = useState(null);
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

    const bulkUpdateStatus = useBulkUpdateStatus(
        selectedRows,
        setData,
        setSelectedRows,
    );

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
                    params.publish = parseInt(statusFilter);
                }

                const res = await axios.post(
                    route("admin.vattax.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    code: item.code,
                    name: item.name,
                    rate: item.rate,
                    direction: item.direction, // "input" hoặc "output"
                    description: item.description || "",
                    active: item.publish === 1,
                }));

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
        [pageSize, debouncedKeyword, statusFilter],
    );

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const handleCreate = () => {
        setModalMode("create");
        setEditingRow(null);
        setOpenModal(true);
    };

    const handleEdit = (row) => {
        setModalMode("edit");
        setEditingRow(row);
        setOpenModal(true);
    };

    const handleDeleteClick = (row) => {
        setDeletingRow(row);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRow) return;

        try {
            const res = await axios.post(route("admin.vattax.delete"), {
                id: deletingRow.id,
            });

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
    const activeCount = data.filter((item) => item.active).length;
    const inactiveCount = data.filter((item) => !item.active).length;
    const inputCount = data.filter((item) => item.direction === "input").length;
    const outputCount = data.filter(
        (item) => item.direction === "output",
    ).length;
    const averageRate =
        data.length > 0
            ? (
                  data.reduce((sum, item) => sum + item.rate, 0) / data.length
              ).toFixed(1)
            : 0;

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản Lý Thuế VAT",
                },
            ]}
        >
            <Head title="Quản Lý Thuế VAT" />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng thuế
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {paginationData.total}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Thuế suất TB
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {averageRate}%
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Percent className="h-6 w-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Đang hoạt động
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {activeCount}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Ngừng hoạt động
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {inactiveCount}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Direction Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <ArrowDownRight className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Đầu vào
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                    {inputCount} thuế
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Mua hàng
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <ArrowUpRight className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Đầu ra
                                </p>
                                <p className="text-xl font-bold text-purple-600">
                                    {outputCount} thuế
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            Bán hàng
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
                                <Receipt className="h-6 w-6" />
                                Quản Lý Thuế VAT
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Quản lý danh mục thuế VAT đầu vào / đầu ra
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
                                onClick={handleCreate}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm thuế VAT
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="dropdown-premium-content rounded-md w-56"
                                >
                                    <DropdownMenuItem
                                        className={cn(
                                            "cursor-pointer dropdown-premium-item",
                                            selectedRows.length === 0 &&
                                                "opacity-50 cursor-not-allowed",
                                        )}
                                        disabled={selectedRows.length === 0}
                                        onClick={() =>
                                            bulkUpdateStatus(true, "VatTax", "")
                                        }
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                        <span className="text-slate-700">
                                            Xuất bản
                                        </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className={cn(
                                            "cursor-pointer dropdown-premium-item",
                                            selectedRows.length === 0 &&
                                                "opacity-50 cursor-not-allowed",
                                        )}
                                        disabled={selectedRows.length === 0}
                                        onClick={() =>
                                            bulkUpdateStatus(
                                                false,
                                                "VatTax",
                                                "",
                                            )
                                        }
                                    >
                                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                        <span className="text-slate-700">
                                            Không xuất bản
                                        </span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo mã, tên thuế..."
                        className="bg-white"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[200px] rounded-md border-slate-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Tình trạng" />
                                </SelectTrigger>

                                <SelectContent className="dropdown-premium-content">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        Tất cả
                                    </SelectItem>
                                    <SelectItem
                                        value="1"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            Đang hoạt động
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        value="0"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                            Ngừng hoạt động
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTableFilter>

                    <VatTaxTable
                        data={data}
                        loading={loading}
                        selectedRows={selectedRows}
                        toggleAll={toggleAll}
                        toggleRow={toggleRow}
                        handleEdit={handleEdit}
                        handleDeleteClick={handleDeleteClick}
                        onToggleActive={(id, newChecked) => {
                            setData((prev) =>
                                prev.map((item) =>
                                    item.id === id
                                        ? { ...item, active: newChecked }
                                        : item,
                                ),
                            );
                        }}
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

            <VatTaxFormModal
                open={openModal}
                mode={modalMode}
                data={editingRow}
                onClose={() => setOpenModal(false)}
                onSuccess={() => fetchData(paginationData.current_page)}
            />

            <ConfirmDeleteDialog
                open={openDeleteDialog}
                title="Xóa thuế VAT"
                description={`Bạn có chắc chắn muốn xóa "${deletingRow?.name}" không?`}
                onCancel={() => {
                    setOpenDeleteDialog(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}