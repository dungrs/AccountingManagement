"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/admin/lib/utils";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

export default function CashFlowCard({
    cashFlow = { cash_in: 0, cash_out: 0, net_cash: 0, balance: 0 },
}) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-2">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Wallet className="h-3 w-3 text-white" />
                    </div>
                    <CardTitle className="text-sm">Dòng tiền</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <span className="text-slate-500">Thu</span>
                    </div>
                    <span className="font-medium text-green-600">
                        {formatCurrency(cashFlow.cash_in)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                        <span className="text-slate-500">Chi</span>
                    </div>
                    <span className="font-medium text-red-600">
                        {formatCurrency(cashFlow.cash_out)}
                    </span>
                </div>
                <div className="pt-2 mt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Ròng</span>
                        <span
                            className={cn(
                                "text-sm font-semibold",
                                cashFlow.net_cash >= 0
                                    ? "text-green-600"
                                    : "text-red-600",
                            )}
                        >
                            {formatCurrency(cashFlow.net_cash)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">Số dư</span>
                        <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                            {formatCurrency(cashFlow.balance)}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}