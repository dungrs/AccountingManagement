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
    ShieldCheck,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import BankFormModal from "@/admin/components/bank/BankFormModal";
import ConfirmDeleteDialog from "@/admin/components/common/ConfirmDeleteDialog";
import BankTable from "@/admin/components/bank/BankTable";
import DataTablePagination from "@/admin/components/common/DataTablePagination";
import DataTableFilter from "@/admin/components/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";

import { useBulkUpdateStatus } from "@/admin/hooks/useBulkUpdateStatus";

export default function Home() {
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("10");
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

    const bulkUpdateStatus = useBulkUpdateStatus(selectedRows, setData, setSelectedRows);

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
                    route("admin.bank.filter"),
                    params
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    bank_code: item.bank_code || "",
                    name: item.name || "",
                    short_name: item.short_name || "",
                    swift_code: item.swift_code || "",
                    bin_code: item.bin_code || "",
                    logo: item.logo || "",
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
                    error.response?.data?.message || "Không thể tải dữ liệu!"
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
        [pageSize, debouncedKeyword, statusFilter]
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
            const res = await axios.post(route("admin.bank.delete"), {
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
                    "Có lỗi xảy ra, vui lòng thử lại!"
            );
        }
    };

    const toggleRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "QL Ngân Hàng",
                },
            ]}
        >
            <Head title="Quản Lý Ngân Hàng" />
            <Card className="rounded-md shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold mb-1">
                                Quản Lý Ngân Hàng
                            </CardTitle>
                            <CardDescription>
                                Quản lý danh mục ngân hàng Việt Nam trong hệ thống.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button className="rounded-md" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm mới ngân hàng
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-md"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="rounded-md"
                                >
                                    {/* 🔥 Sử dụng bulkUpdateStatus từ hook */}
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        disabled={selectedRows.length === 0}
                                        onClick={() =>
                                            bulkUpdateStatus(
                                                true,
                                                "Bank",
                                                ""
                                            )
                                        }
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                        Xuất bản
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        disabled={selectedRows.length === 0}
                                        onClick={() =>
                                            bulkUpdateStatus(
                                                false,
                                                "Bank",
                                                ""
                                            )
                                        }
                                    >
                                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                        Không xuất bản
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm..."
                    >
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-full sm:w-[200px] rounded-md">
                                <SelectValue placeholder="Tình trạng" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="1">Đang hoạt động</SelectItem>
                                <SelectItem value="0">Ngừng hoạt động</SelectItem>
                            </SelectContent>
                        </Select>
                    </DataTableFilter>

                    <BankTable
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
                                        : item
                                )
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

            <BankFormModal
                open={openModal}
                mode={modalMode}
                data={editingRow}
                onClose={() => setOpenModal(false)}
                onSuccess={() => fetchData(paginationData.current_page)}
            />

            <ConfirmDeleteDialog
                open={openDeleteDialog}
                title="Xóa ngân hàng"
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