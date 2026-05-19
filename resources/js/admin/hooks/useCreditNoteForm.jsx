import { useState, useEffect, useCallback, useRef } from "react";
import { router } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJournalEntries(note) {
    if (!note?.journal_entries?.length) return [];
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
        total_amount: note.total_amount ?? note.amount ?? 0,
        reference_type: note.reference_type ?? "",
        reference_id: note.reference_id ?? null,
        party_info: partyInfo,
        party_type: partyType,
        journal_entries: parseJournalEntries(note),
    };
}

// ─── Validate ────────────────────────────────────────────────────────────────

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

export function useCreditNoteForm({ note, isEdit = false }) {
    const { emit } = useEventBus();
    
    const initializedNoteIdRef = useRef(null);
    const isUpdatingFromAmountRef = useRef(false);
    const isAutoGeneratingRef = useRef(false); // Thêm ref để tránh loop
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(() => buildInitialFormData(note));
    const [issueDate, setIssueDate] = useState(() =>
        note?.issue_date ? new Date(note.issue_date) : null,
    );
    const [openIssueDate, setOpenIssueDate] = useState(false);

    // Re-init khi note thay đổi
    useEffect(() => {
        if (!note) return;
        if (initializedNoteIdRef.current === note.id) return;

        initializedNoteIdRef.current = note.id;
        setFormData(buildInitialFormData(note));
        setIssueDate(note.issue_date ? new Date(note.issue_date) : null);
        setErrors({});
    }, [note]);

    // Đồng bộ issueDate → formData.issue_date
    useEffect(() => {
        if (!issueDate) return;
        const formatted = format(issueDate, "yyyy-MM-dd");
        setFormData((prev) => {
            if (prev.issue_date === formatted) return prev;
            return { ...prev, issue_date: formatted };
        });
    }, [issueDate]);

    // TỰ ĐỘNG TẠO BÚT TOÁN KHI SỐ TIỀN THAY ĐỔI
    useEffect(() => {
        // Không chạy nếu đang trong quá trình auto-generate hoặc update từ amount
        if (isAutoGeneratingRef.current || isUpdatingFromAmountRef.current) return;
        
        const amount = parseFloat(formData.amount) || 0;
        
        // Chỉ tạo bút toán tự động nếu:
        // 1. Có số tiền > 0
        // 2. Chưa có bút toán nào được nhập thủ công
        // 3. Đang ở chế độ tạo mới (không phải edit)
        if (amount > 0 && !isEdit && formData.journal_entries.length === 0) {
            isAutoGeneratingRef.current = true;
            
            // Tạo bút toán tự động mặc định
            const defaultJournalEntries = [
                {
                    account_code: "112", // Tiền gửi ngân hàng (mặc định)
                    debit: amount,
                    credit: 0,
                },
                {
                    account_code: "511", // Doanh thu (mặc định)
                    debit: 0,
                    credit: amount,
                },
            ];
            
            setFormData((prev) => ({
                ...prev,
                journal_entries: defaultJournalEntries,
            }));
            
            isAutoGeneratingRef.current = false;
        }
        
        // Tự động cập nhật total_amount
        if (!isUpdatingFromAmountRef.current) {
            isUpdatingFromAmountRef.current = true;
            setFormData((prev) => ({
                ...prev,
                total_amount: amount,
            }));
            isUpdatingFromAmountRef.current = false;
        }
    }, [formData.amount, isEdit, formData.journal_entries.length]);

    // Tách riêng effect để cập nhật total_amount
    useEffect(() => {
        if (isUpdatingFromAmountRef.current) return;
        
        const amount = parseFloat(formData.amount) || 0;
        isUpdatingFromAmountRef.current = true;
        setFormData((prev) => ({
            ...prev,
            total_amount: amount,
        }));
        isUpdatingFromAmountRef.current = false;
    }, [formData.amount]);

    // Handlers
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
        // Reset auto-generate flag khi người dùng tự sửa bút toán
        isAutoGeneratingRef.current = true;
        setFormData((prev) => {
            if (
                prev.journal_entries.length === newEntries.length &&
                JSON.stringify(prev.journal_entries) ===
                    JSON.stringify(newEntries)
            ) {
                return prev;
            }
            return { ...prev, journal_entries: newEntries };
        });
        // Reset flag sau khi cập nhật
        setTimeout(() => {
            isAutoGeneratingRef.current = false;
        }, 100);
    }, []);

    // Submit handler
    const handleSubmit = useCallback(
        (e, submitRoute, submitMethod = "post") => {
            e.preventDefault();
            if (isSubmitting) return;

            // Validate đối tượng
            if (!formData.customer_id && !formData.supplier_id) {
                emit(
                    "toast:error",
                    "Vui lòng chọn khách hàng hoặc nhà cung cấp!",
                );
                return;
            }

            // Validate journal entries
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
                onSuccess: () => setErrors({}),
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                },
                onFinish: () => setIsSubmitting(false),
            });
        },
        [formData, isSubmitting, emit],
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