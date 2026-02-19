import { useState, useEffect, useCallback } from "react";
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
    const [isInitialized, setIsInitialized] = useState(false);
    const [journalEntriesFromTab, setJournalEntriesFromTab] = useState([]);

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
    });

    const [receiptDate, setReceiptDate] = useState(null);
    const [openReceiptDate, setOpenReceiptDate] = useState(false);
    const [addingRows, setAddingRows] = useState([]);
    const [editingIndexes, setEditingIndexes] = useState([]);

    // ─── Init form khi edit ───────────────────────────────────────────────────
    useEffect(() => {
        if (receipt && !isInitialized) {
            setFormData({
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
                journal_entries: receipt.journal_entries || [],
                price_list_id: receipt.price_list_id || null,
                price_list_info: null, // sẽ được load bên dưới
            });

            if (receipt.receipt_date) {
                setReceiptDate(new Date(receipt.receipt_date));
            }

            // ✅ FIX 2: Nếu receipt có price_list_id → gọi getDetails để load lại bảng giá
            // (cần thiết để auto-fill giá khi user chỉnh sửa sản phẩm trong edit mode)
            if (receipt.price_list_id) {
                axios
                    .post(
                        route(
                            "admin.price.list.getDetails",
                            receipt.price_list_id,
                        ),
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
                            "[useReceiptForm] Không thể load bảng giá khi edit:",
                            err,
                        );
                    });
            }

            setIsInitialized(true);
        }
    }, [receipt, isInitialized, defaultVatTax]);

    // ─── Sync receipt_date khi chọn calendar ─────────────────────────────────
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

    const handleJournalEntriesChange = useCallback((entries) => {
        setJournalEntriesFromTab(entries);
    }, []);

    // ─── Submit ───────────────────────────────────────────────────────────────
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

        setErrors({});
        setIsSubmitting(true);

        const submitData = {
            code: formData.code,
            receipt_date: formData.receipt_date,
            note: formData.note,
            journal_note: formData.journal_note,
            status: formData.status,
            user_id: formData.user_id,
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

        // ─── Journal entries ──────────────────────────────────────────────────
        // ✅ FIX 3: Ưu tiên entries từ AccountingTabs (user có thể đã chỉnh),
        //           fallback tự tính nếu chưa có
        if (journalEntriesFromTab.length > 0) {
            submitData.journal_entries = journalEntriesFromTab.map((entry) => ({
                account_code: entry.account_code,
                debit: entry.debit || 0,
                credit: entry.credit || 0,
            }));
        } else {
            const totalAmount = formData.product_variants.reduce(
                (sum, item) =>
                    sum +
                    parseFloat(item.quantity || 0) *
                        parseFloat(item.price || 0),
                0,
            );
            const vatAmount = formData.product_variants.reduce(
                (sum, item) => sum + parseFloat(item.vat_amount || 0),
                0,
            );
            const grandTotal = totalAmount + vatAmount;

            // Tính tổng giá vốn (cost) từ các sản phẩm nếu có
            const totalCost = formData.product_variants.reduce(
                (sum, item) => sum + parseFloat(item.cost_amount || 0),
                0,
            );

            if (type === "purchase") {
                submitData.journal_entries = [
                    { account_code: "156", debit: totalAmount, credit: 0 },
                    { account_code: "1331", debit: vatAmount, credit: 0 },
                    { account_code: "331", debit: 0, credit: grandTotal },
                ];
            } else if (type === "sale") {
                submitData.journal_entries = [
                    { account_code: "131", debit: grandTotal, credit: 0 },
                    { account_code: "5111", debit: 0, credit: totalAmount },
                    { account_code: "3331", debit: 0, credit: vatAmount },
                    // ✅ FIX 3: 2 bút toán giá vốn hàng bán (chỉ thêm nếu có cost)
                    ...(totalCost > 0
                        ? [
                              {
                                  account_code: "632",
                                  debit: totalCost,
                                  credit: 0,
                              },
                              {
                                  account_code: "156",
                                  debit: 0,
                                  credit: totalCost,
                              },
                          ]
                        : []),
                ];
            }
        }

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setErrors({}),
            onError: (errors) => {
                setErrors(errors);
                if (Object.keys(errors).length > 0) {
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                }
            },
            onFinish: () => setIsSubmitting(false),
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