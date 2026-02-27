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
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/admin/lib/utils";

/**
 * Cấu hình định khoản mặc định theo nghiệp vụ kế toán Việt Nam:
 *
 * PHIẾU THU (receipt) — Thu tiền từ khách hàng:
 *   Nợ TK 111/112  (Tiền mặt / Ngân hàng)
 *   Có TK 131      (Phải thu khách hàng)
 *
 * PHIẾU CHI (payment) — Chi tiền cho nhà cung cấp:
 *   Nợ TK 331      (Phải trả nhà cung cấp)
 *   Có TK 111/112  (Tiền mặt / Ngân hàng)
 *
 * row1 / row2: thứ tự hiển thị trong bảng
 * accountResolver: "cash" = tự động dùng 111/112 theo payment_method
 * account: mã TK cố định
 * side: "debit" (cột Nợ) | "credit" (cột Có)
 */
const DEFAULT_ENTRIES_CONFIG = {
    receipt: {
        row1: { side: "debit", accountResolver: "cash" },
        row2: {
            side: "credit",
            account: "131",
            fallbackName: "Phải thu khách hàng",
        },
    },
    payment: {
        row1: {
            side: "debit",
            account: "331",
            fallbackName: "Phải trả nhà cung cấp",
        },
        row2: { side: "credit", accountResolver: "cash" },
    },
};

