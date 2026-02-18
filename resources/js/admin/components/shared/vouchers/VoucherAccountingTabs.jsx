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
import { Plus, Trash2 } from "lucide-react";
import SelectCombobox from "../../ui/select-combobox";
import { useRef, useState, useMemo, useEffect } from "react";

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
        <Card className="shadow-sm">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="mb-2">Hạch toán kế toán</CardTitle>
                    <CardDescription>
                        Nhập các bút toán cho phiếu{" "}
                        {type === "payment" ? "chi" : "thu"}
                    </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant={isBalanced ? "default" : "destructive"}>
                        {isBalanced ? "✓ Cân bằng" : "✗ Mất cân bằng"}
                    </Badge>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddEntry}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm dòng
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">
                                    Tài khoản{" "}
                                    <span className="text-red-500">*</span>
                                </TableHead>
                                <TableHead className="text-right">Nợ</TableHead>
                                <TableHead className="text-right">Có</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={entry.id}>
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
                                            className="text-right"
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
                                            className="text-right"
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
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Total row */}
                            <TableRow className="bg-muted/50 font-medium">
                                <TableCell>Tổng cộng</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(totalDebit)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(totalCredit)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Unbalanced Warning */}
                {!isBalanced && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        ⚠️ Tổng Nợ và tổng Có không cân bằng. Vui lòng kiểm tra
                        lại!
                    </div>
                )}

                {/* Journal Note */}
                {formData.journal_note && (
                    <div className="rounded-md border bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                            📝 Ghi chú bút toán
                        </p>
                        <p className="text-sm">{formData.journal_note}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
