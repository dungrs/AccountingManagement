"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import { CreditCard, Users, Truck } from "lucide-react";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

export default function DebtCard({ debts }) {
    return (
        <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Công nợ</CardTitle>
                        <CardDescription className="text-xs">
                            Phải thu - phải trả
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-slate-500 mb-1">Phải thu</p>
                        <p className="text-base font-bold text-blue-600">
                            {formatCurrency(debts.receivable)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Khách hàng
                        </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-xs text-slate-500 mb-1">Phải trả</p>
                        <p className="text-base font-bold text-purple-600">
                            {formatCurrency(debts.payable)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Nhà cung cấp
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        Khách hàng công nợ
                    </p>
                    {debts.top_debtors?.length > 0 ? (
                        debts.top_debtors.slice(0, 3).map((debtor, idx) => (
                            <div
                                key={debtor.id}
                                className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 w-5 h-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                        {idx + 1}
                                    </Badge>
                                    <span className="truncate max-w-[100px]">
                                        {debtor.name}
                                    </span>
                                </div>
                                <span className="font-semibold text-blue-600">
                                    {formatCurrency(debtor.balance)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-slate-400 italic">
                            Chưa có dữ liệu
                        </p>
                    )}

                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-3">
                        <Truck className="h-3 w-3 text-purple-600" />
                        Nhà cung cấp công nợ
                    </p>
                    {debts.top_creditors?.length > 0 ? (
                        debts.top_creditors.slice(0, 3).map((creditor, idx) => (
                            <div
                                key={creditor.id}
                                className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 w-5 h-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                        {idx + 1}
                                    </Badge>
                                    <span className="truncate max-w-[100px]">
                                        {creditor.name}
                                    </span>
                                </div>
                                <span className="font-semibold text-purple-600">
                                    {formatCurrency(creditor.balance)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-slate-400 italic">
                            Chưa có dữ liệu
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}