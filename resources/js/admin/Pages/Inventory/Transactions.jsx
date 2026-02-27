"use client";

import { useState } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    ArrowLeft,
    Package,
    TrendingUp,
    TrendingDown,
    Calendar,
    Filter,
    Download,
    Printer,
    RefreshCw,
    Info,
    ShoppingBag,
    ArrowUp,
    ArrowDown,
    Box,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    User,
    DollarSign,
    Hash,
} from "lucide-react";
import { Head, Link, router } from "@inertiajs/react";
import { formatCurrency, formatDate } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";
import { RangeDatePicker } from "@/admin/components/ui/date-picker";

export default function Transactions({ product, transactions, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [type, setType] = useState(filters.type || "all");

    // Tính toán thống kê
    const totalInbound =
        transactions?.filter((t) => t.transaction_type === "inbound").length ||
        0;
    const totalOutbound =
        transactions?.filter((t) => t.transaction_type === "outbound").length ||
        0;
    const totalQuantity =
        transactions?.reduce((sum, t) => sum + t.quantity, 0) || 0;
    const totalValue =
        transactions?.reduce((sum, t) => sum + t.total_cost, 0) || 0;

    const handleFilter = () => {
        router.get(
            route("admin.inventory.transactions", {
                id: product.product_variant_id,
            }),
            {
                start_date: startDate,
                end_date: endDate,
                type: type !== "all" ? type : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        setType("all");
        router.get(
            route("admin.inventory.transactions", {
                id: product.product_variant_id,
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleRefresh = () => {
        router.reload({ preserveScroll: true });
    };

    const getTransactionTypeBadge = (type) => {
        if (type === "inbound") {
            return (
                <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Nhập kho
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Xuất kho
            </Badge>
        );
    };

    const getReferenceTypeText = (type) => {
        const map = {
            purchase_receipt: "Phiếu nhập",
            sales_receipt: "Phiếu xuất",
            adjustment: "Điều chỉnh",
            reversal: "Hoàn nhập",
            manual: "Thủ công",
        };
        return map[type] || type;
    };

    const getReferenceTypeBadge = (type) => {
        const map = {
            purchase_receipt: "bg-blue-50 text-blue-700 border-blue-200",
            sales_receipt: "bg-green-50 text-green-700 border-green-200",
            adjustment: "bg-amber-50 text-amber-700 border-amber-200",
            reversal: "bg-purple-50 text-purple-700 border-purple-200",
            manual: "bg-slate-50 text-slate-700 border-slate-200",
        };
        return map[type] || "bg-slate-50 text-slate-700 border-slate-200";
    };

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Quản lý kho",
                    link: route("admin.inventory.index"),
                },
                {
                    label: "Lịch sử giao dịch",
                },
            ]}
        >
            <Head title="Lịch sử giao dịch" />

            {/* Header Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-lg mb-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("admin.inventory.index")}
                            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Lịch sử giao dịch
                            </h1>
                            <p className="text-white/80 text-sm mt-0.5 flex items-center gap-2">
                                <span>{product.product_name}</span>
                                <Badge className="bg-white/20 text-white border-0">
                                    <Hash className="h-3 w-3 mr-1" />
                                    SKU: {product.sku}
                                </Badge>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRefresh}
                            className="bg-white/20 text-white hover:bg-white/30 border-0"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Làm mới
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.print()}
                            className="bg-white/20 text-white hover:bg-white/30 border-0"
                        >
                            <Printer className="h-4 w-4 mr-1" />
                            In
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Tồn kho hiện tại */}
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tồn kho hiện tại
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {product.current_quantity}
                            </p>
                            <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                <Box className="h-3 w-3 mr-1" />
                                sản phẩm
                            </Badge>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Giá vốn TB */}
                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Giá vốn TB
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(product.average_cost)}
                            </p>
                            <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                đơn giá
                            </Badge>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tổng nhập */}
                <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng nhập trong kỳ
                            </p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {product.total_inbound_quantity}
                            </p>
                            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                <ArrowUp className="h-3 w-3 mr-1" />
                                {totalInbound} giao dịch
                            </Badge>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <ArrowUp className="h-6 w-6 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tổng xuất */}
                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tổng xuất trong kỳ
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {product.total_outbound_quantity}
                            </p>
                            <Badge className="mt-2 bg-red-100 text-red-700 border-red-200 text-xs">
                                <ArrowDown className="h-3 w-3 mr-1" />
                                {totalOutbound} giao dịch
                            </Badge>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <ArrowDown className="h-6 w-6 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">
                                Khoảng thời gian
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                                {filters.start_date || "Bắt đầu"} -{" "}
                                {filters.end_date || "Hiện tại"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">
                                Tổng số lượng
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                                {totalQuantity} sản phẩm
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">
                                Tổng giá trị
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                                {formatCurrency(totalValue)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6 shadow-md border-slate-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-3">
                    <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* RangeDatePicker */}
                        <div className="min-w-[320px]">
                            <RangeDatePicker
                                startDate={startDate}
                                endDate={endDate}
                                onStartDateChange={setStartDate}
                                onEndDateChange={setEndDate}
                                placeholder="Chọn khoảng thời gian"
                                clearable={true}
                            />
                        </div>

                        {/* Loại giao dịch */}
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-[180px] border-slate-200 focus:ring-blue-500">
                                <SelectValue placeholder="Loại giao dịch" />
                            </SelectTrigger>
                            <SelectContent className="dropdown-premium-content">
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                >
                                    Tất cả
                                </SelectItem>
                                <SelectItem
                                    value="inbound"
                                    className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                >
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        Nhập kho
                                    </span>
                                </SelectItem>
                                <SelectItem
                                    value="outbound"
                                    className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                >
                                    <span className="flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                        Xuất kho
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Nút lọc */}
                        <Button
                            onClick={handleFilter}
                            size="sm"
                            className="btn-gradient-premium"
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            Lọc
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="shadow-md border-slate-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-3">
                    <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Danh sách giao dịch
                        {transactions && transactions.length > 0 && (
                            <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
                                {transactions.length} giao dịch
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                <TableHead className="font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        Ngày giao dịch
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-purple-600" />
                                        Loại
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Box className="h-4 w-4 text-green-600" />
                                        Số lượng
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <DollarSign className="h-4 w-4 text-blue-600" />
                                        Đơn giá
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <DollarSign className="h-4 w-4 text-purple-600" />
                                        Thành tiền
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        Tham chiếu
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-purple-600" />
                                        Ghi chú
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-blue-600" />
                                        Người tạo
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions && transactions.length > 0 ? (
                                transactions.map((transaction, index) => (
                                    <TableRow
                                        key={transaction.id}
                                        className={cn(
                                            "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200",
                                            index % 2 === 0
                                                ? "bg-white"
                                                : "bg-slate-50/50",
                                        )}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {formatDate(
                                                        transaction.transaction_date,
                                                    )}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(
                                                        transaction.created_at,
                                                        "HH:mm DD/MM/YYYY",
                                                    )}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getTransactionTypeBadge(
                                                transaction.transaction_type,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <span
                                                className={cn(
                                                    "flex items-center justify-end gap-1",
                                                    transaction.transaction_type ===
                                                        "inbound"
                                                        ? "text-green-600"
                                                        : "text-red-600",
                                                )}
                                            >
                                                {transaction.transaction_type ===
                                                "inbound" ? (
                                                    <ArrowUp className="h-3 w-3" />
                                                ) : (
                                                    <ArrowDown className="h-3 w-3" />
                                                )}
                                                {transaction.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(
                                                transaction.unit_cost,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium font-mono text-green-600">
                                            {formatCurrency(
                                                transaction.total_cost,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "font-medium",
                                                    getReferenceTypeBadge(
                                                        transaction.reference_type,
                                                    ),
                                                )}
                                            >
                                                {getReferenceTypeText(
                                                    transaction.reference_type,
                                                )}
                                                {transaction.reference_id > 0 &&
                                                    ` #${transaction.reference_id}`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600 line-clamp-2 max-w-[200px]">
                                                {transaction.note || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-slate-700">
                                                {transaction.created_by ||
                                                    "Hệ thống"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-16"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                                <Package className="h-8 w-8 text-blue-600/50" />
                                            </div>
                                            <p className="text-slate-600 font-medium text-lg">
                                                Không có giao dịch nào
                                            </p>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Thử thay đổi bộ lọc hoặc chọn
                                                khoảng thời gian khác
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}