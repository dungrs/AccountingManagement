import { useState, useEffect, useCallback } from "react";
import { router } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";

export function useVoucherForm({ voucher, isEdit = false, type = "payment" }) {
    const { emit } = useEventBus();

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        voucher_date: "",
        user_id: "",
        note: "",
        status: "draft",
        partner_id: "",
        partner_code: "",
        amount: "",
        payment_method: "cash",
        bank_account_id: null,
        bank_code: null,
        partner_info: null,
        journal_entries: [],
    });

    const [voucherDate, setVoucherDate] = useState(null);
    const [openVoucherDate, setOpenVoucherDate] = useState(false);

    // Load data từ server khi edit
    useEffect(() => {
        if (voucher && !isInitialized) {
            console.log("Loading voucher data:", voucher);

            let partnerId = "";
            let partnerCode = "";
            let partnerInfo = null;

            if (type === "payment") {
                partnerId = voucher.supplier_id || "";
                partnerCode = voucher.supplier_code || "";
                partnerInfo = voucher.supplier_info || null;
            } else {
                partnerId = voucher.customer_id || "";
                partnerCode = voucher.customer_code || "";
                partnerInfo = voucher.customer_info || null;
            }

            // ✅ Xử lý journal entries từ cấu trúc: journal_entries[0].details
            let journalEntries = [];
            if (voucher.journal_entries && voucher.journal_entries.length > 0) {
                const firstJournal = voucher.journal_entries[0];
                console.log("First journal:", firstJournal);

                if (
                    firstJournal?.details &&
                    Array.isArray(firstJournal.details)
                ) {
                    journalEntries = firstJournal.details.map((detail) => ({
                        // ✅ Ép kiểu string để match với accountOptions trong SelectCombobox
                        account_code: String(detail.account_code),
                        debit: parseFloat(detail.debit) || 0,
                        credit: parseFloat(detail.credit) || 0,
                    }));
                    console.log("Mapped journal entries:", journalEntries);
                }
            }

            const newFormData = {
                code: voucher.code || "",
                user_id: voucher.user_id || "",
                voucher_date: voucher.voucher_date || "",
                note: voucher.note || "",
                status: voucher.status || "draft",
                partner_id: partnerId,
                partner_code: partnerCode,
                amount: voucher.amount || "",
                payment_method: voucher.payment_method || "cash",
                partner_info: partnerInfo,
                bank_account_id: voucher.bank_account_id || null,
                journal_entries: journalEntries,
            };

            console.log("Setting formData:", newFormData);
            setFormData(newFormData);

            const dateStr = voucher.voucher_date;
            if (dateStr) {
                setVoucherDate(new Date(dateStr));
            }

            setIsInitialized(true);
        }
    }, [voucher, isInitialized, type]);

    // Sync date with formData
    useEffect(() => {
        if (voucherDate) {
            setFormData((prev) => ({
                ...prev,
                voucher_date: format(voucherDate, "yyyy-MM-dd"),
            }));
        }
    }, [voucherDate]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));

        if (
            field === "bank_account_id" &&
            value &&
            formData.partner_info?.banks
        ) {
            const selectedBank = formData.partner_info.banks.find(
                (bank) => bank.id === parseInt(value),
            );
            if (selectedBank) {
                setFormData((prev) => ({
                    ...prev,
                    bank_code:
                        selectedBank.bank_code ||
                        selectedBank.short_name ||
                        null,
                }));
            }
        }

        if (field === "bank_account_id" && !value) {
            setFormData((prev) => ({
                ...prev,
                bank_code: null,
            }));
        }
    };

    const handleJournalEntriesChange = useCallback((newEntries) => {
        console.log("Journal entries changed:", newEntries);
        setFormData((prev) => {
            const isDifferent =
                JSON.stringify(prev.journal_entries) !==
                JSON.stringify(newEntries);

            if (!isDifferent) {
                return prev;
            }

            return {
                ...prev,
                journal_entries: newEntries,
            };
        });
    }, []);

    const handleSubmit = (e, submitRoute, submitMethod = "post") => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validate cân đối kế toán
        const totalDebit = formData.journal_entries.reduce(
            (sum, entry) => sum + (parseFloat(entry.debit) || 0),
            0,
        );
        const totalCredit = formData.journal_entries.reduce(
            (sum, entry) => sum + (parseFloat(entry.credit) || 0),
            0,
        );

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            emit("toast:error", "Tổng nợ và tổng có phải bằng nhau!");
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const submitData = {
            code: formData.code,
            voucher_date: formData.voucher_date,
            note: formData.note,
            status: formData.status,
            user_id: formData.user_id,
            amount: formData.amount,
            payment_method: formData.payment_method,
            journal_entries: formData.journal_entries.map((entry) => ({
                account_code: entry.account_code,
                debit: parseFloat(entry.debit) || 0,
                credit: parseFloat(entry.credit) || 0,
            })),
        };

        if (type === "payment") {
            submitData.supplier_id = formData.partner_id;
        } else {
            submitData.customer_id = formData.partner_id;
        }

        console.log("Submitting data:", submitData);

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setErrors({});
            },
            onError: (errors) => {
                setErrors(errors);
                if (Object.keys(errors).length > 0) {
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                }
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        isSubmitting,
        voucherDate,
        setVoucherDate,
        openVoucherDate,
        setOpenVoucherDate,
        handleChange,
        handleSubmit,
        handleJournalEntriesChange,
    };
}