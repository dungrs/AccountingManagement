import React, { useState, useMemo } from "react";
import { Card } from "@/admin/components/ui/card";

export default function AccountingTabs({
    formData,
    accountingAccounts = [],
    supplierName = "",
    customerName = "",
    type = "purchase", // "purchase" | "sale"
    formatCurrency,
    createdBy = "",
    receiptDate = "",
}) {
    const [activeTab, setActiveTab] = useState("journal");

    // Tính toán bút toán tự động
    const journalEntries = useMemo(() => {
        const entries = [];
        const totalAmount = parseFloat(formData.product_variants.reduce(
            (sum, item) => sum + parseFloat(item.quantity || 0) * parseFloat(item.price || 0),
            0
        ));
        const vatAmount = parseFloat(formData.product_variants.reduce(
            (sum, item) => sum + parseFloat(item.vat_amount || 0),
            0
        ));
        const grandTotal = totalAmount + vatAmount;

        if (type === "purchase") {
            // Phiếu nhập hàng
            
            // 1. Nợ TK 632 (Giá vốn hàng bán) - Tổng tiền hàng
            const costAccount = accountingAccounts.find(
                acc => acc.account_code === "632"
            );
            if (costAccount && totalAmount > 0) {
                entries.push({
                    account_id: costAccount.id,
                    account_code: costAccount.account_code,
                    account_name: costAccount.name,
                    debit: totalAmount,
                    credit: 0,
                });
            }

            // 2. Nợ TK 3331 (Thuế GTGT phải nộp) - VAT
            const vatAccount = accountingAccounts.find(
                acc => acc.account_code === "3331"
            );
            if (vatAccount && vatAmount > 0) {
                entries.push({
                    account_id: vatAccount.id,
                    account_code: vatAccount.account_code,
                    account_name: vatAccount.name,
                    debit: vatAmount,
                    credit: 0,
                });
            }

            // 3. Có TK 331 (Phải trả cho người bán) - Tổng thanh toán
            const payableAccount = accountingAccounts.find(
                acc => acc.account_code === "331"
            );
            if (payableAccount && grandTotal > 0) {
                entries.push({
                    account_id: payableAccount.id,
                    account_code: payableAccount.account_code,
                    account_name: payableAccount.name,
                    debit: 0,
                    credit: grandTotal,
                });
            }
        } else {
            // Phiếu xuất hàng (sale)
            
            // 1. Nợ TK 131 (Phải thu của khách hàng) - Tổng thanh toán
            const receivableAccount = accountingAccounts.find(
                acc => acc.account_code === "131"
            );
            if (receivableAccount && grandTotal > 0) {
                entries.push({
                    account_id: receivableAccount.id,
                    account_code: receivableAccount.account_code,
                    account_name: receivableAccount.name,
                    debit: grandTotal,
                    credit: 0,
                });
            }

            // 2. Có TK 5111 (Doanh thu bán hàng hóa) - Tổng tiền hàng
            const revenueAccount = accountingAccounts.find(
                acc => acc.account_code === "5111"
            );
            if (revenueAccount && totalAmount > 0) {
                entries.push({
                    account_id: revenueAccount.id,
                    account_code: revenueAccount.account_code,
                    account_name: revenueAccount.name,
                    debit: 0,
                    credit: totalAmount,
                });
            }

            // 3. Có TK 3331 (Thuế GTGT phải nộp) - VAT
            const vatAccountSale = accountingAccounts.find(
                acc => acc.account_code === "3331"
            );
            if (vatAccountSale && vatAmount > 0) {
                entries.push({
                    account_id: vatAccountSale.id,
                    account_code: vatAccountSale.account_code,
                    account_name: vatAccountSale.name,
                    debit: 0,
                    credit: vatAmount,
                });
            }
        }

        return entries;
    }, [formData.product_variants, accountingAccounts, type]);

    // Tính tổng công nợ
    const debtInfo = useMemo(() => {
        const grandTotal = formData.product_variants.reduce(
            (sum, item) => {
                const subtotal = parseFloat(item.subtotal || 0);
                return sum + subtotal;
            },
            0
        );

        return {
            total: grandTotal,
            partnerName: type === "purchase" ? supplierName : customerName,
            totalDebit: type === "purchase" ? grandTotal : 0,
            totalCredit: type === "purchase" ? 0 : grandTotal,
            balance: type === "purchase" ? grandTotal : -grandTotal,
        };
    }, [formData.product_variants, supplierName, customerName, type]);

    return (
        <Card className="p-6 mt-6">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex gap-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab("journal")}
                        className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === "journal"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Hạch toán
                    </button>
                    <button
                        onClick={() => setActiveTab("debt")}
                        type="button"
                        className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === "debt"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Công nợ {type === "purchase" ? "nhà cung cấp" : "khách hàng"}
                    </button>
                </nav>
            </div>

            {/* Journal Tab */}
            {activeTab === "journal" && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Bút toán tự động
                    </h4>
                    
                    {journalEntries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tài khoản
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Diễn giải
                                        </th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nợ
                                        </th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Có
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {journalEntries.map((entry, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-medium text-gray-900">
                                                        {entry.account_code}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {entry.account_name}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                                                {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                                                {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {/* Tổng cộng */}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="py-3 px-4 text-sm text-gray-900" colSpan={2}>
                                            Tổng cộng
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                            {formatCurrency(
                                                journalEntries.reduce((sum, e) => sum + e.debit, 0)
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                            {formatCurrency(
                                                journalEntries.reduce((sum, e) => sum + e.credit, 0)
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">
                                Chưa có bút toán. Vui lòng thêm sản phẩm vào phiếu.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Debt Tab */}
            {activeTab === "debt" && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Thông tin công nợ
                    </h4>
                    
                    {debtInfo.total > 0 ? (
                        <div className="space-y-4">
                            {/* Debt Summary Card */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">
                                            {type === "purchase" ? "Nhà cung cấp" : "Khách hàng"}
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {debtInfo.partnerName || "Chưa chọn"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">
                                            Công nợ phát sinh
                                        </p>
                                        <p className="font-semibold text-blue-600 text-lg">
                                            {formatCurrency(debtInfo.total)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Debt Details */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <h5 className="text-sm font-medium text-gray-700">
                                        Chi tiết công nợ
                                    </h5>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">
                                            {type === "purchase" ? "Tổng phải trả" : "Tổng phải thu"}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(
                                                type === "purchase" ? debtInfo.totalDebit : debtInfo.totalCredit
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">Đã thanh toán</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(0)}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">Còn lại</span>
                                            <span className={`font-semibold text-lg ${
                                                debtInfo.balance > 0 ? "text-red-600" : "text-green-600"
                                            }`}>
                                                {formatCurrency(Math.abs(debtInfo.balance))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="w-5 h-5 text-amber-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-amber-800">
                                            <strong>Lưu ý:</strong> Công nợ sẽ được cập nhật sau khi lưu phiếu.
                                            {type === "purchase" 
                                                ? " Số tiền này sẽ được ghi nhận vào công nợ phải trả nhà cung cấp."
                                                : " Số tiền này sẽ được ghi nhận vào công nợ phải thu khách hàng."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">
                                Chưa có công nợ. Vui lòng thêm sản phẩm vào phiếu.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}