export default function VoucherAccountingTabs({
    formData,
    accountingAccounts = [],
    type = "receipt",
    formatCurrency,
    onJournalEntriesChange,
}) {
    const [entries, setEntries] = useState([]);

    /**
     * Trạng thái nguồn dữ liệu:
     *   null      — chưa khởi tạo
     *   "server"  — lấy từ journal_entries của server (chế độ edit)
     *   "default" — tạo tự động từ amount + payment_method (chế độ create)
     *   "manual"  — user đã tự chỉnh sửa entries (không tự động ghi đè nữa)
     */
    const initSourceRef = useRef(null);

    // ─── Stable helpers ───────────────────────────────────────────────────────

    const getAccountName = useCallback(
        (code) => {
            const acc = accountingAccounts.find(
                (a) => String(a.account_code) === String(code),
            );
            return acc?.name || String(code);
        },
        [accountingAccounts],
    );

    const getCashCode = useCallback(
        () => (formData.payment_method === "bank" ? "112" : "111"),
        [formData.payment_method],
    );

    /**
     * Xây 2 dòng định khoản theo config của type hiện tại.
     * Gọi bất kỳ lúc nào cần tạo / tái tạo entries mặc định.
     */
    const buildDefaultEntries = useCallback(
        (amount) => {
            const config =
                DEFAULT_ENTRIES_CONFIG[type] ?? DEFAULT_ENTRIES_CONFIG.receipt;
            const cashCode = getCashCode();
            const ts = Date.now();

            return ["row1", "row2"].map((rowKey) => {
                const cfg = config[rowKey];
                const isCash = cfg.accountResolver === "cash";
                const code = isCash ? cashCode : cfg.account;
                const name = isCash
                    ? getAccountName(cashCode)
                    : getAccountName(code) || cfg.fallbackName;

                return {
                    id: `default_${rowKey}_${ts}`,
                    account_code: String(code),
                    account_name: name,
                    debit: cfg.side === "debit" ? amount : 0,
                    credit: cfg.side === "credit" ? amount : 0,
                };
            });
        },
        [type, getCashCode, getAccountName],
    );

    // ─── accountOptions ───────────────────────────────────────────────────────

    const accountOptions = useMemo(() => {
        return [...accountingAccounts]
            .sort((a, b) => a.account_code.localeCompare(b.account_code))
            .map((acc) => ({
                value: String(acc.account_code),
                label: `${acc.account_code} - ${acc.name}`,
            }));
    }, [accountingAccounts]);

    // ─── EFFECT 1: Khởi tạo từ server journal_entries (chế độ edit) ──────────
    // Chạy khi accounts đã sẵn sàng và có dữ liệu server.
    useEffect(() => {
        if (accountingAccounts.length === 0) return;
        if (!formData.journal_entries?.length) return;

        const mapped = formData.journal_entries.map((detail, i) => ({
            id: `server_${i}_${detail.account_code}`,
            account_code: String(detail.account_code),
            account_name: getAccountName(detail.account_code),
            debit: parseFloat(detail.debit) || 0,
            credit: parseFloat(detail.credit) || 0,
        }));

        setEntries(mapped);
        initSourceRef.current = "server";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountingAccounts, formData.journal_entries]);

    // ─── EFFECT 2: Tạo default entries (null → default) ────────────────────────
    // Chạy khi accounts load xong + amount + payment_method.
    // Chỉ tạo entries khi chưa có (null) — KHÔNG ghi đè server/manual/default.
    useEffect(() => {
        if (accountingAccounts.length === 0) return;
        if (initSourceRef.current !== null) return; // đã có entries → bỏ qua

        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) return; // chưa có số tiền → chờ

        setEntries(buildDefaultEntries(amount));
        initSourceRef.current = "default";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.amount, formData.payment_method, accountingAccounts]);

    // ─── EFFECT 3 (amount sync): Cập nhật SỐ TIỀN — chạy với MỌI trạng thái ───
    // Chỉ cập nhật debit/credit — KHÔNG đụng vào account_code.
    // Logic: dòng nào có debit > 0 thì update debit, có credit > 0 thì update credit.
    // Dòng trắng mới thêm (cả hai = 0) thì bỏ qua.
    const prevAmountRef = useRef(formData.amount);
    useEffect(() => {
        if (accountingAccounts.length === 0) return;
        if (!initSourceRef.current) return;
        if (prevAmountRef.current === formData.amount) return;
        prevAmountRef.current = formData.amount;

        const amount = parseFloat(formData.amount) || 0;

        if (amount <= 0) {
            setEntries((prev) =>
                prev.map((e) => ({ ...e, debit: 0, credit: 0 })),
            );
            return;
        }

        setEntries((prev) =>
            prev.map((e) => {
                const hadDebit = (e.debit || 0) > 0;
                const hadCredit = (e.credit || 0) > 0;
                if (!hadDebit && !hadCredit) return e; // dòng trắng → giữ nguyên
                if (hadDebit) return { ...e, debit: amount, credit: 0 };
                return { ...e, debit: 0, credit: amount };
            }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.amount, accountingAccounts]);

    // ─── EFFECT 4 (payment_method sync): Đổi TK tiền 111↔112 — MỌI trạng thái ─
    // Chạy khi payment_method thay đổi SAU khi đã có entries.
    // Tìm dòng có account_code là 111 hoặc 112 và đổi sang mã mới.
    const prevPaymentMethodRef = useRef(formData.payment_method);
    useEffect(() => {
        if (accountingAccounts.length === 0) return;
        if (!initSourceRef.current) return;
        if (prevPaymentMethodRef.current === formData.payment_method) return;
        prevPaymentMethodRef.current = formData.payment_method;

        const newCashCode = formData.payment_method === "bank" ? "112" : "111";

        setEntries((prev) =>
            prev.map((e) => {
                if (e.account_code === "111" || e.account_code === "112") {
                    return {
                        ...e,
                        account_code: newCashCode,
                        account_name: getAccountName(newCashCode),
                    };
                }
                return e;
            }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.payment_method, accountingAccounts]);

    // ─── EFFECT 5: Notify parent khi entries thay đổi ────────────────────────
    const prevNotifiedRef = useRef(null);
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (!onJournalEntriesChange) return;

        const formatted = entries.map((e) => ({
            account_code: e.account_code,
            debit: parseFloat(e.debit) || 0,
            credit: parseFloat(e.credit) || 0,
        }));

        const key = JSON.stringify(formatted);
        if (prevNotifiedRef.current === key) return;
        prevNotifiedRef.current = key;

        onJournalEntriesChange(formatted);
    }, [entries, onJournalEntriesChange]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleAccountChange = (index, accountCode) => {
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
    };

    const handleAmountChange = (index, field, value) => {
        initSourceRef.current = "manual";
        const numValue = parseFloat(value) || 0;
        setEntries((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: numValue };
            return next;
        });
    };

    const handleAddEntry = () => {
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
    };

    const handleRemoveEntry = (index) => {
        if (entries.length <= 1) return;
        initSourceRef.current = "manual";
        setEntries((prev) => prev.filter((_, i) => i !== index));
    };

    // ─── Totals ───────────────────────────────────────────────────────────────

    const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
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
                        {entries.length > 0 && (
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
                        )}

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

            <CardContent className="p-6 space-y-4">
                {entries.length === 0 ? (
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-3">
                            <BookOpen className="h-7 w-7 text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Chưa có bút toán nào
                        </p>
                        <p className="text-xs mt-1 text-center text-slate-400">
                            Nhập số tiền và chọn phương thức thanh toán để tạo
                            định khoản tự động
                        </p>
                    </div>
                ) : (
                    /* ── Table ── */
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
                                    <TableHead className="w-[52px]" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {entries.map((entry, index) => (
                                    <TableRow
                                        key={entry.id}
                                        className="hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200"
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
                                                searchPlaceholder="Tìm tài khoản..."
                                                icon={
                                                    <BookOpen className="h-4 w-4" />
                                                }
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
                                                className="text-right border-slate-200 focus:border-green-500 focus:ring-green-500"
                                                placeholder="0"
                                                min="0"
                                                step="1"
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
                                                className="text-right border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                                placeholder="0"
                                                min="0"
                                                step="1"
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
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Total row */}
                                <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-t border-slate-200">
                                    <TableCell className="py-3 font-semibold text-slate-800">
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

                {/* Warning mất cân bằng */}
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