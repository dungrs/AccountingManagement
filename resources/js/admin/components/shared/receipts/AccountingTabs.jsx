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
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import { cn } from "@/admin/lib/utils";

export default function AccountingTabs({
    formData,
    accountingAccounts = [],
    type = "purchase",
    formatCurrency,
    addingRows = [],
    onJournalEntriesChange,
}) {
    const [activeTab, setActiveTab] = useState("journal");
    const [entries, setEntries] = useState([]);

    // ✅ Track trạng thái init
    const initSourceRef = useRef(null); // "server" | "default" | null
    const prevPaymentMethod = useRef(formData?.payment_method);
    const prevAmount = useRef(formData?.amount);
    const hasInitializedRef = useRef(false); // ✅ Flag để init chỉ 1 lần

    const findAccount = useCallback(
        (code) =>
            accountingAccounts.find(
                (acc) => String(acc.account_code) === String(code),
            ),
        [accountingAccounts],
    );

    // Format danh sách tài khoản
    const accountOptions = useMemo(() => {
        const sorted = [...accountingAccounts].sort((a, b) =>
            a.account_code.localeCompare(b.account_code),
        );
        return sorted.map((acc) => ({
            value: String(acc.account_code),
            label: `${acc.account_code} - ${acc.name}`,
        }));
    }, [accountingAccounts]);

    const getAccountName = useCallback(
        (code) => {
            const account = findAccount(code);
            return account?.name || code;
        },
        [findAccount],
    );

    // Tính toán số liệu
    const calculationData = useMemo(() => {
        const validAddingRows = (addingRows || []).filter(
            (row) =>
                row.product_variant_id &&
                parseFloat(row.quantity) > 0 &&
                parseFloat(row.price) > 0,
        );

        const allProducts = [
            ...(formData?.product_variants || []),
            ...validAddingRows,
        ];

        const totalAmount = allProducts.reduce(
            (sum, item) =>
                sum +
                parseFloat(item.quantity || 0) * parseFloat(item.price || 0),
            0,
        );

        const vatRate = 0.1;
        const vatAmount =
            allProducts.reduce(
                (sum, item) => sum + parseFloat(item.vat_amount || 0),
                0,
            ) || totalAmount * vatRate;

        const originalGrandTotal = totalAmount + vatAmount;
        const discountAmount = parseFloat(formData?.discount_amount || 0);
        const actualGrandTotal = originalGrandTotal - discountAmount;

        let discountExcludingVat = 0;
        let vatOnDiscount = 0;

        if (discountAmount > 0 && originalGrandTotal > 0) {
            const vatRate_actual = vatAmount / totalAmount || vatRate;
            discountExcludingVat = discountAmount / (1 + vatRate_actual);
            vatOnDiscount = discountAmount - discountExcludingVat;
        }

        return {
            totalAmount,
            vatAmount,
            originalGrandTotal,
            discountAmount,
            discountExcludingVat,
            vatOnDiscount,
            actualGrandTotal,
            allProducts,
            vatRate,
        };
    }, [addingRows, formData?.product_variants, formData?.discount_amount]);

    // ✅ Tạo entries mặc định
    const createDefaultJournalEntries = useCallback(() => {
        const entries = [];
        const {
            totalAmount,
            vatAmount,
            originalGrandTotal,
            discountAmount,
            discountExcludingVat,
            vatOnDiscount,
            allProducts,
        } = calculationData;

        if (allProducts.length === 0) return entries;

        const isCashPayment =
            formData?.payment_method === "cash" ||
            formData?.payment_method === "bank";

        if (type === "sale") {
            let receivableOrCashAccount;
            if (isCashPayment) {
                const cashAccountCode =
                    formData?.payment_method === "bank" ? "112" : "111";
                receivableOrCashAccount = findAccount(cashAccountCode);
            } else {
                receivableOrCashAccount = findAccount("131");
            }

            const defaultAccountCode = isCashPayment
                ? formData?.payment_method === "bank"
                    ? "112"
                    : "111"
                : "131";
            const defaultAccountName = isCashPayment
                ? "Tiền mặt"
                : "Phải thu của khách hàng";

            entries.push({
                id: `default_receivable_${Date.now()}_1`,
                account_code:
                    receivableOrCashAccount?.account_code || defaultAccountCode,
                account_name:
                    receivableOrCashAccount?.name || defaultAccountName,
                debit: originalGrandTotal,
                credit: 0,
            });

            const revenueAccount = findAccount("511");
            entries.push({
                id: `default_511_${Date.now()}`,
                account_code: revenueAccount?.account_code || "511",
                account_name: revenueAccount?.name || "Doanh thu bán hàng hóa",
                debit: 0,
                credit: totalAmount,
            });

            const vatOutputAccount = findAccount("3331");
            entries.push({
                id: `default_3331_${Date.now()}`,
                account_code: vatOutputAccount?.account_code || "3331",
                account_name: vatOutputAccount?.name || "Thuế GTGT phải nộp",
                debit: 0,
                credit: vatAmount,
            });

            if (discountAmount > 0) {
                const discountAccount = findAccount("521");

                entries.push({
                    id: `default_521_${Date.now()}`,
                    account_code: discountAccount?.account_code || "521",
                    account_name:
                        discountAccount?.name || "Chiết khấu thương mại",
                    debit: discountExcludingVat,
                    credit: 0,
                });

                if (vatOnDiscount > 0) {
                    entries.push({
                        id: `default_3331_discount_${Date.now()}`,
                        account_code: vatOutputAccount?.account_code || "3331",
                        account_name:
                            vatOutputAccount?.name || "Thuế GTGT phải nộp",
                        debit: vatOnDiscount,
                        credit: 0,
                    });
                }

                entries.push({
                    id: `default_receivable_discount_${Date.now()}`,
                    account_code:
                        receivableOrCashAccount?.account_code ||
                        defaultAccountCode,
                    account_name:
                        receivableOrCashAccount?.name || defaultAccountName,
                    debit: 0,
                    credit: discountAmount,
                });
            }
        }

        if (type === "purchase") {
            let cashOrPayableAccount;
            if (isCashPayment) {
                const cashAccountCode =
                    formData?.payment_method === "bank" ? "112" : "111";
                cashOrPayableAccount = findAccount(cashAccountCode);
            } else {
                cashOrPayableAccount = findAccount("331");
            }

            const defaultAccountCode = isCashPayment
                ? formData?.payment_method === "bank"
                    ? "112"
                    : "111"
                : "331";
            const defaultAccountName = isCashPayment
                ? "Tiền mặt"
                : "Phải trả người bán";

            const inventoryAccount = findAccount("156");
            entries.push({
                id: `default_156_${Date.now()}`,
                account_code: inventoryAccount?.account_code || "156",
                account_name: inventoryAccount?.name || "Hàng hóa",
                debit: totalAmount,
                credit: 0,
            });

            const vatInputAccount = findAccount("133");
            entries.push({
                id: `default_133_${Date.now()}`,
                account_code: vatInputAccount?.account_code || "133",
                account_name:
                    vatInputAccount?.name || "Thuế GTGT được khấu trừ",
                debit: vatAmount,
                credit: 0,
            });

            entries.push({
                id: `default_payable_${Date.now()}`,
                account_code:
                    cashOrPayableAccount?.account_code || defaultAccountCode,
                account_name: cashOrPayableAccount?.name || defaultAccountName,
                debit: 0,
                credit: originalGrandTotal,
            });

            if (discountAmount > 0) {
                entries.push({
                    id: `default_payable_discount_${Date.now()}`,
                    account_code:
                        cashOrPayableAccount?.account_code ||
                        defaultAccountCode,
                    account_name:
                        cashOrPayableAccount?.name || defaultAccountName,
                    debit: discountAmount,
                    credit: 0,
                });

                entries.push({
                    id: `default_156_discount_${Date.now()}`,
                    account_code: inventoryAccount?.account_code || "156",
                    account_name: inventoryAccount?.name || "Hàng hóa",
                    debit: 0,
                    credit: discountExcludingVat,
                });

                if (vatOnDiscount > 0) {
                    entries.push({
                        id: `default_133_discount_${Date.now()}`,
                        account_code: vatInputAccount?.account_code || "133",
                        account_name:
                            vatInputAccount?.name || "Thuế GTGT được khấu trừ",
                        debit: 0,
                        credit: vatOnDiscount,
                    });
                }
            }
        }

        return entries;
    }, [calculationData, findAccount, type, formData?.payment_method]);

    // ✅ Init entries từ server hoặc default - CHỈ LẦN ĐẦU khi có accountingAccounts
    useEffect(() => {
        // Chưa sẵn sàng
        if (accountingAccounts.length === 0) return;
        if (hasInitializedRef.current) return; // ✅ Chỉ init 1 lần

        console.log("[AccountingTabs] Initializing entries...", {
            hasJournalEntries:
                formData?.journal_entries &&
                formData.journal_entries.length > 0,
            hasProducts:
                formData?.product_variants &&
                formData.product_variants.length > 0,
        });

        // ✅ Nếu có journal_entries từ server → ưu tiên dùng
        if (formData?.journal_entries && formData.journal_entries.length > 0) {
            const mappedEntries = formData.journal_entries.map(
                (detail, index) => ({
                    id: `server_${index}_${String(detail.account_code)}`,
                    account_code: String(detail.account_code),
                    account_name: getAccountName(detail.account_code),
                    debit: parseFloat(detail.debit) || 0,
                    credit: parseFloat(detail.credit) || 0,
                }),
            );

            console.log("[AccountingTabs] Init from server:", mappedEntries);
            setEntries(mappedEntries);
            initSourceRef.current = "server";
            prevPaymentMethod.current = formData?.payment_method;
            prevAmount.current = formData?.amount;
            hasInitializedRef.current = true;
            return;
        }

        // ✅ Tạo default entries nếu có sản phẩm
        const defaultEntries = createDefaultJournalEntries();
        if (defaultEntries.length > 0) {
            console.log(
                "[AccountingTabs] Init default entries:",
                defaultEntries,
            );
            setEntries(defaultEntries);
            initSourceRef.current = "default";
            prevPaymentMethod.current = formData?.payment_method;
            prevAmount.current = formData?.amount;
            hasInitializedRef.current = true;
        }
    }, [
        accountingAccounts.length,
        formData?.journal_entries,
        createDefaultJournalEntries,
        getAccountName,
    ]); // ✅ Dependencies chỉ những gì cần thiết

    // Cập nhật tài khoản tiền khi payment_method thay đổi (sau khi đã init)
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (entries.length === 0) return;
        if (prevPaymentMethod.current === formData?.payment_method) return;

        const isCashPayment =
            formData?.payment_method === "cash" ||
            formData?.payment_method === "bank";
        const cashAccountCode = isCashPayment
            ? formData?.payment_method === "bank"
                ? "112"
                : "111"
            : type === "sale"
              ? "131"
              : "331";

        setEntries((prev) =>
            prev.map((entry) => {
                if (["111", "112", "131", "331"].includes(entry.account_code)) {
                    return {
                        ...entry,
                        account_code: String(cashAccountCode),
                        account_name: getAccountName(cashAccountCode),
                    };
                }
                return entry;
            }),
        );

        prevPaymentMethod.current = formData?.payment_method;
    }, [formData?.payment_method, getAccountName, type]);

    // Cập nh��t số tiền khi amount thay đổi (chỉ với default entries)
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (entries.length === 0) return;
        if (prevAmount.current === formData?.amount) return;
        if (initSourceRef.current !== "default") return;

        const { totalAmount, vatAmount, originalGrandTotal, discountAmount } =
            calculationData;

        setEntries((prev) =>
            prev.map((entry) => {
                if (type === "sale") {
                    if (["111", "112", "131"].includes(entry.account_code)) {
                        return { ...entry, debit: originalGrandTotal };
                    } else if (entry.account_code === "511") {
                        return { ...entry, credit: totalAmount };
                    } else if (entry.account_code === "3331") {
                        return { ...entry, credit: vatAmount };
                    } else if (
                        entry.account_code === "521" &&
                        discountAmount > 0
                    ) {
                        const discountExcludingVat =
                            discountAmount /
                            (1 + (vatAmount / totalAmount || 0.1));
                        return { ...entry, debit: discountExcludingVat };
                    }
                } else if (type === "purchase") {
                    if (["111", "112", "331"].includes(entry.account_code)) {
                        return { ...entry, credit: originalGrandTotal };
                    } else if (entry.account_code === "156") {
                        return { ...entry, debit: totalAmount };
                    } else if (entry.account_code === "133") {
                        return { ...entry, debit: vatAmount };
                    }
                }
                return entry;
            }),
        );

        prevAmount.current = formData?.amount;
    }, [formData?.amount, calculationData, type]);

    // Notify parent khi entries thay đổi
    useEffect(() => {
        if (!initSourceRef.current) return;
        if (!onJournalEntriesChange) return;

        const formatted = entries.map((entry) => ({
            account_code: entry.account_code,
            debit: parseFloat(entry.debit) || 0,
            credit: parseFloat(entry.credit) || 0,
        }));
        onJournalEntriesChange(formatted);
    }, [entries, onJournalEntriesChange]);

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

    const totalDebitJournal = entries.reduce(
        (sum, e) => sum + (e.debit || 0),
        0,
    );
    const totalCreditJournal = entries.reduce(
        (sum, e) => sum + (e.credit || 0),
        0,
    );
    const isBalanced = Math.abs(totalDebitJournal - totalCreditJournal) < 0.01;

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
                            {entries.length > 0 && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-1">
                                    {entries.length}
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

                            {entries.length > 0 && (
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

                        {entries.length > 0 ? (
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
                                        {entries.map((entry, index) => (
                                            <tr
                                                key={entry.id}
                                                className="hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200"
                                            >
                                                <td className="py-2 px-4">
                                                    <SelectCombobox
                                                        value={String(
                                                            entry.account_code ||
                                                                "",
                                                        )}
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
                                                        step="0.01"
                                                        min="0"
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
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                    {entries.length > 1 && (
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
                                        {addingRows?.length > 0 ||
                                        (formData?.product_variants || [])
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

                        {!isBalanced && entries.length > 0 && (
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
                    <div className="py-8 text-center text-slate-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">Thông tin công nợ</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Đang phát triển...
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}