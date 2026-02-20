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
            return { text: `+${value}%`, icon: ArrowUp, color: 'text-green-600' };
        } else if (value < 0) {
            return { text: `${value}%`, icon: ArrowDown, color: 'text-red-600' };
        }
        return { text: '0%', icon: Minus, color: 'text-slate-400' };
    };

    return (
        <div className="space-y-6">
            {/* Tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-700">Doanh thu thuần</p>
                        <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(data.revenue?.net || 0)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-700">Lợi nhuận gộp</p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(data.gross_profit || 0)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-orange-700">LN trước thuế</p>
                        <PieChart className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                        {formatCurrency(data.profit_before_tax || 0)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-purple-700">LN sau thuế</p>
                        <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(data.profit_after_tax || 0)}
                    </p>
                </div>
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
                        {/* I. Doanh thu */}
                        <TableRow className="bg-blue-50/50 font-medium">
                            <TableCell colSpan={3} className="text-blue-800">
                                I. DOANH THU BÁN HÀNG
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">1. Doanh thu bán hàng</TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(data.revenue?.total || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.revenue && (
                                    <span className={cn(
                                        "flex items-center justify-end gap-1",
                                        data.comparison.revenue.percentage_change > 0 
                                            ? "text-green-600" 
                                            : data.comparison.revenue.percentage_change < 0 
                                                ? "text-red-600" 
                                                : "text-slate-400"
                                    )}>
                                        {data.comparison.revenue.percentage_change}%
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">2. Các khoản giảm trừ</TableCell>
                            <TableCell className="text-right text-red-600">
                                ({formatCurrency(data.revenue?.reductions || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        <TableRow className="font-medium">
                            <TableCell className="pl-8 text-blue-700">
                                3. Doanh thu thuần
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-700">
                                {formatCurrency(data.revenue?.net || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.revenue && (
                                    <span className={cn(
                                        "flex items-center justify-end gap-1",
                                        data.comparison.revenue.percentage_change > 0 
                                            ? "text-green-600" 
                                            : data.comparison.revenue.percentage_change < 0 
                                                ? "text-red-600" 
                                                : "text-slate-400"
                                    )}>
                                        {data.comparison.revenue.percentage_change}%
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* II. Giá vốn */}
                        <TableRow className="bg-orange-50/50 font-medium">
                            <TableCell colSpan={3} className="text-orange-800">
                                II. GIÁ VỐN HÀNG BÁN
                            </TableCell>
                        </TableRow>

                        <TableRow className="font-medium">
                            <TableCell className="pl-8">Giá vốn hàng bán</TableCell>
                            <TableCell className="text-right text-orange-600">
                                ({formatCurrency(data.cogs?.total || 0)})
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.gross_profit && (
                                    <span className={cn(
                                        "flex items-center justify-end gap-1",
                                        data.comparison.gross_profit.percentage_change > 0 
                                            ? "text-green-600" 
                                            : data.comparison.gross_profit.percentage_change < 0 
                                                ? "text-red-600" 
                                                : "text-slate-400"
                                    )}>
                                        {data.comparison.gross_profit.percentage_change}%
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* III. Lợi nhuận gộp */}
                        <TableRow className="bg-green-50/50 font-medium">
                            <TableCell colSpan={3} className="text-green-800">
                                III. LỢI NHUẬN GỘP
                            </TableCell>
                        </TableRow>

                        <TableRow className="font-medium">
                            <TableCell className="pl-8">Lợi nhuận gộp</TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                                {formatCurrency(data.gross_profit || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.gross_profit && (
                                    <span className={cn(
                                        "flex items-center justify-end gap-1",
                                        data.comparison.gross_profit.percentage_change > 0 
                                            ? "text-green-600" 
                                            : data.comparison.gross_profit.percentage_change < 0 
                                                ? "text-red-600" 
                                                : "text-slate-400"
                                    )}>
                                        {data.comparison.gross_profit.percentage_change}%
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* IV. Chi phí */}
                        <TableRow className="bg-red-50/50 font-medium">
                            <TableCell colSpan={3} className="text-red-800">
                                IV. CHI PHÍ HOẠT ĐỘNG
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">1. Chi phí bán hàng</TableCell>
                            <TableCell className="text-right text-red-600">
                                ({formatCurrency(data.expenses?.selling || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">2. Chi phí quản lý</TableCell>
                            <TableCell className="text-right text-red-600">
                                ({formatCurrency(data.expenses?.admin || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* V. LN từ HĐKD */}
                        <TableRow className="bg-amber-50/50 font-medium">
                            <TableCell colSpan={3} className="text-amber-800">
                                V. LỢI NHUẬN TỪ HOẠT ĐỘNG KINH DOANH
                            </TableCell>
                        </TableRow>

                        <TableRow className="font-medium">
                            <TableCell className="pl-8">Lợi nhuận từ HĐKD</TableCell>
                            <TableCell className="text-right font-bold text-amber-700">
                                {formatCurrency(data.operating_profit || 0)}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* VI. Thu nhập khác */}
                        <TableRow className="bg-teal-50/50 font-medium">
                            <TableCell colSpan={3} className="text-teal-800">
                                VI. THU NHẬP KHÁC
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">Thu nhập khác</TableCell>
                            <TableCell className="text-right text-teal-600">
                                {formatCurrency(data.other_income?.total || 0)}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* VII. Chi phí khác */}
                        <TableRow className="bg-rose-50/50 font-medium">
                            <TableCell colSpan={3} className="text-rose-800">
                                VII. CHI PHÍ KHÁC
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">Chi phí khác</TableCell>
                            <TableCell className="text-right text-rose-600">
                                ({formatCurrency(data.other_expense?.total || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* VIII. LN trước thuế */}
                        <TableRow className="bg-purple-50/50 font-medium">
                            <TableCell colSpan={3} className="text-purple-800">
                                VIII. LỢI NHUẬN TRƯỚC THUẾ
                            </TableCell>
                        </TableRow>

                        <TableRow className="font-medium">
                            <TableCell className="pl-8">Lợi nhuận trước thuế</TableCell>
                            <TableCell className="text-right font-bold text-purple-700">
                                {formatCurrency(data.profit_before_tax || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.profit_before_tax && (
                                    <span className={cn(
                                        "flex items-center justify-end gap-1",
                                        data.comparison.profit_before_tax.percentage_change > 0 
                                            ? "text-green-600" 
                                            : data.comparison.profit_before_tax.percentage_change < 0 
                                                ? "text-red-600" 
                                                : "text-slate-400"
                                    )}>
                                        {data.comparison.profit_before_tax.percentage_change}%
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>

                        {/* IX. Thuế TNDN */}
                        <TableRow className="bg-indigo-50/50 font-medium">
                            <TableCell colSpan={3} className="text-indigo-800">
                                IX. THUẾ THU NHẬP DOANH NGHIỆP
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="pl-8">Thuế TNDN (20%)</TableCell>
                            <TableCell className="text-right text-indigo-600">
                                ({formatCurrency(data.income_tax || 0)})
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>

                        {/* X. LN sau thuế */}
                        <TableRow className="bg-emerald-50/50 font-medium">
                            <TableCell colSpan={3} className="text-emerald-800 font-bold">
                                X. LỢI NHUẬN SAU THUẾ
                            </TableCell>
                        </TableRow>

                        <TableRow className="font-bold">
                            <TableCell className="pl-8">Lợi nhuận sau thuế</TableCell>
                            <TableCell className="text-right text-emerald-700">
                                {formatCurrency(data.profit_after_tax || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {data.comparison?.profit_after_tax && (
                                    <span className={cn(
                                        "flex items-center justify-end gap-1",
                                        data.comparison.profit_after_tax.percentage_change > 0 
                                            ? "text-green-600" 
                                            : data.comparison.profit_after_tax.percentage_change < 0 
                                                ? "text-red-600" 
                                                : "text-slate-400"
                                    )}>
                                        {data.comparison.profit_after_tax.percentage_change}%
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* Chi tiết theo mặt hàng */}
            {data.product_details && data.product_details.length > 0 && (
                <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2">
                        <h3 className="text-white font-medium">
                            Chi tiết theo mặt hàng
                        </h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mặt hàng</TableHead>
                                <TableHead className="text-right">SL bán</TableHead>
                                <TableHead className="text-right">Đơn giá</TableHead>
                                <TableHead className="text-right">Doanh thu</TableHead>
                                <TableHead className="text-right">Giá vốn</TableHead>
                                <TableHead className="text-right">Lợi nhuận</TableHead>
                                <TableHead className="text-right">Tỷ suất</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.product_details.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell className="text-right">
                                        {item.total_quantity} {item.unit_name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.avg_price)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.cogs)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        {formatCurrency(item.profit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={item.profit_margin >= 20 ? "success" : "warning"}>
                                            {item.profit_margin}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}