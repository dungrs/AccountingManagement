import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import SelectCombobox from "../../ui/select-combobox";

export default function VoucherAccountingTabs({
    formData,
    accountingAccounts = [],
    type = "payment", // "payment" hoặc "receipt"
    formatCurrency,
    onJournalEntriesChange,
}) {
    // State cho danh sách bút toán có thể chỉnh sửa
    const [entries, setEntries] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Tìm tài khoản theo mã
    const findAccount = (code) =>
        accountingAccounts.find((acc) => acc.account_code === code);

    // Format danh sách tài khoản cho Select component
    const accountOptions = useMemo(() => {
        // Sắp xếp theo mã tài khoản
        const sorted = [...accountingAccounts].sort((a, b) =>
            a.account_code.localeCompare(b.account_code),
        );

        return sorted.map((acc) => ({
            value: acc.account_code,
            label: `${acc.account_code} - ${acc.name}`,
        }));
    }, [accountingAccounts]);

    // Xác định tài khoản tiền mặc định dựa trên phương thức thanh toán
    const getDefaultCashAccount = () => {
        return formData.payment_method === "bank" ? "112" : "111";
    };

    // Tạo bút toán mặc định từ formData
    const generateDefaultEntries = () => {
        const amount = parseFloat(formData.amount) || 0;
        const cashAccountCode = getDefaultCashAccount();

        if (type === "payment") {
            // Phiếu chi: Nợ (thường là 331) / Có (111/112)
            return [
                {
                    id: `temp_${Date.now()}_1`,
                    account_code: "331",
                    account_name:
                        findAccount("331")?.name || "Phải trả nhà cung cấp",
                    debit: amount,
                    credit: 0,
                },
                {
                    id: `temp_${Date.now()}_2`,
                    account_code: cashAccountCode,
                    account_name:
                        findAccount(cashAccountCode)?.name ||
                        (cashAccountCode === "112"
                            ? "Tiền gửi ngân hàng"
                            : "Tiền mặt"),
                    debit: 0,
                    credit: amount,
                },
            ];
        } else {
            // Phiếu thu: Nợ (111/112) / Có (thường là 131)
            return [
                {
                    id: `temp_${Date.now()}_1`,
                    account_code: cashAccountCode,
                    account_name:
                        findAccount(cashAccountCode)?.name ||
                        (cashAccountCode === "112"
                            ? "Tiền gửi ngân hàng"
                            : "Tiền mặt"),
                    debit: amount,
                    credit: 0,
                },
                {
                    id: `temp_${Date.now()}_2`,
                    account_code: "131",
                    account_name:
                        findAccount("131")?.name || "Phải thu khách hàng",
                    debit: 0,
                    credit: amount,
                },
            ];
        }
    };

    // Khởi tạo entries từ dữ liệu server hoặc tạo mới
    useEffect(() => {
        console.log("=== INIT ENTRIES ===");
        console.log("isInitialized:", isInitialized);
        console.log("formData.journal_entries:", formData.journal_entries);
        console.log("formData.amount:", formData.amount);
        console.log("formData.payment_method:", formData.payment_method);
        console.log("accountingAccounts length:", accountingAccounts.length);

        // Nếu đang edit và có journal_entries từ server
        if (formData.journal_entries && formData.journal_entries.length > 0) {
            // Kiểm tra xem có details trong journal_entries[0] không
            const firstEntry = formData.journal_entries[0];
            let serverEntries = [];

            console.log("firstEntry:", firstEntry);

            if (firstEntry?.details && Array.isArray(firstEntry.details)) {
                // Trường hợp có cấu trúc journal_entries[0].details
                serverEntries = firstEntry.details;
                console.log("Using firstEntry.details");
            } else if (Array.isArray(formData.journal_entries)) {
                // Trường hợp journal_entries là array trực tiếp
                serverEntries = formData.journal_entries;
                console.log("Using formData.journal_entries directly");
            }

            console.log("serverEntries:", serverEntries);

            if (serverEntries.length > 0) {
                const mappedEntries = serverEntries.map((detail, index) => {
                    const account = findAccount(detail.account_code);
                    console.log(`Mapping entry ${index}:`, detail, "Found account:", account);
                    return {
                        id: detail.id || `server_${index}_${Date.now()}`,
                        account_code: detail.account_code,
                        account_name: account?.name || detail.account_code,
                        debit: parseFloat(detail.debit) || 0,
                        credit: parseFloat(detail.credit) || 0,
                    };
                });
                
                console.log("✅ Loaded entries from server:", mappedEntries);
                setEntries(mappedEntries);
                setIsInitialized(true);
                return;
            }
        }

        // Chỉ tạo entries mặc định nếu chưa được khởi tạo
        if (!isInitialized) {
            // LUÔN LUÔN tạo entries mặc định ngay từ đầu
            // Nếu có số tiền thì tạo với số tiền đó, nếu không thì tạo với 0
            const defaultEntries = generateDefaultEntries();
            console.log("✅ Created default entries:", defaultEntries);
            setEntries(defaultEntries);
            setIsInitialized(true);
        }
    }, [formData.journal_entries, formData.amount, isInitialized]);

    // Cập nhật entries khi payment_method thay đổi
    useEffect(() => {
        if (!isInitialized) return;
        if (entries.length === 0) return;

        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) return;

        const cashAccountCode = getDefaultCashAccount();
        const cashAccount = findAccount(cashAccountCode);

        setEntries((prev) => {
            return prev.map((entry, index) => {
                // Tìm dòng có tài khoản tiền (111 hoặc 112)
                const isCashAccount = entry.account_code === "111" || entry.account_code === "112";
                
                if (isCashAccount) {
                    // Cập nhật tài khoản tiền theo payment_method
                    return {
                        ...entry,
                        account_code: cashAccountCode,
                        account_name: cashAccount?.name || (cashAccountCode === "112" ? "Tiền gửi ngân hàng" : "Tiền mặt"),
                    };
                }
                
                return entry;
            });
        });
    }, [formData.payment_method]);

    // Cập nhật số tiền trong entries khi amount thay đổi
    useEffect(() => {
        if (!isInitialized) return;
        if (entries.length === 0) return;

        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) return;

        setEntries((prev) => {
            // Tính tỷ lệ thay đổi
            const oldTotal = prev.reduce((sum, e) => sum + (e.debit || 0), 0);
            const ratio = oldTotal > 0 ? amount / oldTotal : 1;

            return prev.map((entry) => {
                if (type === "payment") {
                    // Phiếu chi: dòng đầu là nợ, dòng cuối là có
                    if (entry.debit > 0) {
                        return { ...entry, debit: entry.debit * ratio };
                    } else if (entry.credit > 0) {
                        return { ...entry, credit: entry.credit * ratio };
                    }
                } else {
                    // Phiếu thu: dòng đầu là nợ, dòng cuối là có
                    if (entry.debit > 0) {
                        return { ...entry, debit: entry.debit * ratio };
                    } else if (entry.credit > 0) {
                        return { ...entry, credit: entry.credit * ratio };
                    }
                }
                return entry;
            });
        });
    }, [formData.amount]);

    // Thông báo khi entries thay đổi
    useEffect(() => {
        if (onJournalEntriesChange && isInitialized) {
            onJournalEntriesChange(entries);
        }
    }, [entries]);

    // Xử lý thay đổi tài khoản
    const handleAccountChange = (index, accountCode) => {
        const account = findAccount(accountCode);
        setEntries((prev) => {
            const newEntries = [...prev];
            newEntries[index] = {
                ...newEntries[index],
                account_code: accountCode,
                account_name: account?.name || accountCode,
            };
            return newEntries;
        });
    };

    // Xử lý thay đổi số tiền
    const handleAmountChange = (index, field, value) => {
        const numValue = parseFloat(value) || 0;
        setEntries((prev) => {
            const newEntries = [...prev];
            newEntries[index] = {
                ...newEntries[index],
                [field]: numValue,
            };
            return newEntries;
        });
    };

    // Thêm dòng bút toán mới
    const handleAddEntry = () => {
        const newEntry = {
            id: `new_${Date.now()}_${entries.length}`,
            account_code: "",
            account_name: "",
            debit: 0,
            credit: 0,
        };
        setEntries([...entries, newEntry]);
    };

    // Xóa dòng bút toán
    const handleRemoveEntry = (index) => {
        if (entries.length <= 1) return; // Không cho xóa nếu chỉ còn 1 dòng
        setEntries((prev) => prev.filter((_, i) => i !== index));
    };

    // Tính tổng
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001;

    return (
        <Card className="p-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">
                        Hạch toán kế toán
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Nhập các bút toán cho phiếu{" "}
                        {type === "payment" ? "chi" : "thu"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`text-sm px-3 py-1 rounded-full ${
                            isBalanced
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
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
            </div>

            {/* Bảng bút toán - Luôn hiển thị */}
            <div className="space-y-4">
                {/* Bảng bút toán */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                                    Tài khoản{" "}
                                    <span className="text-red-500">*</span>
                                </th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                    Nợ
                                </th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                    Có
                                </th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                    <span className="sr-only">
                                        Thao tác
                                    </span>
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {entries.map((entry, index) => (
                                <tr
                                    key={entry.id}
                                    className="hover:bg-gray-50"
                                >
                                    {/* Tài khoản - Sử dụng SelectCombobox */}
                                    <td className="py-2 px-4">
                                        <SelectCombobox
                                            value={entry.account_code}
                                            onChange={(value) =>
                                                handleAccountChange(
                                                    index,
                                                    value,
                                                )
                                            }
                                            options={accountOptions}
                                            placeholder="-- Chọn tài khoản --"
                                            searchPlaceholder="Tìm tài khoản..."
                                        />
                                    </td>

                                    {/* Số tiền Nợ */}
                                    <td className="py-2 px-4">
                                        <Input
                                            type="number"
                                            value={entry.debit || ""}
                                            onChange={(e) =>
                                                handleAmountChange(
                                                    index,
                                                    "debit",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0"
                                            className="w-full text-right"
                                            step="1000"
                                            min="0"
                                        />
                                    </td>

                                    {/* Số tiền Có */}
                                    <td className="py-2 px-4">
                                        <Input
                                            type="number"
                                            value={entry.credit || ""}
                                            onChange={(e) =>
                                                handleAmountChange(
                                                    index,
                                                    "credit",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0"
                                            className="w-full text-right"
                                            step="1000"
                                            min="0"
                                        />
                                    </td>

                                    {/* Nút xóa */}
                                    <td className="py-2 px-4 text-center">
                                        {entries.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemoveEntry(index)
                                                }
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {/* Dòng tổng cộng */}
                            <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                <td className="py-3 px-4 text-sm text-gray-900">
                                    Tổng cộng
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                    {formatCurrency(totalDebit)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                    {formatCurrency(totalCredit)}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Hiển thị thông báo mất cân bằng */}
                {!isBalanced && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">
                            ⚠️ Tổng Nợ và tổng Có không cân bằng. Vui lòng
                            kiểm tra lại!
                        </p>
                    </div>
                )}

                {/* Hiển thị ghi chú bút toán từ form */}
                {formData.journal_note && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">
                            📝 Ghi chú bút toán:
                        </p>
                        <p className="text-sm text-gray-700">
                            {formData.journal_note}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}