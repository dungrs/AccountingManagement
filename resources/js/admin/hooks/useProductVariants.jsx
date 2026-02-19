import { useEventBus } from "@/EventBus";

export function useProductVariants({
    formData,
    setFormData,
    addingRows,
    setAddingRows,
    editingIndexes,
    setEditingIndexes,
    vatTaxes,
    receipt,
}) {
    const { emit } = useEventBus();

    const getVatTaxById = (taxId) => {
        return vatTaxes?.find((tax) => tax.id === taxId);
    };

    const getDefaultVatTax = () => {
        return (
            vatTaxes?.find((tax) => parseFloat(tax.rate) === 10) ||
            vatTaxes?.[0]
        );
    };

    const calculateAmounts = (quantity, price, vatId) => {
        const qty = parseFloat(quantity) || 0;
        const unitPrice = parseFloat(price) || 0;
        const subtotalBeforeVat = qty * unitPrice;

        const vatTax = getVatTaxById(vatId);
        const vatRate = vatTax ? parseFloat(vatTax.rate) : 0;
        const vatAmount = (subtotalBeforeVat * vatRate) / 100;
        const subtotal = subtotalBeforeVat + vatAmount;

        return { vatAmount, subtotal };
    };

    const calculateVatAndSubtotal = (quantity, price, vatRate) => {
        const qty = parseFloat(quantity) || 0;
        const pr = parseFloat(price) || 0;
        const subtotal = qty * pr;
        const vatAmount = subtotal * (parseFloat(vatRate) / 100);

        return { subtotal, vatAmount };
    };

    const handleUpdateAddingRow = (rowId, field, value) => {
        setAddingRows((prev) => {
            const updated = prev.map((row) => {
                if (row.id === rowId) {
                    const updatedRow = { ...row, [field]: value };

                    if (
                        field === "quantity" ||
                        field === "price" ||
                        field === "vat_id"
                    ) {
                        const vatTax = getVatTaxById(updatedRow.vat_id);
                        const vatRate = vatTax?.rate || 0;

                        const { subtotal, vatAmount } = calculateVatAndSubtotal(
                            updatedRow.quantity,
                            updatedRow.price,
                            vatRate,
                        );

                        updatedRow.subtotal = subtotal;
                        updatedRow.vat_amount = vatAmount;
                    }

                    return updatedRow;
                }
                return row;
            });
            return updated;
        });
    };

    const getUsedVariantIds = () => {
        const savedIds = formData.product_variants.map(
            (item) => item.product_variant_id,
        );

        const addingIds = addingRows
            .map((row) => row.product_variant_id)
            .filter((id) => id !== "" && id !== null && id !== undefined);

        return [...savedIds, ...addingIds];
    };

    const getAvailableProductVariantOptions = (
        productVariants,
        currentVariantId = null,
    ) => {
        const usedIds = getUsedVariantIds();

        return (
            productVariants
                ?.filter((pv) => {
                    // ✅ FIX: dùng product_variant_id thay vì id
                    const id = pv.product_variant_id;
                    if (
                        currentVariantId &&
                        Number(id) === Number(currentVariantId)
                    ) {
                        return true;
                    }
                    return !usedIds.includes(id);
                })
                .map((pv) => ({
                    value: pv.product_variant_id,
                    label: pv.name,
                    sku: pv.sku,
                })) || []
        );
    };

    const handleAddProductRow = () => {
        const defaultTax = getDefaultVatTax();
        const newRow = {
            id: Date.now(),
            product_variant_id: "",
            quantity: "",
            price: "",
            vat_id: defaultTax?.id || null,
            vat_amount: "",
            subtotal: "",
        };
        setAddingRows([...addingRows, newRow]);
    };

    const handleCancelAddRow = (rowId) => {
        setAddingRows(addingRows.filter((row) => row.id !== rowId));
    };

    const handleSaveRow = (rowId) => {
        const row = addingRows.find((r) => r.id === rowId);
        if (!row || !row.product_variant_id || !row.quantity || !row.price) {
            emit("toast:error", "Vui lòng điền đầy đủ thông tin sản phẩm!");
            return;
        }

        const isDuplicate = formData.product_variants.some(
            (item) =>
                item.product_variant_id === parseInt(row.product_variant_id),
        );

        if (isDuplicate) {
            emit("toast:error", "Sản phẩm này đã tồn tại trong phiếu!");
            return;
        }

        const newItem = {
            product_variant_id: parseInt(row.product_variant_id),
            quantity: parseFloat(row.quantity),
            price: parseFloat(row.price),
            vat_id: row.vat_id,
            vat_amount: parseFloat(row.vat_amount),
            subtotal: parseFloat(row.subtotal),
            name: row.name || null,
            sku: row.sku || null,
            unit: row.unit || null,
            unit_name: row.unit_name || null,
            list_price: row.list_price || null,
            cost_price: row.cost_price || null,
        };

        setFormData((prev) => ({
            ...prev,
            product_variants: [...prev.product_variants, newItem],
        }));

        setAddingRows(addingRows.filter((r) => r.id !== rowId));
    };

    const handleEditItem = (index) => {
        setEditingIndexes([...editingIndexes, index]);
    };

    const handleCancelEditItem = (index) => {
        setEditingIndexes(editingIndexes.filter((i) => i !== index));

        if (receipt?.product_variants?.[index]) {
            const originalItem = receipt.product_variants[index];
            setFormData((prev) => ({
                ...prev,
                product_variants: prev.product_variants.map((item, i) =>
                    i === index
                        ? {
                              product_variant_id:
                                  originalItem.product_variant_id,
                              quantity: originalItem.quantity,
                              price: originalItem.price,
                              vat_id: originalItem.vat_id,
                              vat_amount: originalItem.vat_amount,
                              subtotal: originalItem.subtotal,
                              name: originalItem.name || null,
                              sku: originalItem.sku || null,
                              unit: originalItem.unit || null,
                              unit_name: originalItem.unit_name || null,
                          }
                        : item,
                ),
            }));
        }
    };

    const handleSaveEditItem = (index) => {
        const item = formData.product_variants[index];
        if (!item.product_variant_id || !item.quantity || !item.price) {
            emit("toast:error", "Vui lòng điền đầy đủ thông tin!");
            return;
        }

        setEditingIndexes(editingIndexes.filter((i) => i !== index));
        emit("toast:success", "Cập nhật thành công!");
    };

    const handleUpdateItem = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            product_variants: prev.product_variants.map((item, i) => {
                if (i === index) {
                    const updatedItem = { ...item, [field]: value };

                    if (
                        field === "quantity" ||
                        field === "price" ||
                        field === "vat_id"
                    ) {
                        const { vatAmount, subtotal } = calculateAmounts(
                            field === "quantity" ? value : updatedItem.quantity,
                            field === "price" ? value : updatedItem.price,
                            field === "vat_id" ? value : updatedItem.vat_id,
                        );
                        updatedItem.vat_amount = vatAmount;
                        updatedItem.subtotal = subtotal;
                    }

                    return updatedItem;
                }
                return item;
            }),
        }));
    };

    const handleDeleteProduct = (index) => {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            setFormData((prev) => ({
                ...prev,
                product_variants: prev.product_variants.filter(
                    (_, i) => i !== index,
                ),
            }));
            setEditingIndexes(editingIndexes.filter((i) => i !== index));
        }
    };

    return {
        getVatTaxById,
        getDefaultVatTax,
        calculateAmounts,
        getUsedVariantIds,
        getAvailableProductVariantOptions,
        handleAddProductRow,
        handleCancelAddRow,
        handleUpdateAddingRow,
        handleSaveRow,
        handleEditItem,
        handleCancelEditItem,
        handleSaveEditItem,
        handleUpdateItem,
        handleDeleteProduct,
    };
}