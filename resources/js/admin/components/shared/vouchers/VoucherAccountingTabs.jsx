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

import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Badge } from "@/admin/components/ui/badge";
import {
    Plus,
    Trash2,
    BookOpen,
    DollarSign,
    CheckCircle2,
    XCircle,
    Info,
    AlertCircle,
} from "lucide-react";
import SelectCombobox from "../../ui/select-combobox";
import { useRef, useState, useMemo, useEffect } from "react";
import { cn } from "@/admin/lib/utils";

export default function VoucherAccountingTabs({
    formData,
    accountingAccounts = [],
    type = "payment", // "payment" hoặc "receipt"
    formatCurrency,
    onJournalEntriesChange,
}) {
    // State cho danh sách bút toán có thể chỉnh sửa
    const [entries, setEntries] = useState([]);
    const isInitialized = useRef(false);
    const prevPaymentMethod = useRef(formData.payment_method);
    const prevAmount = useRef(formData.amount);
    const isUpdatingFromServer = useRef(false);

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
            return [
                {
                    id: `default_1_${Date.now()}`,
                    account_code: "331",
                    account_name:
                        findAccount("331")?.name || "Phải trả nhà cung cấp",
                    debit: amount,
                    credit: 0,
                },
                {
                    id: `default_2_${Date.now()}`,
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
            return [
                {
                    id: `default_1_${Date.now()}`,
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
                    id: `default_2_${Date.now()}`,
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
        if (isInitialized.current) return;

        isUpdatingFromServer.current = true;

        // Nếu đang edit và có journal_entries từ server
        if (formData.journal_entries && formData.journal_entries.length > 0) {
            const firstEntry = formData.journal_entries[0];
            let serverEntries = [];

            if (firstEntry?.details && Array.isArray(firstEntry.details)) {
                serverEntries = firstEntry.details;
            } else if (Array.isArray(formData.journal_entries)) {
                serverEntries = formData.journal_entries;
            }

            if (serverEntries.length > 0) {
                const mappedEntries = serverEntries.map((detail, index) => {
                    const account = findAccount(detail.account_code);
                    return {
                        id: detail.id || `server_${index}_${Date.now()}`,
                        account_code: detail.account_code,
                        account_name: account?.name || detail.account_code,
                        debit: parseFloat(detail.debit) || 0,
                        credit: parseFloat(detail.credit) || 0,
                    };
                });

                setEntries(mappedEntries);
                isInitialized.current = true;
                isUpdatingFromServer.current = false;
                return;
            }
        }

        // Tạo entries mặc định nếu không có dữ liệu từ server
        const defaultEntries = generateDefaultEntries();
        setEntries(defaultEntries);
        isInitialized.current = true;
        isUpdatingFromServer.current = false;

        // Cập nhật refs
        prevPaymentMethod.current = formData.payment_method;
        prevAmount.current = formData.amount;
    }, []); // Chỉ chạy 1 lần khi mount

    // Cập nhật entries khi payment_method thay đổi
    useEffect(() => {
        if (!isInitialized.current || isUpdatingFromServer.current) return;
        if (entries.length === 0) return;

        // Chỉ cập nhật nếu payment_method thực sự thay đổi
        if (prevPaymentMethod.current === formData.payment_method) return;

        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) return;

        const cashAccountCode = getDefaultCashAccount();
        const cashAccount = findAccount(cashAccountCode);

        setEntries((prev) => {
            return prev.map((entry) => {
                // Tìm dòng có tài khoản tiền (111 hoặc 112)
                const isCashAccount =
                    entry.account_code === "111" ||
                    entry.account_code === "112";

                if (isCashAccount) {
                    // Cập nhật tài khoản tiền theo payment_method
                    return {
                        ...entry,
                        account_code: cashAccountCode,
                        account_name:
                            cashAccount?.name ||
                            (cashAccountCode === "112"
                                ? "Tiền gửi ngân hàng"
                                : "Tiền mặt"),
                    };
                }

                return entry;
            });
        });

        // Cập nhật ref
        prevPaymentMethod.current = formData.payment_method;
    }, [formData.payment_method, entries.length]);

    // Cập nhật số tiền trong entries khi amount thay đổi
    useEffect(() => {
        if (!isInitialized.current || isUpdatingFromServer.current) return;
        if (entries.length === 0) return;

        // Chỉ cập nhật nếu amount thực sự thay đổi
        if (prevAmount.current === formData.amount) return;

        const amount = parseFloat(formData.amount) || 0;

        // Tính tổng debit hiện tại
        const currentTotalDebit = entries.reduce(
            (sum, e) => sum + (e.debit || 0),
            0,
        );

        // Nếu tổng debit hiện tại khác với amount, cập nhật lại
        if (Math.abs(currentTotalDebit - amount) > 0.01) {
            setEntries((prev) => {
                return prev.map((entry) => {
                    if (type === "payment") {
                        if (entry.account_code === "331") {
                            return { ...entry, debit: amount };
                        } else if (
                            entry.account_code === "111" ||
                            entry.account_code === "112"
                        ) {
                            return { ...entry, credit: amount };
                        }
                    } else {
                        if (
                            entry.account_code === "111" ||
                            entry.account_code === "112"
                        ) {
                            return { ...entry, debit: amount };
                        } else if (entry.account_code === "131") {
                            return { ...entry, credit: amount };
                        }
                    }
                    return entry;
                });
            });
        }

        // Cập nhật ref
        prevAmount.current = formData.amount;
    }, [formData.amount, entries.length, type]);

    // Thông báo khi entries thay đổi
    useEffect(() => {
        if (onJournalEntriesChange && isInitialized.current) {
            // ✅ Gửi entries với định dạng phù hợp
            const formattedEntries = entries.map((entry) => ({
                account_code: entry.account_code,
                debit: parseFloat(entry.debit) || 0,
                credit: parseFloat(entry.credit) || 0,
            }));
            onJournalEntriesChange(formattedEntries);
        }
    }, [entries]); // ✅ Chỉ phụ thuộc vào entries

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
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-4">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">
                                Hạch toán kế toán
                            </CardTitle>
                            <CardDescription>
                                Nhập các bút toán cho phiếu{" "}
                                {type === "payment" ? "chi" : "thu"}
                            </CardDescription>
                        </div>
                    </div>

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
                                <XCircle className="h-3 w-3" />
                            )}
                            {isBalanced ? "Cân bằng" : "Mất cân bằng"}
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
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                            <TableRow>
                                <TableHead className="w-[40%] font-semibold text-slate-700">
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                        Tài khoản{" "}
                                        <span className="text-red-500">*</span>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">
                                    <div className="flex items-center justify-end gap-1">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                        Nợ
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">
                                    <div className="flex items-center justify-end gap-1">
                                        <DollarSign className="h-4 w-4 text-purple-600" />
                                        Có
                                    </div>
                                </TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow
                                    key={entry.id}
                                    className="hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200"
                                >
                                    {/* Account */}
                                    <TableCell>
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
                                            icon={
                                                <BookOpen className="h-4 w-4 text-blue-600" />
                                            }
                                        />
                                    </TableCell>

                                    {/* Debit */}
                                    <TableCell>
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
                                            className="text-right border-slate-200 focus:border-green-500 focus:ring-green-500"
                                            placeholder="0"
                                            step="1000"
                                            min="0"
                                        />
                                    </TableCell>

                                    {/* Credit */}
                                    <TableCell>
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
                                            className="text-right border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="0"
                                            step="1000"
                                            min="0"
                                        />
                                    </TableCell>

                                    {/* Delete */}
                                    <TableCell className="text-center">
                                        {entries.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleRemoveEntry(index)
                                                }
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Total row */}
                            <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 font-medium">
                                <TableCell className="font-semibold text-slate-800">
                                    Tổng cộng
                                </TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                    {formatCurrency(totalDebit)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-purple-600">
                                    {formatCurrency(totalCredit)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Unbalanced Warning */}
                {!isBalanced && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">
                                ⚠️ Tổng Nợ và tổng Có không cân bằng. Vui lòng
                                kiểm tra lại!
                            </p>
                        </div>
                    </div>
                )}

                {/* Journal Note */}
                {formData.journal_note && (
                    <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    📝 Ghi chú bút toán
                                </p>
                                <p className="text-sm text-slate-700">
                                    {formData.journal_note}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}