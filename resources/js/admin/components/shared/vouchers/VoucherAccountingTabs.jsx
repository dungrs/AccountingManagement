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
    AlertCircle,
} from "lucide-react";
import SelectCombobox from "../../ui/select-combobox";
import { useRef, useState, useMemo, useEffect } from "react";
import { cn } from "@/admin/lib/utils";

export default function VoucherAccountingTabs({
    formData,
    accountingAccounts = [],
    type = "receipt",
    formatCurrency,
    onJournalEntriesChange,
}) {
    const [entries, setEntries] = useState([]);

    // ✅ Dùng string để track trạng thái init, tránh stale closure với ref
    const initSourceRef = useRef(null); // "server" | "default" | null
    const prevPaymentMethod = useRef(formData.payment_method);
    const prevAmount = useRef(formData.amount);

    // Format danh sách tài khoản cho SelectCombobox
    const accountOptions = useMemo(() => {
        const sorted = [...accountingAccounts].sort((a, b) =>
            a.account_code.localeCompare(b.account_code),
        );
        return sorted.map((acc) => ({
            value: String(acc.account_code),
            label: `${acc.account_code} - ${acc.name}`,
        }));
    }, [accountingAccounts]);

    // Tìm tên tài khoản theo mã
    const getAccountName = (code) => {
        const account = accountingAccounts.find(
            (acc) => String(acc.account_code) === String(code),
        );
        return account?.name || code;
    };

    const getDefaultCashAccount = () => {
        return formData.payment_method === "bank" ? "112" : "111";
    };

    // ✅ Init entries từ journal_entries của server
    // Chạy lại khi accountingAccounts load xong (để có account_name đầy đủ)
    useEffect(() => {
        // Chưa có accounts thì chờ
        if (accountingAccounts.length === 0) return;

        // ✅ Nếu có journal_entries từ server → ưu tiên dùng, luôn re-map khi accounts thay đổi
        if (formData.journal_entries && formData.journal_entries.length > 0) {
            const mappedEntries = formData.journal_entries.map(
                (detail, index) => ({
                    id: `server_${index}_${String(detail.account_code)}`,
                    account_code: String(detail.account_code),
                    account_name: getAccountName(detail.account_code),
                    debit: parseFloat(detail.debit) || 0,
                    credit: parseFloat(detail.credit) || 0,
                }),
            );

            console.log("Init from server journal_entries:", mappedEntries);
            setEntries(mappedEntries);
            initSourceRef.current = "server";

            // Sync lại payment method & amount refs
            prevPaymentMethod.current = formData.payment_method;
            prevAmount.current = formData.amount;
            return;
        }

        // Đã init từ default rồi thì không tạo lại
        if (initSourceRef.current === "default") return;

        // Tạo entries mặc định khi không có dữ liệu server
        if (formData.amount && parseFloat(formData.amount) > 0) {
            const amount = parseFloat(formData.amount) || 0;
            const cashAccountCode = getDefaultCashAccount();

            const defaultEntries = [
                {
                    id: `default_1_${Date.now()}`,
                    account_code: String(cashAccountCode),
                    account_name: getAccountName(cashAccountCode),
                    debit: amount,
                    credit: 0,
                },
                {
                    id: `default_2_${Date.now()}`,
                    account_code: "131",
                    account_name:
                        getAccountName("131") || "Phải thu khách hàng",
                    debit: 0,
                    credit: amount,
                },
            ];

            console.log("Init default entries:", defaultEntries);
            setEntries(defaultEntries);
            initSourceRef.current = "default";

            prevPaymentMethod.current = formData.payment_method;
            prevAmount.current = formData.amount;
        }
        // ✅ Chạy lại khi accountingAccounts hoặc journal_entries thay đổi
    }, [accountingAccounts, formData.journal_entries]);

    // Cập nhật account_code tiền khi payment_method thay đổi
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (entries.length === 0) return;
        if (prevPaymentMethod.current === formData.payment_method) return;

        const cashAccountCode = getDefaultCashAccount();

        setEntries((prev) =>
            prev.map((entry) => {
                if (
                    entry.account_code === "111" ||
                    entry.account_code === "112"
                ) {
                    return {
                        ...entry,
                        account_code: String(cashAccountCode),
                        account_name: getAccountName(cashAccountCode),
                    };
                }
                return entry;
            }),
        );

        prevPaymentMethod.current = formData.payment_method;
    }, [formData.payment_method]);

    // Cập nhật số tiền khi amount thay đổi (chỉ với default entries)
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (entries.length === 0) return;
        if (prevAmount.current === formData.amount) return;

        const amount = parseFloat(formData.amount) || 0;

        setEntries((prev) =>
            prev.map((entry) => {
                if (
                    entry.account_code === "111" ||
                    entry.account_code === "112"
                ) {
                    return { ...entry, debit: amount };
                } else if (entry.account_code === "131") {
                    return { ...entry, credit: amount };
                }
                return entry;
            }),
        );

        prevAmount.current = formData.amount;
    }, [formData.amount]);

    // Notify parent khi entries thay đổi
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (onJournalEntriesChange) {
            const formatted = entries.map((entry) => ({
                account_code: entry.account_code,
                debit: parseFloat(entry.debit) || 0,
                credit: parseFloat(entry.credit) || 0,
            }));
            onJournalEntriesChange(formatted);
        }
    }, [entries]);

    const handleAccountChange = (index, accountCode) => {
        setEntries((prev) => {
            const newEntries = [...prev];
            newEntries[index] = {
                ...newEntries[index],
                account_code: String(accountCode),
                account_name: getAccountName(accountCode),
            };
            return newEntries;
        });
    };

    const handleAmountChange = (index, field, value) => {
        const numValue = parseFloat(value) || 0;
        setEntries((prev) => {
            const newEntries = [...prev];
            newEntries[index] = { ...newEntries[index], [field]: numValue };
            return newEntries;
        });
    };

    const handleAddEntry = () => {
        setEntries((prev) => [
            ...prev,
            {
                id: `new_${Date.now()}_${prev.length}`,
                account_code: "",
                account_name: "",
                debit: 0,
                credit: 0,
            },
        ]);
    };

    const handleRemoveEntry = (index) => {
        if (entries.length <= 1) return;
        setEntries((prev) => prev.filter((_, i) => i !== index));
    };

    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

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
                                Nhập các bút toán cho phiếu thu
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
                                                <BookOpen className="h-4 w-4" />
                                            }
                                        />
                                    </TableCell>

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
                                            min="0"
                                            step="0.01"
                                        />
                                    </TableCell>

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
                                            min="0"
                                            step="0.01"
                                        />
                                    </TableCell>

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
            </CardContent>
        </Card>
    );
}