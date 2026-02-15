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
import { Plus } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ConfirmDeleteDialog from "@/admin/components/shared/common/ConfirmDeleteDialog";
import PaymentVoucherTable from "@/admin/components/pages/payment-voucher/PaymentVoucherTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import useFlashToast from "@/admin/hooks/useFlashToast";

export default function Home() {
    useFlashToast();

    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("10");
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
                };

                if (statusFilter !== "all") {
                    params.status = statusFilter;
                }

                if (paymentMethodFilter !== "all") {
                    params.payment_method = paymentMethodFilter;
                }

                const res = await axios.post(
                    route("admin.voucher.payment.filter"),
                    params,
                );

                const response = res.data;

                if (!response || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                // Mapping dữ liệu theo schema của bảng payment_vouchers
                const mappedData = response.data.map((item) => ({
                    id: item.id,
                    code: item.code ?? "-",
                    voucher_date: item.voucher_date ?? "-",
                    supplier_id: item.supplier_id,
                    supplier_name: item.supplier_name ?? "-",
                    amount: item.amount ?? 0,
                    payment_method: item.payment_method ?? "cash",
                    note: item.note ?? "",
                    status: item.status ?? "draft",
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                }));

                console.log("Dữ liệu mapped:", mappedData);

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
                route("admin.voucher.payment.delete", deletingRow.id),
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

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản Lý Phiếu Chi",
                },
            ]}
        >
            <Head title="Quản Lý Phiếu Chi" />
            <Card className="rounded-md shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold mb-1">
                                Quản Lý Phiếu Chi
                            </CardTitle>
                            <CardDescription>
                                Quản lý danh sách phiếu chi, nhà cung cấp, ngày chi và trạng thái.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                className="rounded-md"
                                onClick={() =>
                                    router.visit(
                                        route("admin.voucher.payment.create"),
                                    )
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm mới phiếu chi
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo mã phiếu, nhà cung cấp hoặc ghi chú..."
                    >
                        <div className="flex items-center gap-2">
                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] rounded-md">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="draft">Nháp</SelectItem>
                                    <SelectItem value="confirmed">
                                        Đã xác nhận
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Payment Method Filter */}
                            <Select
                                value={paymentMethodFilter}
                                onValueChange={setPaymentMethodFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] rounded-md">
                                    <SelectValue placeholder="Phương thức" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">Tất cả phương thức</SelectItem>
                                    <SelectItem value="cash">
                                        Tiền mặt
                                    </SelectItem>
                                    <SelectItem value="bank">
                                        Chuyển khoản
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTableFilter>

                    <PaymentVoucherTable
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
                title="Xóa phiếu chi"
                description={`Bạn có chắc chắn muốn xóa phiếu chi "${deletingRow?.code}" không?`}
                onCancel={() => {
                    setOpenDeleteDialog(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}