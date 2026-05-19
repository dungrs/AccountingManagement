import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { router } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJournalEntries(note) {
    if (!note?.journal_entries?.length) return [];
    // Nếu journal_entries đã là array của details thì trả về luôn
    if (note.journal_entries[0]?.account_code) {
        return note.journal_entries.map((entry) => ({
            account_code: String(entry.account_code ?? ""),
            debit: parseFloat(entry.debit) || 0,
            credit: parseFloat(entry.credit) || 0,
        }));
    }

    const firstJournal = note.journal_entries[0];
    if (!firstJournal?.details || !Array.isArray(firstJournal.details))
        return [];
    return firstJournal.details.map((detail) => ({
        account_code: String(detail.account_code ?? ""),
        debit: parseFloat(detail.debit) || 0,
        credit: parseFloat(detail.credit) || 0,
    }));
}

function buildInitialFormData(note) {
    if (!note) {
        return {
            code: "",
            issue_date: "",
            created_by: "",
            reason: "",
            note: "",
            status: "draft",
            type: "other",
            customer_id: "",
            supplier_id: "",
            amount: "",
            vat_rate: 0,
            vat_amount: 0,
            total_amount: 0,
            reference_type: "",
            reference_id: null,
            party_info: null,
            party_type: null,
            journal_entries: [],
        };
    }

    const customerId = note.customer_id ? note.customer_id : "";
    const supplierId = note.supplier_id ? note.supplier_id : "";
    const partyType = customerId ? "customer" : supplierId ? "supplier" : null;
    const partyInfo =
        partyType === "customer"
            ? (note.customer_info ?? note.customer ?? null)
            : partyType === "supplier"
              ? (note.supplier_info ?? note.supplier ?? null)
              : null;

    return {
        code: note.code ?? "",
        issue_date: note.issue_date ?? "",
        created_by: note.created_by ?? "",
        reason: note.reason ?? "",
        note: note.note ?? "",
        status: note.status ?? "draft",
        type: note.type ?? "other",
        customer_id: customerId,
        supplier_id: supplierId,
        amount: note.amount ?? "",
        vat_rate: note.vat_rate ?? 0,
        vat_amount: note.vat_amount ?? 0,
        total_amount: note.total_amount ?? 0,
        reference_type: note.reference_type ?? "",
        reference_id: note.reference_id ?? null,
        party_info: partyInfo,
        party_type: partyType,
        journal_entries: parseJournalEntries(note),
    };
}

