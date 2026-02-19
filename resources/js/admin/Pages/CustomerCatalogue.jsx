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
    Users,
    UserPlus,
    Filter,
    RefreshCw,
    Tag,
    UserRound,
    UserCheck,
    UserX,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import CustomerCatalogueFormModal from "@/admin/components/pages/customer-catalogue/CustomerCatalogueFormModal";
import ConfirmDeleteDialog from "@/admin/components/shared/common/ConfirmDeleteDialog";
import CustomerCatalogueTable from "@/admin/components/pages/customer-catalogue/CustomerCatalogueTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
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
                    route("admin.customer.catalogue.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    name: item.name || "",
                    email: item.email || "",
                    members: item.customers_count || 0,
                    active: item.publish === 1,
                    description: item.description || "",
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
            const res = await axios.post(
                route("admin.customer.catalogue.delete"),
                {
                    id: deletingRow.id,
                },
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
    const totalMembers = data.reduce((sum, item) => sum + item.members, 0);
    const activeCount = data.filter((item) => item.active).length;
    const inactiveCount = data.filter((item) => !item.active).length;

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản Lý Nhóm Khách Hàng",
                },
            ]}
        >
            <Head title="Quản Lý Nhóm Khách Hàng" />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng nhóm
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {paginationData.total}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Tag className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng khách hàng
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {totalMembers}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-purple-600" />
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
                            <UserCheck className="h-6 w-6 text-green-600" />
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
                            <UserX className="h-6 w-6 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER - Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <Tag className="h-6 w-6" />
                                Quản Lý Nhóm Khách Hàng
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Quản lý các nhóm khách hàng dùng để phân loại và
                                thống kê khách hàng trong hệ thống.
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
                                Thêm mới nhóm
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
                                            bulkUpdateStatus(
                                                true,
                                                "CustomerCatalogue",
                                                "Customer",
                                            )
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
                                                "CustomerCatalogue",
                                                "Customer",
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
                        placeholder="Tìm kiếm theo tên nhóm, email..."
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

                    <CustomerCatalogueTable
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

            <CustomerCatalogueFormModal
                open={openModal}
                mode={modalMode}
                data={editingRow}
                onClose={() => setOpenModal(false)}
                onSuccess={() => fetchData(paginationData.current_page)}
            />

            <ConfirmDeleteDialog
                open={openDeleteDialog}
                title="Xóa nhóm khách hàng"
                description={`Bạn có chắc chắn muốn xóa nhóm "${deletingRow?.name}" không?`}
                onCancel={() => {
                    setOpenDeleteDialog(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}
