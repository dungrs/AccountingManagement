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
import { Plus, Shield, Key, Filter, RefreshCw, Lock } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import PermissionFormModal from "@/admin/components/pages/permission/PermissionFormModal";
import ConfirmDeleteDialog from "@/admin/components/shared/common/ConfirmDeleteDialog";
import PermissionTable from "@/admin/components/pages/permission/PermissionTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head } from "@inertiajs/react";
import { cn } from "@/admin/lib/utils";

export default function UserCatalogue() {
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);

    const [pageSize, setPageSize] = useState("20");
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");

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

                const res = await axios.post(
                    route("admin.permission.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    name: item.name || "",
                    canonical: item.canonical || "",
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
        [pageSize, debouncedKeyword],
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
            const res = await axios.post(route("admin.permission.delete"), {
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

    const handleRefresh = () => {
        fetchData(paginationData.current_page);
        toast.success("Đã làm mới dữ liệu");
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

    return (
        <AdminLayout
            breadcrumb={{
                parent: {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                current: "Quản Lý Quyền",
            }}
        >
            <Head title="Quản Lý Quyền" />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng quyền
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {paginationData.total}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Đang hiển thị
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {data.length}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Key className="h-6 w-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Trang hiện tại
                            </p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {paginationData.current_page}/
                                {paginationData.last_page}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-indigo-600" />
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
                                <Shield className="h-6 w-6" />
                                Quản Lý Quyền
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Quản lý danh sách quyền trong hệ thống
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
                                Thêm quyền mới
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    {/* FILTER */}
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo tên quyền, mã quyền..."
                        className="bg-white"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </div>
                    </DataTableFilter>

                    {/* DATA TABLE */}
                    <PermissionTable
                        data={data}
                        loading={loading}
                        handleEdit={handleEdit}
                        handleDeleteClick={handleDeleteClick}
                    />

                    {/* FOOTER */}
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

            {/* Modal */}
            <PermissionFormModal
                open={openModal}
                mode={modalMode}
                data={editingRow}
                onClose={() => setOpenModal(false)}
                onSuccess={() => fetchData(paginationData.current_page)}
            />

            {/* Delete Dialog */}
            <ConfirmDeleteDialog
                open={openDeleteDialog}
                title="Xóa quyền"
                description={`Bạn có chắc chắn muốn xóa quyền "${deletingRow?.name}" không?`}
                onCancel={() => {
                    setOpenDeleteDialog(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}