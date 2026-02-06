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
    Plus,
} from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";

import PermissionFormModal from "@/admin/components/permission/PermissionFormModal";
import ConfirmDeleteDialog from "@/admin/components/common/ConfirmDeleteDialog";
import PermissionTable from "@/admin/components/permission/PermissionTable";
import DataTablePagination from "@/admin/components/common/DataTablePagination";
import DataTableFilter from "@/admin/components/common/DataTableFilter";
import { Head } from "@inertiajs/react";

export default function UserCatalogue() {
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);

    const [pageSize, setPageSize] = useState("10");
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
        }, 500); // Đợi 500ms sau khi người dùng ngừng nhập

        return () => clearTimeout(timer); // Clear timer nếu keyword thay đổi trước khi hết thời gian
    }, [keyword]);

    // 🔥 Fetch data với useCallback để tránh re-render không cần thiết
        const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);

            try {
                const params = {
                    page,
                    perpage: parseInt(pageSize),
                    keyword: debouncedKeyword.trim(), // 🔥 Dùng debouncedKeyword thay vì keyword
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

    // 🔥 Load lần đầu
    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    // Thêm mới
    const handleCreate = () => {
        setModalMode("create");
        setEditingRow(null);
        setOpenModal(true);
    };

    // Chỉnh sửa
    const handleEdit = (row) => {
        setModalMode("edit");
        setEditingRow(row);
        setOpenModal(true);
    };

    // Xóa
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

            // 🔥 Fetch lại trang hiện tại
            fetchData(paginationData.current_page);
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            toast.error(
                err.response?.data?.message ||
                    "Có lỗi xảy ra, vui lòng thử lại!",
            );
        }
    };


    // Pagination handlers
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
                current: "QL Quyền",
            }}
        >   
            <Head title="Quản Lý Quyền" />
            <Card className="rounded-md shadow-sm">
                {/* HEADER */}
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold mb-1">
                                Quản Lý Quyền
                            </CardTitle>
                            <CardDescription>
                                Quản lý danh sách quyền trong hệ thống
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                className="rounded-md"
                                onClick={handleCreate}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm mới quyền
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* FILTER */}
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm..."
                    >
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
