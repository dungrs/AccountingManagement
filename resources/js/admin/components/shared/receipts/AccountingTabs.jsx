import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

// Component Select tạm thời
const Select = ({ value, onValueChange, options, placeholder, className }) => {
    return (
        <select
            value={value || ""}
            onChange={(e) => onValueChange(e.target.value)}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className || ""}`}
        >
            <option value="">{placeholder || "Chọn tài khoản"}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

export default function AccountingTabs({
    formData,
    setFormData,
    accountingAccounts = [],
    supplierName = "",
    customerName = "",
    type = "purchase",
    formatCurrency,
    createdBy = "",
    receiptDate = "",
    addingRows = []
}) {
    const [activeTab, setActiveTab] = useState("journal");
    const [editableEntries, setEditableEntries] = useState([]);

    const findAccount = (code) =>
        accountingAccounts.find((acc) => acc.account_code === code);

    // Format danh sách tài khoản cho Select component
    const accountOptions = useMemo(() => {
        const sorted = [...accountingAccounts].sort((a, b) => 
            a.account_code.localeCompare(b.account_code)
        );
        
        return sorted.map(acc => ({
            value: acc.account_code,
            label: `${acc.account_code} - ${acc.name}`
        }));
    }, [accountingAccounts]);

    // TÍNH TOÁN BÚT TOÁN MẶC ĐỊNH TỪ addingRows
    const defaultJournalEntries = useMemo(() => {
        const entries = [];
        
        // Lọc các dòng đang thêm có đủ thông tin
        const validAddingRows = (addingRows || []).filter(row => 
            row.product_variant_id && 
            parseFloat(row.quantity) > 0 && 
            parseFloat(row.price) > 0
        );

        // Kết hợp với product_variants đã lưu
        const allProducts = [
            ...(formData.product_variants || []),
            ...validAddingRows
        ];
        
        if (allProducts.length === 0) {
            return entries;
        }

        // Tính tổng tiền
        const totalAmount = allProducts.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));
        }, 0);

        const vatAmount = allProducts.reduce((sum, item) => {
            return sum + parseFloat(item.vat_amount || 0);
        }, 0);

        const grandTotal = totalAmount + vatAmount;

        if (type === "purchase") {
            // Nợ 156 - Hàng hóa
            const inventoryAccount = findAccount("156");
            if (inventoryAccount && totalAmount > 0) {
                entries.push({
                    id: `default_${Date.now()}_1`,
                    account_code: inventoryAccount.account_code,
                    account_name: inventoryAccount.name,
                    debit: totalAmount,
                    credit: 0,
                });
            }

            // Nợ 1331 - VAT đầu vào
            const vatInputAccount = findAccount("1331");
            if (vatInputAccount && vatAmount > 0) {
                entries.push({
                    id: `default_${Date.now()}_2`,
                    account_code: vatInputAccount.account_code,
                    account_name: vatInputAccount.name,
                    debit: vatAmount,
                    credit: 0,
                });
            }

            // Có 331 - Phải trả nhà cung cấp
            const payableAccount = findAccount("331");
            if (payableAccount && grandTotal > 0) {
                entries.push({
                    id: `default_${Date.now()}_3`,
                    account_code: payableAccount.account_code,
                    account_name: payableAccount.name,
                    debit: 0,
                    credit: grandTotal,
                });
            }
        }

        if (type === "sale") {
            // Nợ 131 - Phải thu khách hàng
            const receivableAccount = findAccount("131");
            if (receivableAccount && grandTotal > 0) {
                entries.push({
                    id: `default_${Date.now()}_1`,
                    account_code: receivableAccount.account_code,
                    account_name: receivableAccount.name,
                    debit: grandTotal,
                    credit: 0,
                });
            }

            // Có 5111 - Doanh thu bán hàng hóa
            const revenueAccount = findAccount("5111");
            if (revenueAccount && totalAmount > 0) {
                entries.push({
                    id: `default_${Date.now()}_2`,
                    account_code: revenueAccount.account_code,
                    account_name: revenueAccount.name,
                    debit: 0,
                    credit: totalAmount,
                });
            }

            // Có 3331 - VAT đầu ra
            const vatOutputAccount = findAccount("3331");
            if (vatOutputAccount && vatAmount > 0) {
                entries.push({
                    id: `default_${Date.now()}_3`,
                    account_code: vatOutputAccount.account_code,
                    account_name: vatOutputAccount.name,
                    debit: 0,
                    credit: vatAmount,
                });
            }

            // Giá vốn (nếu có cost_price)
            const totalCost = allProducts.reduce((sum, item) => {
                return sum + (parseFloat(item.quantity || 0) * parseFloat(item.cost_price || 0));
            }, 0);

            const cogsAccount = findAccount("632");
            const inventoryAccount = findAccount("156");

            if (totalCost > 0 && cogsAccount && inventoryAccount) {
                entries.push({
                    id: `default_${Date.now()}_4`,
                    account_code: cogsAccount.account_code,
                    account_name: cogsAccount.name,
                    debit: totalCost,
                    credit: 0,
                });

                entries.push({
                    id: `default_${Date.now()}_5`,
                    account_code: inventoryAccount.account_code,
                    account_name: inventoryAccount.name,
                    debit: 0,
                    credit: totalCost,
                });
            }
        }

        return entries;
    }, [addingRows, formData.product_variants, accountingAccounts, type]);

    // Khởi tạo editableEntries từ dữ liệu server hoặc default
    useEffect(() => {
        // Nếu có journal_entries từ server (khi edit)
        if (formData.journal_entries && formData.journal_entries.length > 0) {
            const serverEntries = formData.journal_entries[0]?.details || [];
            
            if (serverEntries.length > 0) {
                const mappedEntries = serverEntries.map((detail, index) => {
                    const account = findAccount(detail.account_code);
                    return {
                        id: detail.id || `server_${index}_${Date.now()}`,
                        account_code: detail.account_code,
                        account_name: account?.name || detail.account_code,
                        debit: parseFloat(detail.debit) || 0,
                        credit: parseFloat(detail.credit) || 0
                    };
                });
                setEditableEntries(mappedEntries);
                return;
            }
        }
        
        // Nếu không có dữ liệu server, dùng default
        if (defaultJournalEntries.length > 0) {
            setEditableEntries(defaultJournalEntries);
        } else {
            setEditableEntries([]);
        }
    }, [formData.journal_entries, defaultJournalEntries]);

    // Cập nhật formData với editableEntries
    useEffect(() => {
        if (setFormData) {
            setFormData(prev => ({
                ...prev,
                journal_entries: editableEntries
            }));
        }
    }, [editableEntries, setFormData]);

    // Xử lý thay đổi tài khoản
    const handleAccountChange = (index, accountCode) => {
        const account = findAccount(accountCode);
        setEditableEntries(prev => {
            const newEntries = [...prev];
            newEntries[index] = {
                ...newEntries[index],
                account_code: accountCode,
                account_name: account?.name || accountCode
            };
            return newEntries;
        });
    };

    // Xử lý thay đổi số tiền
    const handleAmountChange = (index, field, value) => {
        const numValue = parseFloat(value) || 0;
        setEditableEntries(prev => {
            const newEntries = [...prev];
            newEntries[index] = {
                ...newEntries[index],
                [field]: numValue
            };
            return newEntries;
        });
    };

    // Thêm dòng bút toán mới
    const handleAddEntry = () => {
        const newEntry = {
            id: `new_${Date.now()}_${editableEntries.length}`,
            account_code: "",
            account_name: "",
            debit: 0,
            credit: 0
        };
        setEditableEntries([...editableEntries, newEntry]);
    };

    // Xóa dòng bút toán
    const handleRemoveEntry = (index) => {
        if (editableEntries.length <= 1) return;
        setEditableEntries(prev => prev.filter((_, i) => i !== index));
    };

    // Tính toán công nợ (giữ nguyên)
    const debtInfo = useMemo(() => {
        const validAddingRows = (addingRows || []).filter(row => 
            row.product_variant_id && 
            parseFloat(row.quantity) > 0 && 
            parseFloat(row.price) > 0
        );

        const allProducts = [
            ...(formData.product_variants || []),
            ...validAddingRows
        ];

        if (allProducts.length === 0) {
            return { 
                total: 0, 
                partnerName: "", 
                totalDebit: 0, 
                totalCredit: 0, 
                balance: 0,
                totalAmount: 0,
                vatAmount: 0
            };
        }

        const totalAmount = allProducts.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));
        }, 0);

        const vatAmount = allProducts.reduce((sum, item) => {
            return sum + parseFloat(item.vat_amount || 0);
        }, 0);

        const totalDebt = totalAmount + vatAmount;

        return {
            total: totalDebt,
            totalAmount: totalAmount,
            vatAmount: vatAmount,
            partnerName: type === "purchase" ? supplierName : customerName,
            totalDebit: type === "purchase" ? 0 : totalDebt,
            totalCredit: type === "purchase" ? totalDebt : 0,
            balance: totalDebt,
        };
    }, [addingRows, formData.product_variants, supplierName, customerName, type]);

    const totalDebitJournal = editableEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCreditJournal = editableEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebitJournal - totalCreditJournal) < 0.0001;

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
                        {editableEntries.length > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                {editableEntries.length}
                            </span>
                        )}
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
                        {debtInfo.total > 0 && (
                            <span className="ml-2 text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                                {formatCurrency(debtInfo.total)}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Journal Tab - Có thể chỉnh sửa */}
            {activeTab === "journal" && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">
                                Bút toán {type === "purchase" ? "mua hàng" : "bán hàng"}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Có thể chỉnh sửa tài khoản và số tiền
                            </p>
                        </div>
                        
                        {editableEntries.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    isBalanced 
                                        ? "bg-green-100 text-green-700" 
                                        : "bg-red-100 text-red-700"
                                }`}>
                                    {isBalanced ? "✓ Cân bằng" : "✗ Mất cân bằng"}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddEntry}
                                    className="gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm dòng
                                </Button>
                            </div>
                        )}
                    </div>

                    {editableEntries.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                                            Tài khoản <span className="text-red-500">*</span>
                                        </th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                            Nợ
                                        </th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                            Có
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                            <span className="sr-only">Thao tác</span>
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {editableEntries.map((entry, index) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="py-2 px-4">
                                                <Select
                                                    value={entry.account_code}
                                                    onValueChange={(value) => handleAccountChange(index, value)}
                                                    options={accountOptions}
                                                    placeholder="-- Chọn tài khoản --"
                                                    className="w-full"
                                                />
                                            </td>

                                            <td className="py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={entry.debit || ""}
                                                    onChange={(e) => handleAmountChange(index, "debit", e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-right"
                                                    step="1000"
                                                    min="0"
                                                />
                                            </td>

                                            <td className="py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={entry.credit || ""}
                                                    onChange={(e) => handleAmountChange(index, "credit", e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-right"
                                                    step="1000"
                                                    min="0"
                                                />
                                            </td>

                                            <td className="py-2 px-4 text-center">
                                                {editableEntries.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveEntry(index)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Tổng cộng */}
                                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            Tổng cộng
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                            {formatCurrency(totalDebitJournal)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                            {formatCurrency(totalCreditJournal)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">
                                {addingRows.length > 0 || (formData.product_variants || []).length > 0
                                    ? "Đang tính toán bút toán..." 
                                    : "Chưa có bút toán. Vui lòng thêm sản phẩm vào phiếu."}
                            </p>
                        </div>
                    )}

                    {!isBalanced && editableEntries.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">
                                ⚠️ Tổng Nợ và tổng Có không cân bằng. Vui lòng kiểm tra lại!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Debt Tab - Giữ nguyên */}
            {activeTab === "debt" && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Thông tin công nợ
                    </h4>

                    {debtInfo.total > 0 ? (
                        <div className="space-y-4">
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

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <h5 className="text-sm font-medium text-gray-700">
                                        Chi tiết công nợ
                                    </h5>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">
                                            Tiền hàng
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(debtInfo.totalAmount || 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">
                                            Tiền thuế (VAT)
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(debtInfo.vatAmount || 0)}
                                        </span>
                                    </div>

                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">
                                                Tổng {type === "purchase" ? "phải trả" : "phải thu"}
                                            </span>
                                            <span className="font-semibold text-lg text-red-600">
                                                {formatCurrency(debtInfo.total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">
                                {addingRows.length > 0 || (formData.product_variants || []).length > 0
                                    ? "Đang tính toán công nợ..."
                                    : "Chưa có công nợ. Vui lòng thêm sản phẩm vào phiếu."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}