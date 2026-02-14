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
        note: "",
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
                note: receipt.note || "",
                status: receipt.status || "draft",
                product_variants: receipt.product_variants?.map((pv) => ({
                    product_variant_id: pv.product_variant_id,
                    name: pv.name,
                    sku: pv.sku,
                    unit: pv.unit,
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

        if (formData.product_variants.length === 0) {
            emit("toast:error", "Vui lòng thêm ít nhất một sản phẩm!");
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const submitData = {
            code: formData.code,
            receipt_date: formData.receipt_date,
            note: formData.note,
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