function validateJournalEntries(entries) {
    const errs = [];

    if (!entries.length) {
        errs.push("Chưa có bút toán kế toán nào.");
        return errs;
    }

    entries.forEach((entry, idx) => {
        const line = `Dòng ${idx + 1}`;
        if (!entry.account_code?.trim()) {
            errs.push(`${line}: Thiếu mã tài khoản.`);
        }
        if (entry.debit < 0 || entry.credit < 0) {
            errs.push(`${line}: Giá trị nợ/có không được âm.`);
        }
        if (entry.debit === 0 && entry.credit === 0) {
            errs.push(`${line}: Nợ và Có không được đồng thời bằng 0.`);
        }
        if (entry.debit > 0 && entry.credit > 0) {
            errs.push(`${line}: Một dòng không được có cả Nợ lẫn Có.`);
        }
    });

    const totalDebit = entries.reduce(
        (s, e) => s + (parseFloat(e.debit) || 0),
        0,
    );
    const totalCredit = entries.reduce(
        (s, e) => s + (parseFloat(e.credit) || 0),
        0,
    );
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errs.push(
            `Tổng Nợ (${totalDebit.toLocaleString("vi-VN")}) ≠ Tổng Có (${totalCredit.toLocaleString("vi-VN")})`,
        );
    }

    return errs;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDebitNoteForm({ note, isEdit = false }) {
    const { emit } = useEventBus();
    const initializedNoteIdRef = useRef(null);
    const isUpdatingFromAmountRef = useRef(false);
    const amountUpdateTimerRef = useRef(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(() => buildInitialFormData(note));
    const [issueDate, setIssueDate] = useState(() =>
        note?.issue_date ? new Date(note.issue_date) : null,
    );
    const [openIssueDate, setOpenIssueDate] = useState(false);

    // ── Re-init khi note thay đổi ──
    useEffect(() => {
        if (!note) return;
        if (initializedNoteIdRef.current === note.id) return;

        initializedNoteIdRef.current = note.id;
        setFormData(buildInitialFormData(note));
        setIssueDate(note.issue_date ? new Date(note.issue_date) : null);
        setErrors({});
    }, [note]);

    // ── Đồng bộ issueDate → formData.issue_date ──
    useEffect(() => {
        if (!issueDate) return;
        const formatted = format(issueDate, "yyyy-MM-dd");
        setFormData((prev) => {
            if (prev.issue_date === formatted) return prev;
            return { ...prev, issue_date: formatted };
        });
    }, [issueDate]);

    // ── Tự động tính toán VAT và Total Amount với debounce ──
    useEffect(() => {
        if (isUpdatingFromAmountRef.current) return;

        // Clear timeout cũ
        if (amountUpdateTimerRef.current) {
            clearTimeout(amountUpdateTimerRef.current);
        }

        amountUpdateTimerRef.current = setTimeout(() => {
            const amount = parseFloat(formData.amount) || 0;
            const vatRate = parseFloat(formData.vat_rate) || 0;
            const vatAmount = amount * (vatRate / 100);
            const totalAmount = amount + vatAmount;

            isUpdatingFromAmountRef.current = true;
            setFormData((prev) => {
                // Chỉ cập nhật nếu giá trị thay đổi
                if (
                    prev.vat_amount === vatAmount &&
                    prev.total_amount === totalAmount
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    vat_amount: vatAmount,
                    total_amount: totalAmount,
                };
            });

            setTimeout(() => {
                isUpdatingFromAmountRef.current = false;
            }, 50);
        }, 300);

        return () => {
            if (amountUpdateTimerRef.current) {
                clearTimeout(amountUpdateTimerRef.current);
            }
        };
    }, [formData.amount, formData.vat_rate]);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const handleJournalEntriesChange = useCallback((newEntries) => {
        setFormData((prev) => {
            // So sánh sâu để tránh update không cần thiết
            if (
                prev.journal_entries.length === newEntries.length &&
                JSON.stringify(prev.journal_entries) ===
                    JSON.stringify(newEntries)
            ) {
                return prev;
            }
            return { ...prev, journal_entries: newEntries };
        });
    }, []);

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(
        (e, submitRoute, submitMethod = "post") => {
            e.preventDefault();
            if (isSubmitting) return;

            if (!formData.customer_id && !formData.supplier_id) {
                emit(
                    "toast:error",
                    "Vui lòng chọn khách hàng hoặc nhà cung cấp!",
                );
                return;
            }

            const journalErrors = validateJournalEntries(
                formData.journal_entries,
            );
            if (journalErrors.length > 0) {
                emit("toast:error", journalErrors[0]);
                setErrors((prev) => ({
                    ...prev,
                    journal_entries: journalErrors,
                }));
                return;
            }

            setErrors({});
            setIsSubmitting(true);

            const submitData = {
                code: formData.code,
                issue_date: formData.issue_date,
                reason: formData.reason,
                note: formData.note,
                status: formData.status,
                type: formData.type,
                user_id: formData.created_by,
                amount: parseFloat(formData.amount) || 0,
                vat_rate: parseFloat(formData.vat_rate) || 0,
                vat_amount: parseFloat(formData.vat_amount) || 0,
                total_amount: parseFloat(formData.total_amount) || 0,
                reference_type: formData.reference_type,
                reference_id: formData.reference_id,
                journal_entries: formData.journal_entries.map((entry) => ({
                    account_code: entry.account_code,
                    debit: parseFloat(entry.debit) || 0,
                    credit: parseFloat(entry.credit) || 0,
                })),
            };

            if (formData.customer_id)
                submitData.customer_id = formData.customer_id;
            if (formData.supplier_id)
                submitData.supplier_id = formData.supplier_id;

            router[submitMethod](submitRoute, submitData, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setErrors({});
                    emit(
                        "toast:success",
                        isEdit ? "Cập nhật thành công!" : "Tạo mới thành công!",
                    );
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                },
                onFinish: () => setIsSubmitting(false),
            });
        },
        [formData, isSubmitting, emit, isEdit],
    );

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        isSubmitting,
        issueDate,
        setIssueDate,
        openIssueDate,
        setOpenIssueDate,
        handleChange,
        handleSubmit,
        handleJournalEntriesChange,
    };
}