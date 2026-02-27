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
    Package,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Filter,
    RefreshCw,
    TrendingUp,
    Boxes,
    CheckCheck,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import InventoryAdjustModal from "@/admin/components/pages/inventory/InventoryAdjustModal";
import InventoryTable from "@/admin/components/pages/inventory/InventoryTable";
import DataTablePagination from "@/admin/components/shared/common/DataTablePagination";
import DataTableFilter from "@/admin/components/shared/common/DataTableFilter";
import { Head, router } from "@inertiajs/react";
import { cn } from "@/admin/lib/utils";
import { formatCurrency, formatNumber } from "@/admin/utils/helpers";
import InventoryFormModal from "@/admin/components/pages/inventory/InventoryFormModal";

export default function Home({ initialFilters = {} }) {
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState("20");
    const [keyword, setKeyword] = useState(initialFilters.keyword || "");
    const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
    const [stockFilter, setStockFilter] = useState(
        initialFilters.stock_status || "all",
    );
    const [loading, setLoading] = useState(false);

    // Modal states
    const [openAdjustModal, setOpenAdjustModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const [openFormModal, setOpenFormModal] = useState(false);
    const [modalMode, setModalMode] = useState("edit");
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [paginationData, setPaginationData] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    // Stats overview
    const [overview, setOverview] = useState({
        total_value: 0,
        total_quantity: 0,
        product_with_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        monthly_inbound_quantity: 0,
        monthly_outbound_quantity: 0,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    // Fetch overview stats
    const fetchOverview = useCallback(async () => {
        try {
            const res = await axios.get(route("admin.inventory.overview"));
            // API trả về trực tiếp data, không có status
            setOverview(res.data);
        } catch (error) {
            console.error("Lỗi khi tải tổng quan:", error);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const params = {
                    page,
                    perpage: parseInt(pageSize),
                    keyword: debouncedKeyword.trim(),
                    stock_status:
                        stockFilter !== "all" ? stockFilter : undefined,
                };

                const res = await axios.post(
                    route("admin.inventory.filter"),
                    params,
                );

                // API trả về trực tiếp paginate object
                const response = res.data;

                if (!response || !response.data) {
                    throw new Error("Dữ liệu trả về không hợp lệ");
                }

                // Map dữ liệu từ response.data (mảng các item)
                const mappedData = response.data.map((item) => ({
                    id: item.product_variant_id,
                    inventory_balance_id: item.id,
                    name: item.product_name || "",
                    sku: item.sku || "",
                    barcode: item.barcode || "",
                    quantity: item.quantity || 0,
                    unit_name: item.unit_name || "",
                    average_cost: item.average_cost || 0,
                    inventory_value: item.inventory_value || 0,
                    stock_status:
                        item.stock_status || getStockStatus(item.quantity),
                    balance_date: item.balance_date,
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
        [pageSize, debouncedKeyword, stockFilter],
    );

    const getStockStatus = (quantity) => {
        if (quantity <= 0) return "out-of-stock";
        if (quantity < 10) return "low-stock";
        return "in-stock";
    };

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const handleEditProduct = (row) => {
        setSelectedProduct(row);
        setModalMode("edit");
        setOpenFormModal(true);
    };

    const handleCloseFormModal = () => {
        setOpenFormModal(false);
        setSelectedProduct(null);
    };

    const handleFormSuccess = () => {
        fetchData(paginationData.current_page);
        fetchOverview();
    };

    // Cập nhật handleAdjustStock để phân biệt với edit
    const handleAdjustStock = (row) => {
        setSelectedVariant(row);
        setOpenAdjustModal(true);
    };

    const handleViewTransactions = (row) => {
        // Mở modal xem lịch sử hoặc chuyển trang
        router.visit(route("admin.inventory.transactions", { id: row.id }));
    };

    const handleRefresh = () => {
        fetchData(paginationData.current_page);
        fetchOverview();
        toast.success("Đã làm mới dữ liệu");
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

    // Thống kê từ overview
    const {
        total_value = 0,
        total_quantity = 0,
        product_with_stock = 0,
        low_stock = 0,
        out_of_stock = 0,
        monthly_inbound_quantity = 0,
        monthly_outbound_quantity = 0,
    } = overview;

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản lý kho",
                },
            ]}
        >
            <Head title="Quản lý kho" />

            {/* Header Stats - 4 cột */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng giá trị kho
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(total_value)}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng số lượng
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatNumber(total_quantity)}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Boxes className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Sản phẩm có tồn
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {product_with_stock}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <CheckCheck className="h-6 w-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nhập/Xuất trong tháng
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatNumber(monthly_inbound_quantity)} /{" "}
                                {formatNumber(monthly_outbound_quantity)}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stock Status Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    Còn hàng (≥10)
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {product_with_stock -
                                        low_stock -
                                        out_of_stock}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-200 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-yellow-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">
                                    Sắp hết (1-9)
                                </p>
                                <p className="text-2xl font-bold text-yellow-700">
                                    {low_stock}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-800">
                                    Hết hàng
                                </p>
                                <p className="text-2xl font-bold text-red-700">
                                    {out_of_stock}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <Package className="h-6 w-6" />
                                Quản lý tồn kho
                            </CardTitle>
                            <CardDescription className="text-white/80">
                                Theo dõi số lượng tồn kho, giá trị và lịch sử
                                nhập xuất.
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
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-4">
                    <DataTableFilter
                        keyword={keyword}
                        setKeyword={setKeyword}
                        placeholder="Tìm kiếm theo tên SP, SKU, Barcode..."
                        className="bg-white"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />

                            {/* Stock Status Filter */}
                            <Select
                                value={stockFilter}
                                onValueChange={setStockFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] rounded-md border-slate-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Tình trạng kho" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="in-stock">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            Còn hàng (≥10)
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="low-stock">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                            Sắp hết (1-9)
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="out-of-stock">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                            Hết hàng
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTableFilter>

                    <InventoryTable
                        data={data}
                        loading={loading}
                        selectedRows={selectedRows}
                        toggleAll={toggleAll}
                        toggleRow={toggleRow}
                        handleEditProduct={handleEditProduct} // Thêm prop này
                        handleAdjustStock={handleAdjustStock}
                        handleViewTransactions={handleViewTransactions}
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

            <InventoryFormModal
                open={openFormModal}
                mode={modalMode}
                data={selectedProduct}
                onClose={handleCloseFormModal}
                onSuccess={handleFormSuccess}
            />

            {/* Modals */}
            <InventoryAdjustModal
                open={openAdjustModal}
                onClose={() => setOpenAdjustModal(false)}
                data={selectedVariant}
                onSuccess={() => {
                    fetchData(paginationData.current_page);
                    fetchOverview();
                }}
            />
        </AdminLayout>
    );
}
