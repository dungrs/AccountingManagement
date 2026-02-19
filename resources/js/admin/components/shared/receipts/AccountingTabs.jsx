import React, {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Badge } from "@/admin/components/ui/badge";
import {
    Plus,
    Trash2,
    BookOpen,
    Users,
    DollarSign,
    Percent,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import { cn } from "@/admin/lib/utils";

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
    addingRows = [],
    onJournalEntriesChange,
}) {
    const [activeTab, setActiveTab] = useState("journal");
    const [editableEntries, setEditableEntries] = useState([]);
    const isInitializedRef = useRef(false);

    const findAccount = useCallback(
        (code) => accountingAccounts.find((acc) => acc.account_code === code),
        [accountingAccounts],
    );

    const accountOptions = useMemo(() => {
        const sorted = [...accountingAccounts].sort((a, b) =>
            a.account_code.localeCompare(b.account_code),
        );
        return sorted.map((acc) => ({
            value: acc.account_code,
            label: `${acc.account_code} - ${acc.name}`,
        }));
    }, [accountingAccounts]);

    const defaultJournalEntries = useMemo(() => {
        const entries = [];

        const validAddingRows = (addingRows || []).filter(
            (row) =>
                row.product_variant_id &&
                parseFloat(row.quantity) > 0 &&
                parseFloat(row.price) > 0,
        );

        const allProducts = [
            ...(formData.product_variants || []),
            ...validAddingRows,
        ];

        const totalAmount = allProducts.reduce(
            (sum, item) =>
                sum +
                parseFloat(item.quantity || 0) * parseFloat(item.price || 0),
            0,
        );

        const vatAmount = allProducts.reduce(
            (sum, item) => sum + parseFloat(item.vat_amount || 0),
            0,
        );

        const grandTotal = totalAmount + vatAmount;

        const totalCost = allProducts.reduce(
            (sum, item) =>
                sum +
                parseFloat(item.quantity || 0) *
                    parseFloat(item.cost_price || 0),
            0,
        );

        if (type === "purchase") {
            // ✅ Chỉ tạo entry khi có sản phẩm
            if (allProducts.length === 0) return entries;

            const inventoryAccount = findAccount("156");
            if (inventoryAccount && totalAmount > 0) {
                entries.push({
                    id: "default_156",
                    account_code: inventoryAccount.account_code,
                    account_name: inventoryAccount.name,
                    debit: totalAmount,
                    credit: 0,
                });
            }

            const vatInputAccount = findAccount("1331");
            if (vatInputAccount && vatAmount > 0) {
                entries.push({
                    id: "default_1331",
                    account_code: vatInputAccount.account_code,
                    account_name: vatInputAccount.name,
                    debit: vatAmount,
                    credit: 0,
                });
            }

            const payableAccount = findAccount("331");
            if (payableAccount && grandTotal > 0) {
                entries.push({
                    id: "default_331",
                    account_code: payableAccount.account_code,
                    account_name: payableAccount.name,
                    debit: 0,
                    credit: grandTotal,
                });
            }
        }

        if (type === "sale") {
            // ✅ Với sale: luôn hiển thị 5 dòng bút toán, dù chưa có sản phẩm (giá trị = 0)
            const receivableAccount = findAccount("131");
            entries.push({
                id: "default_131",
                account_code: receivableAccount?.account_code || "131",
                account_name: receivableAccount?.name || "Phải thu khách hàng",
                debit: grandTotal,
                credit: 0,
            });

            const revenueAccount = findAccount("5111");
            entries.push({
                id: "default_5111",
                account_code: revenueAccount?.account_code || "5111",
                account_name: revenueAccount?.name || "Doanh thu bán hàng",
                debit: 0,
                credit: totalAmount,
            });

            const vatOutputAccount = findAccount("3331");
            entries.push({
                id: "default_3331",
                account_code: vatOutputAccount?.account_code || "3331",
                account_name: vatOutputAccount?.name || "Thuế GTGT phải nộp",
                debit: 0,
                credit: vatAmount,
            });

            const cogsAccount = findAccount("632");
            entries.push({
                id: "default_632",
                account_code: cogsAccount?.account_code || "632",
                account_name: cogsAccount?.name || "Giá vốn hàng bán",
                debit: totalAmount,
                credit: 0,
            });

            const inventoryAccount = findAccount("156");
            entries.push({
                id: "default_156_credit",
                account_code: inventoryAccount?.account_code || "156",
                account_name: inventoryAccount?.name || "Hàng hóa",
                debit: 0,
                credit: totalAmount,
            });
        }

        return entries;
    }, [addingRows, formData.product_variants, findAccount, type]);

    // ✅ Khởi tạo một lần - ưu tiên server data, fallback về default
    useEffect(() => {
        if (isInitializedRef.current) return;

        let initialEntries = [];

        if (formData.journal_entries && formData.journal_entries.length > 0) {
            const firstEntry = formData.journal_entries[0];

            if (firstEntry?.account_code) {
                initialEntries = formData.journal_entries.map(
                    (entry, index) => {
                        const account = findAccount(entry.account_code);
                        return {
                            id: entry.id || `server_${index}`,
                            account_code: entry.account_code,
                            account_name: account?.name || entry.account_code,
                            debit: parseFloat(entry.debit) || 0,
                            credit: parseFloat(entry.credit) || 0,
                        };
                    },
                );
            } else if (
                firstEntry?.details &&
                Array.isArray(firstEntry.details)
            ) {
                initialEntries = firstEntry.details.map((detail, index) => {
                    const account = findAccount(detail.account_code);
                    return {
                        id: detail.id || `server_${index}`,
                        account_code: detail.account_code,
                        account_name: account?.name || detail.account_code,
                        debit: parseFloat(detail.debit) || 0,
                        credit: parseFloat(detail.credit) || 0,
                    };
                });
            }
        }

        if (initialEntries.length > 0) {
            setEditableEntries(initialEntries);
            isInitializedRef.current = true;
        } else if (defaultJournalEntries.length > 0) {
            setEditableEntries(defaultJournalEntries);
            isInitializedRef.current = true;
        } else if (type === "sale") {
            // ✅ Với sale: ngay cả khi chưa có sản phẩm, vẫn khởi tạo 5 dòng rỗng
            const blankSaleEntries = [
                {
                    id: "default_131",
                    account_code: findAccount("131")?.account_code || "131",
                    account_name:
                        findAccount("131")?.name || "Phải thu khách hàng",
                    debit: 0,
                    credit: 0,
                },
                {
                    id: "default_5111",
                    account_code: findAccount("5111")?.account_code || "5111",
                    account_name:
                        findAccount("5111")?.name || "Doanh thu bán hàng",
                    debit: 0,
                    credit: 0,
                },
                {
                    id: "default_3331",
                    account_code: findAccount("3331")?.account_code || "3331",
                    account_name:
                        findAccount("3331")?.name || "Thuế GTGT phải nộp",
                    debit: 0,
                    credit: 0,
                },
                {
                    id: "default_632",
                    account_code: findAccount("632")?.account_code || "632",
                    account_name:
                        findAccount("632")?.name || "Giá vốn hàng bán",
                    debit: 0,
                    credit: 0,
                },
                {
                    id: "default_156_credit",
                    account_code: findAccount("156")?.account_code || "156",
                    account_name: findAccount("156")?.name || "Hàng hóa",
                    debit: 0,
                    credit: 0,
                },
            ];
            setEditableEntries(blankSaleEntries);
            isInitializedRef.current = true;
        }
    }, [formData.journal_entries, defaultJournalEntries, findAccount, type]);

    // ✅ Cập nhật số tiền khi sản phẩm thay đổi, nhưng giữ nguyên tài khoản user đã chọn
    useEffect(() => {
        if (!isInitializedRef.current) return;

        const allDefault = editableEntries.every((e) =>
            String(e.id).startsWith("default_"),
        );

        if (allDefault && defaultJournalEntries.length > 0) {
            setEditableEntries(defaultJournalEntries);
        } else if (allDefault && type === "sale") {
            // Giữ nguyên entries nhưng cập nhật số tiền theo default
            setEditableEntries((prev) =>
                prev.map((entry) => {
                    const matched = defaultJournalEntries.find(
                        (d) => d.id === entry.id,
                    );
                    return matched
                        ? {
                              ...entry,
                              debit: matched.debit,
                              credit: matched.credit,
                          }
                        : entry;
                }),
            );
        }
    }, [defaultJournalEntries]);

    // ✅ Notify parent
    useEffect(() => {
        if (onJournalEntriesChange) {
            onJournalEntriesChange(editableEntries);
        }
    }, [editableEntries, onJournalEntriesChange]);

    const handleAccountChange = (index, accountCode) => {
        const account = findAccount(accountCode);
        setEditableEntries((prev) => {
            const newEntries = [...prev];
            newEntries[index] = {
                ...newEntries[index],
                account_code: accountCode,
                account_name: account?.name || accountCode,
            };
            return newEntries;
        });
    };

    const handleAmountChange = (index, field, value) => {
        const numValue = parseFloat(value) || 0;
        setEditableEntries((prev) => {
            const newEntries = [...prev];
            newEntries[index] = { ...newEntries[index], [field]: numValue };
            return newEntries;
        });
    };

    const handleAddEntry = () => {
        setEditableEntries((prev) => [
            ...prev,
            {
                id: `new_${Date.now()}`,
                account_code: "",
                account_name: "",
                debit: 0,
                credit: 0,
            },
        ]);
    };

    const handleRemoveEntry = (index) => {
        if (editableEntries.length <= 1) return;
        setEditableEntries((prev) => prev.filter((_, i) => i !== index));
    };

    // Tính toán công nợ
    const debtInfo = useMemo(() => {
        const validAddingRows = (addingRows || []).filter(
            (row) =>
                row.product_variant_id &&
                parseFloat(row.quantity) > 0 &&
                parseFloat(row.price) > 0,
        );

        const allProducts = [
            ...(formData.product_variants || []),
            ...validAddingRows,
        ];

        if (allProducts.length === 0) {
            return {
                total: 0,
                partnerName: "",
                totalDebit: 0,
                totalCredit: 0,
                balance: 0,
                totalAmount: 0,
                vatAmount: 0,
            };
        }

        const totalAmount = allProducts.reduce((sum, item) => {
            return (
                sum +
                parseFloat(item.quantity || 0) * parseFloat(item.price || 0)
            );
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
    }, [
        addingRows,
        formData.product_variants,
        supplierName,
        customerName,
        type,
    ]);

    const totalDebitJournal = editableEntries.reduce(
        (sum, e) => sum + (e.debit || 0),
        0,
    );
    const totalCreditJournal = editableEntries.reduce(
        (sum, e) => sum + (e.credit || 0),
        0,
    );
    const isBalanced =
        Math.abs(totalDebitJournal - totalCreditJournal) < 0.0001;

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            {/* Tabs Navigation */}
            <div className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 px-6">
                <nav className="flex gap-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab("journal")}
                        className={cn(
                            "pb-3 pt-4 border-b-2 text-sm font-medium transition-all relative",
                            activeTab === "journal"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700",
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen
                                className={cn(
                                    "h-4 w-4",
                                    activeTab === "journal"
                                        ? "text-blue-600"
                                        : "text-slate-400",
                                )}
                            />
                            Hạch toán
                            {editableEntries.length > 0 && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-1">
                                    {editableEntries.length}
                                </Badge>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab("debt")}
                        type="button"
                        className={cn(
                            "pb-3 pt-4 border-b-2 text-sm font-medium transition-all",
                            activeTab === "debt"
                                ? "border-purple-600 text-purple-600"
                                : "border-transparent text-slate-500 hover:text-slate-700",
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Users
                                className={cn(
                                    "h-4 w-4",
                                    activeTab === "debt"
                                        ? "text-purple-600"
                                        : "text-slate-400",
                                )}
                            />
                            Công nợ{" "}
                            {type === "purchase"
                                ? "nhà cung cấp"
                                : "khách hàng"}
                            {debtInfo.total > 0 && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 ml-1">
                                    {formatCurrency(debtInfo.total)}
                                </Badge>
                            )}
                        </div>
                    </button>
                </nav>
            </div>

            <div className="p-6">
                {/* Journal Tab */}
                {activeTab === "journal" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    Bút toán{" "}
                                    {type === "purchase"
                                        ? "mua hàng"
                                        : "bán hàng"}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Có thể chỉnh sửa tài khoản và số tiền
                                </p>
                            </div>

                            {editableEntries.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <Badge
                                        className={cn(
                                            "flex items-center gap-1",
                                            isBalanced
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : "bg-red-100 text-red-700 border-red-200",
                                        )}
                                    >
                                        {isBalanced ? (
                                            <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                            <AlertCircle className="h-3 w-3" />
                                        )}
                                        {isBalanced
                                            ? "Cân bằng"
                                            : "Mất cân bằng"}
                                    </Badge>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddEntry}
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Thêm dòng
                                    </Button>
                                </div>
                            )}
                        </div>

                        {editableEntries.length > 0 ? (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider w-2/5">
                                                Tài khoản{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider w-1/5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <DollarSign className="h-3 w-3 text-green-600" />
                                                    Nợ
                                                </div>
                                            </th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider w-1/5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <DollarSign className="h-3 w-3 text-purple-600" />
                                                    Có
                                                </div>
                                            </th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">
                                                <span className="sr-only">
                                                    Thao tác
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-200">
                                        {editableEntries.map((entry, index) => (
                                            <tr
                                                key={entry.id}
                                                className="hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200"
                                            >
                                                <td className="py-2 px-4">
                                                    <SelectCombobox
                                                        value={
                                                            entry.account_code
                                                        }
                                                        onChange={(value) =>
                                                            handleAccountChange(
                                                                index,
                                                                value,
                                                            )
                                                        }
                                                        options={accountOptions}
                                                        placeholder="-- Chọn tài khoản --"
                                                        searchPlaceholder="Tìm kiếm tài khoản..."
                                                        className="w-full"
                                                        icon={
                                                            <BookOpen className="h-4 w-4 text-blue-600" />
                                                        }
                                                    />
                                                </td>

                                                <td className="py-2 px-4">
                                                    <Input
                                                        type="number"
                                                        value={
                                                            entry.debit || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleAmountChange(
                                                                index,
                                                                "debit",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0"
                                                        className="w-full text-right border-slate-200 focus:border-green-500 focus:ring-green-500"
                                                    />
                                                </td>

                                                <td className="py-2 px-4">
                                                    <Input
                                                        type="number"
                                                        value={
                                                            entry.credit || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleAmountChange(
                                                                index,
                                                                "credit",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0"
                                                        className="w-full text-right border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                                    />
                                                </td>

                                                <td className="py-2 px-4 text-center">
                                                    {editableEntries.length >
                                                        1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRemoveEntry(
                                                                    index,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Tổng cộng */}
                                        <tr className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 font-semibold border-t-2 border-slate-200">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-800">
                                                Tổng cộng
                                            </td>
                                            <td className="py-3 px-4 text-sm font-bold text-green-600 text-right">
                                                {formatCurrency(
                                                    totalDebitJournal,
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-bold text-purple-600 text-right">
                                                {formatCurrency(
                                                    totalCreditJournal,
                                                )}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                        <BookOpen className="h-8 w-8 text-blue-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium">
                                        {addingRows.length > 0 ||
                                        (formData.product_variants || [])
                                            .length > 0
                                            ? "Đang tính toán bút toán..."
                                            : "Chưa có bút toán nào"}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Vui lòng thêm sản phẩm vào phiếu để tạo
                                        bút toán
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isBalanced && editableEntries.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">
                                        ⚠️ Tổng Nợ và tổng Có không cân bằng.
                                        Vui lòng kiểm tra lại!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Debt Tab */}
                {activeTab === "debt" && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
                            <Users className="h-4 w-4 text-purple-600" />
                            Thông tin công nợ
                        </h4>

                        {debtInfo.total > 0 ? (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {type === "purchase"
                                                    ? "Nhà cung cấp"
                                                    : "Khách hàng"}
                                            </p>
                                            <p className="font-medium text-slate-800">
                                                {debtInfo.partnerName ||
                                                    "Chưa chọn"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                Công nợ phát sinh
                                            </p>
                                            <p className="font-bold text-blue-600 text-lg">
                                                {formatCurrency(debtInfo.total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 px-4 py-2 border-b border-slate-200">
                                        <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Percent className="h-4 w-4 text-purple-600" />
                                            Chi tiết công nợ
                                        </h5>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-slate-600">
                                                Tiền hàng
                                            </span>
                                            <span className="text-sm font-medium text-slate-800">
                                                {formatCurrency(
                                                    debtInfo.totalAmount || 0,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-slate-600">
                                                Tiền thuế (VAT)
                                            </span>
                                            <span className="text-sm font-medium text-orange-600">
                                                {formatCurrency(
                                                    debtInfo.vatAmount || 0,
                                                )}
                                            </span>
                                        </div>

                                        <div className="border-t border-slate-200 pt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-slate-800">
                                                    Tổng{" "}
                                                    {type === "purchase"
                                                        ? "phải trả"
                                                        : "phải thu"}
                                                </span>
                                                <span className="font-bold text-lg text-blue-600">
                                                    {formatCurrency(
                                                        debtInfo.total,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-purple-600/50" />
                                    </div>
                                    <p className="text-slate-600 font-medium">
                                        {addingRows.length > 0 ||
                                        (formData.product_variants || [])
                                            .length > 0
                                            ? "Đang tính toán công nợ..."
                                            : "Chưa có công nợ nào"}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Vui lòng thêm sản phẩm vào phiếu để tính
                                        công nợ
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}