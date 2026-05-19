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
    Landmark,
    RefreshCw,
} from "lucide-react";
import SelectCombobox from "../../ui/select-combobox";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/admin/lib/utils";
import { useEventBus } from "@/EventBus";

const DEFAULT_ENTRIES_CONFIG = {
    debit: {
        row1: {
            side: "debit",
            account: "331",
            fallbackName: "Phải trả nhà cung cấp",
        },
        row2: {
            side: "credit",
            account: "1121",
            fallbackName: "Tiền gửi ngân hàng",
        },
    },
    credit: {
        row1: {
            side: "debit",
            account: "1121",
            fallbackName: "Tiền gửi ngân hàng",
        },
        row2: {
            side: "credit",
            account: "131",
            fallbackName: "Phải thu khách hàng",
        },
    },
};

export default function NoteAccountingTabs({
    formData,
    accountingAccounts = [],
    type = "debit",
    formatCurrency,
    onJournalEntriesChange,
}) {
    const { emit } = useEventBus();
    const [entries, setEntries] = useState([]);
    const initSourceRef = useRef(null);
    const prevAmountRef = useRef(formData.amount);
    const isInternalUpdateRef = useRef(false);
    const debounceTimerRef = useRef(null);
    const isAutoGeneratingRef = useRef(false);

    const getAccountName = useCallback(
        (code) => {
            const acc = accountingAccounts.find(
                (a) => String(a.account_code) === String(code),
            );
            return acc?.name || String(code);
        },
        [accountingAccounts],
    );

    const buildDefaultEntries = useCallback(
        (amount) => {
            const config =
                DEFAULT_ENTRIES_CONFIG[type] ?? DEFAULT_ENTRIES_CONFIG.debit;
            const ts = Date.now();

            return ["row1", "row2"].map((rowKey) => {
                const cfg = config[rowKey];
                return {
                    id: `default_${rowKey}_${ts}`,
                    account_code: String(cfg.account),
                    account_name:
                        getAccountName(cfg.account) || cfg.fallbackName,
                    debit: cfg.side === "debit" ? amount : 0,
                    credit: cfg.side === "credit" ? amount : 0,
                };
            });
        },
        [type, getAccountName],
    );

    const accountOptions = useMemo(() => {
        return [...accountingAccounts]
            .sort((a, b) => a.account_code.localeCompare(b.account_code))
            .map((acc) => ({
                value: String(acc.account_code),
                label: `${acc.account_code} - ${acc.name}`,
            }));
    }, [accountingAccounts]);

    // Khởi tạo từ server (CHỈ chạy 1 lần khi có data từ server)
    useEffect(() => {
        if (accountingAccounts.length === 0) return;
        if (!formData.journal_entries?.length) return;
        if (initSourceRef.current !== null) return;

        const mapped = formData.journal_entries.map((detail, i) => ({
            id: `server_${i}_${detail.account_code}_${Date.now()}`,
            account_code: String(detail.account_code),
            account_name: getAccountName(detail.account_code),
            debit: parseFloat(detail.debit) || 0,
            credit: parseFloat(detail.credit) || 0,
        }));

        setEntries(mapped);
        initSourceRef.current = "server";
    }, [accountingAccounts, formData.journal_entries, getAccountName]);

    // Tạo hoặc cập nhật entries khi amount thay đổi
    useEffect(() => {
        if (accountingAccounts.length === 0) return;
        if (isInternalUpdateRef.current) return;
        if (isAutoGeneratingRef.current) return;

        const currentAmount = parseFloat(formData.amount) || 0;
        const prevAmount = parseFloat(prevAmountRef.current) || 0;

        // Cập nhật ref
        prevAmountRef.current = formData.amount;

        // Trường hợp 1: Chưa có entries nào và amount > 0 -> tạo mới
        if (entries.length === 0 && currentAmount > 0) {
            setEntries(buildDefaultEntries(currentAmount));
            initSourceRef.current = "default";
            return;
        }

        // Trường hợp 2: Đã có entries
        if (entries.length > 0) {
            // Nếu amount = 0 -> reset tất cả về 0, nhưng giữ nguyên cấu trúc
            if (currentAmount === 0) {
                if (entries.some((e) => e.debit !== 0 || e.credit !== 0)) {
                    setEntries((prev) =>
                        prev.map((e) => ({ ...e, debit: 0, credit: 0 })),
                    );
                }
                return;
            }

            // Nếu amount thay đổi và entries đang có số dương hoặc đang là default/manual
            const hasPositiveBalance = entries.some(
                (e) => (e.debit || 0) > 0 || (e.credit || 0) > 0,
            );
            const isFromDefault = initSourceRef.current === "default";
            const isFromManual = initSourceRef.current === "manual";

            if (hasPositiveBalance || isFromDefault || isFromManual) {
                // Kiểm tra xem entries có phải là cấu trúc default không
                const isDefaultStructure =
                    entries.length === 2 &&
                    entries[0]?.account_code ===
                        (type === "debit" ? "331" : "1121") &&
                    entries[1]?.account_code ===
                        (type === "debit" ? "1121" : "131");

                if (isDefaultStructure && initSourceRef.current !== "manual") {
                    // Nếu còn cấu trúc default, cập nhật số tiền
                    isAutoGeneratingRef.current = true;
                    setEntries((prev) =>
                        prev.map((e) => {
                            const hadDebit = (e.debit || 0) > 0;
                            const hadCredit = (e.credit || 0) > 0;
                            if (!hadDebit && !hadCredit) {
                                // Giữ nguyên side dựa trên account_code
                                const isDebitAccount =
                                    e.account_code ===
                                    (type === "debit" ? "331" : "1121");
                                return {
                                    ...e,
                                    debit: isDebitAccount ? currentAmount : 0,
                                    credit: !isDebitAccount ? currentAmount : 0,
                                };
                            }
                            if (hadDebit)
                                return {
                                    ...e,
                                    debit: currentAmount,
                                    credit: 0,
                                };
                            return { ...e, debit: 0, credit: currentAmount };
                        }),
                    );
                    setTimeout(() => {
                        isAutoGeneratingRef.current = false;
                    }, 100);
                } else if (currentAmount !== prevAmount) {
                    // Nếu là manual hoặc cấu trúc đã thay đổi, chỉ cập nhật số tiền cho các dòng có giá trị
                    isAutoGeneratingRef.current = true;
                    setEntries((prev) =>
                        prev.map((e) => {
                            const hadDebit = (e.debit || 0) > 0;
                            const hadCredit = (e.credit || 0) > 0;
                            if (!hadDebit && !hadCredit) return e;
                            if (hadDebit)
                                return {
                                    ...e,
                                    debit: currentAmount,
                                    credit: 0,
                                };
                            return { ...e, debit: 0, credit: currentAmount };
                        }),
                    );
                    setTimeout(() => {
                        isAutoGeneratingRef.current = false;
                    }, 100);
                }
            }
        }
    }, [
        formData.amount,
        accountingAccounts,
        buildDefaultEntries,
        entries.length,
        type,
    ]);

    // Debounce notify parent để tránh gọi quá nhiều
    const notifyParent = useCallback(
        (entriesToNotify) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                if (onJournalEntriesChange && entriesToNotify) {
                    onJournalEntriesChange(entriesToNotify);
                }
            }, 300);
        },
        [onJournalEntriesChange],
    );

    // Notify parent khi entries thay đổi (có debounce)
    const prevNotifiedRef = useRef(null);
    useEffect(() => {
        if (!initSourceRef.current && entries.length === 0) return;
        if (!onJournalEntriesChange) return;

        const formatted = entries.map((e) => ({
            account_code: e.account_code,
            debit: parseFloat(e.debit) || 0,
            credit: parseFloat(e.credit) || 0,
        }));

        const key = JSON.stringify(formatted);
        if (prevNotifiedRef.current === key) return;
        prevNotifiedRef.current = key;

        notifyParent(formatted);
    }, [entries, onJournalEntriesChange, notifyParent]);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleResetToDefault = useCallback(() => {
        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) {
            emit(
                "toast:warning",
                "Vui lòng nhập số tiền trước khi tạo bút toán!",
            );
            return;
        }

        isInternalUpdateRef.current = true;
        setEntries(buildDefaultEntries(amount));
        initSourceRef.current = "default";
        setTimeout(() => {
            isInternalUpdateRef.current = false;
        }, 100);
    }, [formData.amount, buildDefaultEntries, emit]);

    const handleAccountChange = useCallback(
        (index, accountCode) => {
            initSourceRef.current = "manual";
            setEntries((prev) => {
                const next = [...prev];
                next[index] = {
                    ...next[index],
                    account_code: String(accountCode),
                    account_name: getAccountName(accountCode),
                };
                return next;
            });
        },
        [getAccountName],
    );

    const handleAmountChange = useCallback((index, field, value) => {
        initSourceRef.current = "manual";
        const numValue = parseFloat(value) || 0;
        setEntries((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: numValue };
            return next;
        });
    }, []);

    const handleAddEntry = useCallback(() => {
        initSourceRef.current = "manual";
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
    }, []);

    const handleRemoveEntry = useCallback(
        (index) => {
            if (entries.length <= 1) return;
            initSourceRef.current = "manual";
            setEntries((prev) => prev.filter((_, i) => i !== index));
        },
        [entries.length],
    );

    const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const title = type === "debit" ? "giấy báo nợ" : "giấy báo có";
    const subtitle =
        type === "debit"
            ? "Ngân hàng báo nợ - Tiền bị trích từ tài khoản"
            : "Ngân hàng báo có - Tiền được thêm vào tài khoản";

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-4">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <Landmark className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">
                                Hạch toán kế toán - {title}
                            </CardTitle>
                            <CardDescription>{subtitle}</CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {entries.length > 0 && (
                            <Badge
                                className={cn(
                                    "flex items-center gap-1",
                                    isBalanced
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700",
                                )}
                            >
                                {isBalanced ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                    <XCircle className="h-3 w-3" />
                                )}
                                {isBalanced ? "Cân bằng" : "Mất cân bằng"}
                            </Badge>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetToDefault}
                            disabled={parseFloat(formData.amount) <= 0}
                        >
                            <RefreshCw className="w-4 h-4 mr-1" /> Tạo lại
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddEntry}
                        >
                            <Plus className="w-4 h-4 mr-1" /> Thêm dòng
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-3">
                            <Landmark className="h-7 w-7 text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Chưa có bút toán nào
                        </p>
                        <p className="text-xs mt-1 text-center text-slate-400">
                            Nhập số tiền để tạo định khoản tự động
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                <TableRow>
                                    <TableHead className="w-[45%] font-semibold text-slate-700">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4 text-blue-600" />
                                            Tài khoản{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">
                                        <div className="flex items-center justify-end gap-1">
                                            <DollarSign className="h-4 w-4 text-green-600" />{" "}
                                            Nợ
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">
                                        <div className="flex items-center justify-end gap-1">
                                            <DollarSign className="h-4 w-4 text-purple-600" />{" "}
                                            Có
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[52px]" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {entries.map((entry, index) => (
                                    <TableRow
                                        key={entry.id}
                                        className="hover:bg-blue-50/30"
                                    >
                                        <TableCell className="py-2">
                                            <SelectCombobox
                                                value={entry.account_code}
                                                onChange={(v) =>
                                                    handleAccountChange(
                                                        index,
                                                        v,
                                                    )
                                                }
                                                options={accountOptions}
                                                placeholder="-- Chọn tài khoản --"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
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
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
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
                                            />
                                        </TableCell>
                                        <TableCell className="py-2 text-center">
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
                                <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-t">
                                    <TableCell className="py-3 font-semibold">
                                        Tổng cộng
                                    </TableCell>
                                    <TableCell className="py-3 text-right font-bold text-green-600">
                                        {formatCurrency(totalDebit)}
                                    </TableCell>
                                    <TableCell className="py-3 text-right font-bold text-purple-600">
                                        {formatCurrency(totalCredit)}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}

                {!isBalanced && entries.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
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