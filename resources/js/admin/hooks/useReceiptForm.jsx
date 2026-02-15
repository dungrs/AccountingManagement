import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";

export function useReceiptForm({ 
    receipt, 
    defaultVatTax,
    isEdit = false,
    type = "purchase" // "purchase" | "sale"
}) {
    const { emit } = useEventBus();
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        receipt_date: "",
        user_id: "",
        supplier_id: type === "purchase" ? "" : undefined,
        customer_id: type === "sale" ? "" : undefined,
        note: "", // Note của phiếu
        journal_note: "", // Note của bút toán (riêng biệt)
        status: "draft",
        product_variants: [],
    });

    const [receiptDate, setReceiptDate] = useState(null);
    const [openReceiptDate, setOpenReceiptDate] = useState(false);
    const [addingRows, setAddingRows] = useState([]);
    const [editingIndexes, setEditingIndexes] = useState([]);

    // Load data từ server khi edit
    useEffect(() => {
        if (receipt && !isInitialized) {
            setFormData({
                code: receipt.code || "",
                user_id: receipt.user_id || "",
                receipt_date: receipt.receipt_date || "",
                supplier_id: receipt.supplier_id || "",
                supplier_info: receipt.supplier_info || "",
                customer_id: receipt.customer_id || "",
                note: receipt.note || "", // Note của phiếu
                journal_note: receipt.journal_entries?.[0]?.note || "", // Lấy note từ journal entry đầu tiên
                status: receipt.status || "draft",
                product_variants: receipt.product_variants?.map((pv) => ({
                    product_variant_id: pv.product_variant_id,
                    name: pv.name,
                    sku: pv.sku,
                    quantity: pv.quantity || "",
                    price: pv.price || "",
                    vat_id: pv.vat_id || defaultVatTax?.id,
                    vat_amount: pv.vat_amount || "",
                    subtotal: pv.subtotal || "",
                })) || [],
            });

            if (receipt.receipt_date) {
                setReceiptDate(new Date(receipt.receipt_date));
            }

            setIsInitialized(true);
        }
    }, [receipt, isInitialized, defaultVatTax]);

    // Sync date with formData
    useEffect(() => {
        if (receiptDate) {
            setFormData((prev) => ({
                ...prev,
                receipt_date: format(receiptDate, "yyyy-MM-dd"),
            }));
        }
    }, [receiptDate]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleSubmit = (e, submitRoute, submitMethod = "post") => {
        e.preventDefault();
        if (isSubmitting) return;

        if (editingIndexes.length > 0) {
            emit("toast:error", "Vui lòng lưu hoặc hủy các thay đổi trước khi submit!");
            return;
        }

        if (addingRows.length > 0) {
            emit("toast:error", "Vui lòng lưu hoặc hủy các sản phẩm đang thêm!");
            return;
        }

        if (!formData.product_variants || formData.product_variants.length === 0) {
            emit("toast:error", "Vui lòng thêm ít nhất một sản phẩm!");
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const submitData = {
            code: formData.code,
            receipt_date: formData.receipt_date,
            note: formData.note, // Note của phiếu
            journal_note: formData.journal_note, // Note của bút toán (riêng biệt)
            status: formData.status,
            user_id: formData.user_id,
            product_variants: formData.product_variants.map((item) => ({
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
                price: item.price,
                vat_id: item.vat_id,
            })),
        };

        // Add supplier_id or customer_id based on type
        if (type === "purchase" && formData.supplier_id) {
            submitData.supplier_id = formData.supplier_id;
        } else if (type === "sale" && formData.customer_id) {
            submitData.customer_id = formData.customer_id;
        }

        // Gửi journal entries về server
        const totalAmount = formData.product_variants.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));
        }, 0);

        const vatAmount = formData.product_variants.reduce((sum, item) => {
            return sum + parseFloat(item.vat_amount || 0);
        }, 0);

        const grandTotal = totalAmount + vatAmount;

        // Tạo journal entries
        const journalEntries = [];
        
        if (type === "purchase") {
            journalEntries.push(
                { account_code: "156", debit: totalAmount, credit: 0 },
                { account_code: "1331", debit: vatAmount, credit: 0 },
                { account_code: "331", debit: 0, credit: grandTotal }
            );
        } else if (type === "sale") {
            journalEntries.push(
                { account_code: "131", debit: grandTotal, credit: 0 },
                { account_code: "5111", debit: 0, credit: totalAmount },
                { account_code: "3331", debit: 0, credit: vatAmount }
            );
        }

        submitData.journal_entries = journalEntries;

        // Log để debug - thấy rõ 2 loại note riêng biệt
        console.log("=== SUBMIT DATA ===");
        console.log("Note của phiếu:", submitData.note);
        console.log("Note của bút toán:", submitData.journal_note);
        console.log("Journal entries:", submitData.journal_entries);
        console.log("===================");

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setErrors({});
            },
            onError: (errors) => {
                setErrors(errors);
                console.log("Submit errors:", errors);
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
        receiptDate,
        setReceiptDate,
        openReceiptDate,
        setOpenReceiptDate,
        addingRows,
        setAddingRows,
        editingIndexes,
        setEditingIndexes,
        handleChange,
        handleSubmit,
    };
}