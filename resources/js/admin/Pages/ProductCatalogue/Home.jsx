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
    FolderTree,
    Filter,
    RefreshCw,
    Layers,
    Package,
    FolderOpen,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ConfirmDeleteDialog from "@/admin/components/shared/common/ConfirmDeleteDialog";
import ProductCatalogueTable from "@/admin/components/pages/product-catalogue/ProductCatalogueTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import { useBulkUpdateStatus } from "@/admin/hooks/useBulkUpdateStatus";
import useFlashToast from "@/admin/hooks/useFlashToast";
import { cn } from "@/admin/lib/utils";

export default function Home() {
    useFlashToast();

    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("20");
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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
                    route("admin.product.catalogue.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    name: item.name ?? "-",
                    level: item.level ?? 0,
                    publish: item.publish,
                    active: item.publish === 1,
                    language_id: item.language_id,
                    languages: item.languages || [],
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

    const handleDeleteClick = (row) => {
        setDeletingRow(row);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRow) return;

        try {
            const res = await axios.post(
                route("admin.product.catalogue.delete", deletingRow.id),
            );

            toast.success(res.data?.message || "Xóa nhóm sản phẩm thành công!");
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
    const maxLevel = Math.max(...data.map((item) => item.level), 0);

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản Lý Nhóm Sản Phẩm",
                },
            ]}
        >
            <Head title="Quản Lý Nhóm Sản Phẩm" />

            {/* Header Stats */}
            {/* Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {/* Tổng nhóm */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">
                                    Tổng nhóm
                                </p>
                                <p className="text-base font-bold text-blue-600">
                                    {paginationData.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] h-4">
                                        Tổng số
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <FolderTree className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cấp độ cao nhất */}
                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">
                                    Cấp độ cao nhất
                                </p>
                                <p className="text-base font-bold text-purple-600">
                                    {maxLevel}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] h-4">
                                        Cấp {maxLevel}
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Layers className="h-4 w-4 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Đang hiển thị */}
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">
                                    Đang hiển thị
                                </p>
                                <p className="text-base font-bold text-green-600">
                                    {activeCount}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] h-4">
                                        {paginationData.total > 0
                                            ? (
                                                  (activeCount /
                                                      paginationData.total) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Đang ẩn */}
                <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">
                                    Đang ẩn
                                </p>
                                <p className="text-base font-bold text-red-600">
                                    {inactiveCount}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] h-4">
                                        {paginationData.total > 0
                                            ? (
                                                  (inactiveCount /
                                                      paginationData.total) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER - Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <FolderTree className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                                <span className="truncate">
                                    Quản Lý Nhóm Sản Phẩm
                                </span>
                            </CardTitle>
                            <CardDescription className="text-white/80 text-xs sm:text-sm hidden sm:block">
                                Quản lý nhóm sản phẩm theo cấp bậc, hỗ trợ lọc
                                và hiển thị sản phẩm theo nhóm.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <Button
                                onClick={handleRefresh}
                                variant="secondary"
                                size="sm"
                                className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md text-xs sm:text-sm px-2 sm:px-3"
                            >
                                <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline">
                                    Làm mới
                                </span>
                            </Button>

                            <Button
                                size="sm"
                                className="btn-gradient-premium rounded-md shadow-lg text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() =>
                                    router.visit(
                                        route("admin.product.catalogue.create"),
                                    )
                                }
                            >
                                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline">Thêm</span>
                                <span className="xs:hidden">Tạo</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-md h-8 sm:h-9 w-8 sm:w-9 p-0"
                                    >
                                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="dropdown-premium-content rounded-md w-48 sm:w-56"
                                >
                                    <DropdownMenuItem
                                        className={cn(
                                            "cursor-pointer dropdown-premium-item text-sm",
                                            selectedRows.length === 0 &&
                                                "opacity-50 cursor-not-allowed",
                                        )}
                                        disabled={selectedRows.length === 0}
                                        onClick={() =>
                                            bulkUpdateStatus(
                                                true,
                                                "ProductCatalogue",
                                                "Product",
                                            )
                                        }
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                        <span>Xuất bản</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className={cn(
                                            "cursor-pointer dropdown-premium-item text-sm",
                                            selectedRows.length === 0 &&
                                                "opacity-50 cursor-not-allowed",
                                        )}
                                        disabled={selectedRows.length === 0}
                                        onClick={() =>
                                            bulkUpdateStatus(
                                                false,
                                                "ProductCatalogue",
                                                "Product",
                                            )
                                        }
                                    >
                                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                        <span>Không xuất bản</span>
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
                        placeholder="Tìm kiếm theo tên nhóm sản phẩm..."
                        className="bg-white flex-col sm:flex-row"
                    >
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] rounded-md border-slate-200 focus:ring-blue-500 text-sm">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>

                                <SelectContent className="dropdown-premium-content">
                                    <SelectItem value="all" className="text-sm">
                                        Tất cả
                                    </SelectItem>
                                    <SelectItem value="1" className="text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            Đang hiển thị
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="0" className="text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                            Đang ẩn
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTableFilter>

                    <ProductCatalogueTable
                        data={data}
                        loading={loading}
                        selectedRows={selectedRows}
                        toggleAll={toggleAll}
                        toggleRow={toggleRow}
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

            <ConfirmDeleteDialog
                open={openDeleteDialog}
                title="Xóa nhóm sản phẩm"
                description={`Bạn có chắc chắn muốn xóa nhóm sản phẩm "${deletingRow?.name}" không?`}
                onCancel={() => {
                    setOpenDeleteDialog(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}
