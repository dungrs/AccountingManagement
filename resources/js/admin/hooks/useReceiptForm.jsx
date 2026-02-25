import { useState, useEffect, useCallback, useRef } from "react";
import { router } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";
import axios from "axios";

export function useReceiptForm({
    receipt,
    defaultVatTax,
    isEdit = false,
    type = "purchase",
}) {
    const { emit } = useEventBus();

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Dùng ref để track journal entries
    const journalEntriesRef = useRef([]);
    const hasInitializedRef = useRef(false); // ✅ Flag để init chỉ 1 lần

    const [formData, setFormData] = useState({
        code: "",
        receipt_date: "",
        user_id: "",
        supplier_id: type === "purchase" ? "" : undefined,
        customer_id: type === "sale" ? "" : undefined,
        note: "",
        journal_note: "",
        status: "draft",
        product_variants: [],
        price_list_id: null,
        price_list_info: null,
        amount: "",
        payment_method: "cash",
        discount_type: null,
        discount_value: 0,
        discount_amount: 0,
        discount_total: 0,
        discount_note: "",
        journal_entries: [],
    });

    const [receiptDate, setReceiptDate] = useState(null);
    const [openReceiptDate, setOpenReceiptDate] = useState(false);
    const [addingRows, setAddingRows] = useState([]);
    const [editingIndexes, setEditingIndexes] = useState([]);

    // ✅ Tính amount - stable function
    const calculateAmount = useCallback((productVariants) => {
        return productVariants.reduce(
            (sum, item) =>
                sum +
                parseFloat(item.quantity || 0) * parseFloat(item.price || 0),
            0,
        );
    }, []);

    // Cập nhật amount khi product_variants thay đổi
    useEffect(() => {
        const totalAmount = calculateAmount(formData.product_variants);
        setFormData((prev) => ({
            ...prev,
            amount: totalAmount,
        }));
    }, [formData.product_variants, calculateAmount]);

    // ✅ Init form khi có receipt - CHỈ LẦN ĐẦU
    useEffect(() => {
        if (!receipt || hasInitializedRef.current) return;

        console.log("[useReceiptForm] Loading receipt data:", receipt);

        // Xử lý journal entries từ server
        let journalEntries = [];
        if (receipt.journal_entries && receipt.journal_entries.length > 0) {
            const firstJournal = receipt.journal_entries[0];
            if (firstJournal?.details && Array.isArray(firstJournal.details)) {
                journalEntries = firstJournal.details.map((detail) => ({
                    account_code: String(detail.account_code),
                    debit: parseFloat(detail.debit) || 0,
                    credit: parseFloat(detail.credit) || 0,
                }));
            }
        }

        const updatedFormData = {
            code: receipt.code || "",
            user_id: receipt.user_id || "",
            receipt_date: receipt.receipt_date || "",
            supplier_id: receipt.supplier_id || "",
            supplier_info: receipt.supplier_info || null,
            customer_id: receipt.customer_id || "",
            customer_info: receipt.customer_info || null,
            note: receipt.note || "",
            journal_note: receipt.journal_entries?.[0]?.note || "",
            status: receipt.status || "draft",
            product_variants:
                receipt.product_variants?.map((pv) => ({
                    product_variant_id: pv.product_variant_id,
                    name: pv.name || "",
                    sku: pv.sku || "",
                    quantity: pv.quantity || "",
                    price: pv.price || "",
                    list_price: pv.list_price || null,
                    vat_id: pv.vat_id || defaultVatTax?.id,
                    vat_amount: pv.vat_amount || "",
                    subtotal: pv.subtotal || "",
                    unit: pv.unit || null,
                    unit_name: pv.unit_name || "",
                })) || [],
            amount:
                receipt.amount ||
                calculateAmount(receipt.product_variants || []),
            payment_method: receipt.payment_method || "cash",
            journal_entries: journalEntries,
            price_list_id: receipt.price_list_id || null,
            price_list_info: null,
            discount_type: receipt.discount_type || null,
            discount_value: receipt.discount_value || 0,
            discount_amount: receipt.discount_amount || 0,
            discount_total: receipt.discount_total || 0,
            discount_note: receipt.discount_note || "",
        };

        setFormData(updatedFormData);
        journalEntriesRef.current = journalEntries;
        hasInitializedRef.current = true;

        if (receipt.receipt_date) {
            setReceiptDate(new Date(receipt.receipt_date));
        }

        // Load price list nếu có
        if (receipt.price_list_id) {
            axios
                .post(
                    route("admin.price.list.getDetails", receipt.price_list_id),
                )
                .then((response) => {
                    if (
                        response.data?.status === "success" &&
                        response.data?.data
                    ) {
                        const priceListData = response.data.data;
                        const variants = Array.isArray(
                            priceListData.product_variants,
                        )
                            ? priceListData.product_variants
                            : [];

                        setFormData((prev) => ({
                            ...prev,
                            price_list_info: {
                                id: priceListData.id,
                                name: priceListData.name,
                                start_date: priceListData.start_date,
                                end_date: priceListData.end_date,
                                product_variants: variants,
                            },
                        }));
                    }
                })
                .catch((err) => {
                    console.warn(
                        "[useReceiptForm] Không thể load bảng giá:",
                        err,
                    );
                });
        }
    }, [receipt]); // ✅ Chỉ depend vào receipt

    // Sync receipt_date
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

    // ✅ Cập nhật cả state và ref khi journal entries thay đổi
    const handleJournalEntriesChange = useCallback((entries) => {
        console.log("[useReceiptForm] Journal entries changed:", entries);
        setFormData((prev) => ({
            ...prev,
            journal_entries: entries,
        }));
        journalEntriesRef.current = entries;
    }, []);

    // Submit
    const handleSubmit = (e, submitRoute, submitMethod = "post") => {
        e.preventDefault();
        if (isSubmitting) return;

        if (editingIndexes.length > 0) {
            emit(
                "toast:error",
                "Vui lòng lưu hoặc hủy các thay đổi trước khi submit!",
            );
            return;
        }

        if (addingRows.length > 0) {
            emit(
                "toast:error",
                "Vui lòng lưu hoặc hủy các sản phẩm đang thêm!",
            );
            return;
        }

        if (
            !formData.product_variants ||
            formData.product_variants.length === 0
        ) {
            emit("toast:error", "Vui lòng thêm ít nhất một sản phẩm!");
            return;
        }

        // Validate cân đối kế toán
        const latestEntries = journalEntriesRef.current;
        if (latestEntries.length > 0) {
            const totalDebit = latestEntries.reduce(
                (sum, entry) => sum + (parseFloat(entry.debit) || 0),
                0,
            );
            const totalCredit = latestEntries.reduce(
                (sum, entry) => sum + (parseFloat(entry.credit) || 0),
                0,
            );

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                emit("toast:error", "Tổng nợ và tổng có phải bằng nhau!");
                return;
            }
        }

        setErrors({});
        setIsSubmitting(true);

        // Tính toán lại discount_amount
        let discountAmount = formData.discount_amount;
        if (formData.discount_type && formData.discount_value) {
            const totalAmount = calculateAmount(formData.product_variants);

            if (formData.discount_type === "percentage") {
                discountAmount = (totalAmount * formData.discount_value) / 100;
            } else if (formData.discount_type === "fixed") {
                discountAmount = formData.discount_value;
            }
        }

        const submitData = {
            code: formData.code,
            receipt_date: formData.receipt_date,
            note: formData.note,
            journal_note: formData.journal_note,
            status: formData.status,
            user_id: formData.user_id,
            amount: formData.amount,
            payment_method: formData.payment_method,
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            discount_amount: discountAmount,
            discount_total: discountAmount,
            discount_note: formData.discount_note,
            ...(formData.price_list_id && {
                price_list_id: formData.price_list_id,
            }),
            product_variants: formData.product_variants.map((item) => ({
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
                price: item.price,
                vat_id: item.vat_id,
                ...(item.list_price != null && { list_price: item.list_price }),
            })),
        };

        if (type === "purchase" && formData.supplier_id) {
            submitData.supplier_id = formData.supplier_id;
        } else if (type === "sale" && formData.customer_id) {
            submitData.customer_id = formData.customer_id;
        }

        // ✅ Lấy journal entries từ ref
        if (latestEntries.length > 0) {
            submitData.journal_entries = latestEntries
                .filter(
                    (entry) =>
                        entry.account_code && entry.account_code.trim() !== "",
                )
                .map((entry) => ({
                    account_code: entry.account_code,
                    debit: parseFloat(entry.debit) || 0,
                    credit: parseFloat(entry.credit) || 0,
                }));
        }

        console.log("[useReceiptForm] Submitting:", submitData);

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setErrors({});
                setIsSubmitting(false);
            },
            onError: (errors) => {
                setErrors(errors);
                if (Object.keys(errors).length > 0) {
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                }
                setIsSubmitting(false);
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
        handleJournalEntriesChange,
    };
}