"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import { Badge } from "@/admin/components/ui/badge";
import { Card } from "@/admin/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    Package,
    Users,
    CreditCard,
    ArrowUp,
    ArrowDown,
    Minus,
    Receipt,
    FileText,
    Wallet,
    Landmark,
    BarChart4,
    Percent,
} from "lucide-react";
import { formatCurrency } from "@/admin/utils/helpers";
import { cn } from "@/admin/lib/utils";

export default function BusinessResultTable({ data = {}, loading = false }) {
    if (loading) {
        return (
            <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 border-r-purple-600 animate-spin"></div>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">
                        Đang tải dữ liệu...
                    </p>
                </div>
            </div>
        );
    }

    const formatChange = (value) => {
        if (value > 0) {
            return {
                text: `+${value}%`,
                icon: ArrowUp,
                color: "text-green-600",
            };
        } else if (value < 0) {
            return {
                text: `${value}%`,
                icon: ArrowDown,
                color: "text-red-600",
            };
        }
        return { text: "0%", icon: Minus, color: "text-slate-400" };
    };

    // Tính các tỷ lệ
    const grossProfitMargin =
        data.revenue?.net > 0
            ? (((data.gross_profit || 0) / data.revenue.net) * 100).toFixed(2)
            : 0;

    const operatingProfitMargin =
        data.revenue?.net > 0
            ? (((data.operating_profit || 0) / data.revenue.net) * 100).toFixed(
                  2,
              )
            : 0;

    const netProfitMargin =
        data.revenue?.net > 0
            ? (((data.profit_after_tax || 0) / data.revenue.net) * 100).toFixed(
                  2,
              )
            : 0;

    return (
        <div className="space-y-6">
            {/* Tổng quan 4 chỉ tiêu chính */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-700">
                            Doanh thu thuần
                        </p>
                        <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(data.revenue?.net || 0)}
                    </p>
                    {data.comparison?.revenue && (
                        <div className="flex items-center gap-1 mt-1">
                            {data.comparison.revenue.percentage_change > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : data.comparison.revenue.percentage_change <
                              0 ? (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                            ) : null}
                            <span
                                className={cn(
                                    "text-xs",
                                    data.comparison.revenue.percentage_change >
                                        0
                                        ? "text-green-600"
                                        : data.comparison.revenue
                                                .percentage_change < 0
                                          ? "text-red-600"
                                          : "text-slate-500",
                                )}
                            >
                                {data.comparison.revenue.percentage_change}% so
                                với năm trước
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-700">
                            Lợi nhuận gộp
                        </p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(data.gross_profit || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <Percent className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">
                            Biên lợi nhuận gộp: {grossProfitMargin}%
                        </span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-orange-700">
                            LN trước thuế
                        </p>
                        <PieChart className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                        {formatCurrency(data.profit_before_tax || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-orange-600">
                            Thuế TNDN: {formatCurrency(data.income_tax || 0)}
                        </span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-purple-700">
                            LN sau thuế
                        </p>
                        <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(data.profit_after_tax || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <Percent className="h-3 w-3 text-purple-600" />
                        <span className="text-xs text-purple-600">
                            Biên lợi nhuận ròng: {netProfitMargin}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Tỷ suất lợi nhuận */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <div className="p-3">
                        <p className="text-xs text-slate-500 mb-1">
                            Biên lợi nhuận gộp
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                            {grossProfitMargin}%
                        </p>
                    </div>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <div className="p-3">
                        <p className="text-xs text-slate-500 mb-1">
                            Biên lợi nhuận HĐKD
                        </p>
                        <p className="text-xl font-bold text-orange-600">
                            {operatingProfitMargin}%
                        </p>
                    </div>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <div className="p-3">
                        <p className="text-xs text-slate-500 mb-1">
                            Biên lợi nhuận ròng
                        </p>
                        <p className="text-xl font-bold text-purple-600">
                            {netProfitMargin}%
                        </p>
                    </div>
                </Card>
            </div>

            {/* Bảng chi tiết */}
            <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                            <TableHead className="font-semibold text-slate-700 w-1/2">
                                Chỉ tiêu
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right w-1/4">
                                Kỳ này
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right w-1/4">
                                So với kỳ trước
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* I. DOANH THU */}
                        <TableRow className="bg-blue-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-blue-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4" />
                                    I. DOANH THU BÁN HÀNG VÀ CUNG CẤP DỊCH VỤ
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                1. Doanh thu bán hàng hóa, thành phẩm
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(data.revenue?.total || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.revenue && (
                                    <span
                                        className={cn(
                                            "flex items-center justify-end gap-1",
                                            data.comparison.revenue
                                                .percentage_change > 0
                                                ? "text-green-600"
                                                : data.comparison.revenue
                                                        .percentage_change < 0
                                                  ? "text-red-600"
                                                  : "text-slate-400",
                                        )}
                                    >
                                        {
                                            data.comparison.revenue
                                                .percentage_change
                                        }
                                        %
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                2. Các khoản giảm trừ doanh thu
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                                ({formatCurrency(data.revenue?.reductions || 0)}
                                )
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        <TableRow className="bg-blue-50/30 font-medium">
                            <TableCell className="pl-8 text-blue-700">
                                3. DOANH THU THUẦN VỀ BÁN HÀNG VÀ CUNG CẤP DỊCH
                                VỤ
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-700">
                                {formatCurrency(data.revenue?.net || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.revenue && (
                                    <span
                                        className={cn(
                                            "flex items-center justify-end gap-1 font-medium",
                                            data.comparison.revenue
                                                .percentage_change > 0
                                                ? "text-green-600"
                                                : data.comparison.revenue
                                                        .percentage_change < 0
                                                  ? "text-red-600"
                                                  : "text-slate-400",
                                        )}
                                    >
                                        {
                                            data.comparison.revenue
                                                .percentage_change
                                        }
                                        %
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* II. GIÁ VỐN */}
                        <TableRow className="bg-orange-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-orange-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    II. GIÁ VỐN HÀNG BÁN
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                Giá vốn của hàng hóa, thành phẩm đã bán
                            </TableCell>
                            <TableCell className="text-right text-orange-600 font-medium">
                                ({formatCurrency(data.cogs?.total || 0)})
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.gross_profit && (
                                    <span
                                        className={cn(
                                            "flex items-center justify-end gap-1",
                                            data.comparison.gross_profit
                                                .percentage_change > 0
                                                ? "text-green-600"
                                                : data.comparison.gross_profit
                                                        .percentage_change < 0
                                                  ? "text-red-600"
                                                  : "text-slate-400",
                                        )}
                                    >
                                        {
                                            data.comparison.gross_profit
                                                .percentage_change
                                        }
                                        %
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* III. LỢI NHUẬN GỘP */}
                        <TableRow className="bg-green-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-green-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    III. LỢI NHUẬN GỘP VỀ BÁN HÀNG VÀ CUNG CẤP
                                    DỊCH VỤ
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="bg-green-50/30 font-medium">
                            <TableCell className="pl-8 text-green-700">
                                Lợi nhuận gộp
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                                {formatCurrency(data.gross_profit || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.gross_profit && (
                                    <span
                                        className={cn(
                                            "flex items-center justify-end gap-1 font-medium",
                                            data.comparison.gross_profit
                                                .percentage_change > 0
                                                ? "text-green-600"
                                                : data.comparison.gross_profit
                                                        .percentage_change < 0
                                                  ? "text-red-600"
                                                  : "text-slate-400",
                                        )}
                                    >
                                        {
                                            data.comparison.gross_profit
                                                .percentage_change
                                        }
                                        %
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* IV. CHI PHÍ HOẠT ĐỘNG */}
                        <TableRow className="bg-red-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-red-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    IV. CHI PHÍ HOẠT ĐỘNG
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                1. Chi phí bán hàng
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                                ({formatCurrency(data.expenses?.selling || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                2. Chi phí quản lý doanh nghiệp
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                                ({formatCurrency(data.expenses?.admin || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        <TableRow className="bg-red-50/30 font-medium">
                            <TableCell className="pl-8 text-red-700">
                                Tổng chi phí hoạt động
                            </TableCell>
                            <TableCell className="text-right font-bold text-red-700">
                                (
                                {formatCurrency(
                                    (data.expenses?.selling || 0) +
                                        (data.expenses?.admin || 0),
                                )}
                                )
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* V. LỢI NHUẬN THUẦN TỪ HĐKD */}
                        <TableRow className="bg-amber-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-amber-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart4 className="h-4 w-4" />
                                    V. LỢI NHUẬN THUẦN TỪ HOẠT ĐỘNG KINH DOANH
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="bg-amber-50/30 font-medium">
                            <TableCell className="pl-8 text-amber-700">
                                Lợi nhuận thuần từ HĐKD
                            </TableCell>
                            <TableCell className="text-right font-bold text-amber-700">
                                {formatCurrency(data.operating_profit || 0)}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* VI. THU NHẬP KHÁC */}
                        <TableRow className="bg-teal-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-teal-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    VI. THU NHẬP KHÁC
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                Thu nhập khác
                            </TableCell>
                            <TableCell className="text-right text-teal-600 font-medium">
                                {formatCurrency(data.other_income?.total || 0)}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* VII. CHI PHÍ KHÁC */}
                        <TableRow className="bg-rose-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-rose-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    VII. CHI PHÍ KHÁC
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">Chi phí khác</TableCell>
                            <TableCell className="text-right text-rose-600 font-medium">
                                (
                                {formatCurrency(data.other_expense?.total || 0)}
                                )
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* VIII. LỢI NHUẬN KHÁC */}
                        <TableRow className="bg-indigo-50/30">
                            <TableCell className="pl-8 font-medium">
                                Lợi nhuận khác
                            </TableCell>
                            <TableCell className="text-right font-medium text-indigo-600">
                                {formatCurrency(
                                    (data.other_income?.total || 0) -
                                        (data.other_expense?.total || 0),
                                )}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* IX. TỔNG LỢI NHUẬN KẾ TOÁN TRƯỚC THUẾ */}
                        <TableRow className="bg-purple-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-purple-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-4 w-4" />
                                    IX. TỔNG LỢI NHUẬN KẾ TOÁN TRƯỚC THUẾ
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="bg-purple-50/30 font-medium">
                            <TableCell className="pl-8 text-purple-700">
                                Lợi nhuận trước thuế
                            </TableCell>
                            <TableCell className="text-right font-bold text-purple-700">
                                {formatCurrency(data.profit_before_tax || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.profit_before_tax && (
                                    <span
                                        className={cn(
                                            "flex items-center justify-end gap-1 font-medium",
                                            data.comparison.profit_before_tax
                                                .percentage_change > 0
                                                ? "text-green-600"
                                                : data.comparison
                                                        .profit_before_tax
                                                        .percentage_change < 0
                                                  ? "text-red-600"
                                                  : "text-slate-400",
                                        )}
                                    >
                                        {
                                            data.comparison.profit_before_tax
                                                .percentage_change
                                        }
                                        %
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* X. CHI PHÍ THUẾ TNDN HIỆN HÀNH */}
                        <TableRow className="bg-indigo-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-indigo-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    X. CHI PHÍ THUẾ THU NHẬP DOANH NGHIỆP HIỆN
                                    HÀNH
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50">
                            <TableCell className="pl-8">
                                Chi phí thuế TNDN hiện hành
                            </TableCell>
                            <TableCell className="text-right text-indigo-600 font-medium">
                                ({formatCurrency(data.income_tax || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* XI. LỢI NHUẬN SAU THUẾ */}
                        <TableRow className="bg-emerald-50/80">
                            <TableCell
                                colSpan={3}
                                className="font-bold text-emerald-800 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    XI. LỢI NHUẬN SAU THUẾ THU NHẬP DOANH NGHIỆP
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow className="bg-emerald-50/30 font-bold">
                            <TableCell className="pl-8 text-emerald-700">
                                Lợi nhuận sau thuế
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-700">
                                {formatCurrency(data.profit_after_tax || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.profit_after_tax && (
                                    <span
                                        className={cn(
                                            "flex items-center justify-end gap-1 font-bold",
                                            data.comparison.profit_after_tax
                                                .percentage_change > 0
                                                ? "text-green-600"
                                                : data.comparison
                                                        .profit_after_tax
                                                        .percentage_change < 0
                                                  ? "text-red-600"
                                                  : "text-slate-400",
                                        )}
                                    >
                                        {
                                            data.comparison.profit_after_tax
                                                .percentage_change
                                        }
                                        %
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* Thông tin bổ sung */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-medium text-slate-700 mb-2">
                        Thông tin kỳ báo cáo
                    </p>
                    <p className="text-slate-600">
                        Năm: {data.period?.year || "N/A"}
                    </p>
                    <p className="text-slate-600">
                        Từ ngày: {data.period?.start_date || "N/A"}
                    </p>
                    <p className="text-slate-600">
                        Đến ngày: {data.period?.end_date || "N/A"}
                    </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-medium text-slate-700 mb-2">
                        Tỷ suất lợi nhuận
                    </p>
                    <p className="text-slate-600">
                        Biên lợi nhuận gộp: {grossProfitMargin}%
                    </p>
                    <p className="text-slate-600">
                        Biên lợi nhuận HĐKD: {operatingProfitMargin}%
                    </p>
                    <p className="text-slate-600">
                        Biên lợi nhuận ròng: {netProfitMargin}%
                    </p>
                </div>
            </div>

            {/* Chi tiết theo mặt hàng */}
            {data.product_details && data.product_details.length > 0 && (
                <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Chi tiết theo mặt hàng
                        </h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mặt hàng</TableHead>
                                <TableHead className="text-right">
                                    SL bán
                                </TableHead>
                                <TableHead className="text-right">
                                    Đơn giá
                                </TableHead>
                                <TableHead className="text-right">
                                    Doanh thu
                                </TableHead>
                                <TableHead className="text-right">
                                    Giá vốn
                                </TableHead>
                                <TableHead className="text-right">
                                    Lợi nhuận
                                </TableHead>
                                <TableHead className="text-right">
                                    Tỷ suất
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.product_details.map((item, index) => (
                                <TableRow
                                    key={index}
                                    className="hover:bg-slate-50"
                                >
                                    <TableCell className="font-medium">
                                        {item.product_name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.total_quantity} {item.unit_name}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(item.avg_price)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-blue-600">
                                        {formatCurrency(item.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-orange-600">
                                        ({formatCurrency(item.cogs)})
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        {formatCurrency(item.profit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            className={cn(
                                                item.profit_margin >= 20
                                                    ? "bg-green-100 text-green-700 border-green-200"
                                                    : item.profit_margin >= 10
                                                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                                      : "bg-red-100 text-red-700 border-red-200",
                                            )}
                                        >
                                            {item.profit_margin}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Ghi chú */}
            <div className="text-xs text-slate-400 italic border-t border-slate-200 pt-4">
                * Kỳ báo cáo: {data.period?.start_date || "N/A"} -{" "}
                {data.period?.end_date || "N/A"}
            </div>
        </div>
    );
}