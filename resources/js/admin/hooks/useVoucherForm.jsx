import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";

export function useVoucherForm({ 
    voucher, 
    isEdit = false,
    type = "payment" // "payment" | "receipt"
}) {
    const { emit } = useEventBus();
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Khởi tạo formData
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
        journal_entries: [], // Giữ để người dùng có thể chỉnh sửa
    });

    const [voucherDate, setVoucherDate] = useState(null);
    const [openVoucherDate, setOpenVoucherDate] = useState(false);

    // Load data từ server khi edit
    useEffect(() => {
        if (voucher && !isInitialized) {
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

            let bankCode = null;
            if (voucher.bank_account_id && partnerInfo?.banks) {
                const selectedBank = partnerInfo.banks.find(
                    bank => bank.id === voucher.bank_account_id
                );
                bankCode = selectedBank?.bank_code || selectedBank?.short_name || null;
            }

            setFormData({
                code: voucher.code || "",
                user_id: voucher.user_id || "",
                voucher_date: voucher.voucher_date || voucher.receipt_date || "",
                note: voucher.note || "",
                status: voucher.status || "draft",
                partner_id: partnerId,
                partner_code: partnerCode,
                amount: voucher.amount || "",
                payment_method: voucher.payment_method || "cash",
                bank_account_id: voucher.bank_account_id || null,
                bank_code: bankCode,
                partner_info: partnerInfo,
                journal_entries: voucher.journal_entries || [],
            });

            const dateStr = voucher.voucher_date || voucher.receipt_date;
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

    // Cập nhật journal entries khi amount hoặc payment_method thay đổi
    useEffect(() => {
        if (!isEdit && formData.amount) {
            updateDefaultJournalEntries();
        }
    }, [formData.amount, formData.payment_method, type, isEdit]);

    const updateDefaultJournalEntries = () => {
        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) return;

        const cashAccount = formData.payment_method === 'bank' ? '112' : '111';
        
        let defaultEntries = [];
        if (type === "payment") {
            // Phiếu chi: Nợ 331 / Có (111 hoặc 112)
            defaultEntries = [
                { account_code: "331", debit: amount, credit: 0 },
                { account_code: cashAccount, debit: 0, credit: amount },
            ];
        } else {
            // Phiếu thu: Nợ (111 hoặc 112) / Có 131
            defaultEntries = [
                { account_code: cashAccount, debit: amount, credit: 0 },
                { account_code: "131", debit: 0, credit: amount },
            ];
        }

        setFormData(prev => ({
            ...prev,
            journal_entries: defaultEntries
        }));
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
        
        // Cập nhật bank_code khi thay đổi bank_account_id
        if (field === "bank_account_id" && value && formData.partner_info?.banks) {
            const selectedBank = formData.partner_info.banks.find(
                bank => bank.id === parseInt(value)
            );
            if (selectedBank) {
                setFormData((prev) => ({
                    ...prev,
                    bank_code: selectedBank.bank_code || selectedBank.short_name || null
                }));
            }
        }
        
        if (field === "bank_account_id" && !value) {
            setFormData((prev) => ({
                ...prev,
                bank_code: null
            }));
        }
    };

    const handleJournalEntriesChange = (newEntries) => {
        setFormData(prev => ({
            ...prev,
            journal_entries: newEntries
        }));
    };

    const handleSubmit = (e, submitRoute, submitMethod = "post") => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validate cân đối kế toán
        const totalDebit = formData.journal_entries.reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
        const totalCredit = formData.journal_entries.reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            emit("toast:error", "Tổng nợ và tổng có phải bằng nhau!");
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        // Chuẩn bị data submit
        const submitData = {
            code: formData.code,
            voucher_date: formData.voucher_date,
            note: formData.note,
            status: formData.status,
            user_id: formData.user_id,
            amount: formData.amount,
            payment_method: formData.payment_method,
            bank_account_id: formData.bank_account_id,
            bank_code: formData.bank_code,
            journal_entries: formData.journal_entries,
        };

        // Thêm partner_id và partner_code theo type
        if (type === "payment") {
            submitData.supplier_id = formData.partner_id;
            submitData.supplier_code = formData.partner_code;
        } else {
            submitData.customer_id = formData.partner_id;
            submitData.customer_code = formData.partner_code;
        }

        console.log("Submit data:", submitData);

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