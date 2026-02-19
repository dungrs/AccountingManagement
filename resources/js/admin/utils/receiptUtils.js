/**
 * receiptUtils.js
 * Utility functions dùng chung cho purchase và sales receipt
 */

/**
 * Lấy thông tin variant theo id
 *
 * Hỗ trợ 2 cấu trúc dữ liệu:
 *   1. { id, name, sku, unit, ... }        - Eloquent model trực tiếp
 *   2. { value, label, sku, unit, ... }    - getListProductVariant() dạng select options
 *
 * @param {Array}         productVariants  - Mảng variants từ page props
 * @param {number|string} variantId        - ID cần tìm
 * @returns {Object|null}
 */
export const getVariantInfo = (productVariants, variantId) => {
    if (!Array.isArray(productVariants) || !variantId) return null;

    const found = productVariants.find(
        (v) =>
            Number(v.id) === Number(variantId) ||
            Number(v.value) === Number(variantId),
    );

    if (!found) return null;

    // Normalize về cấu trúc thống nhất để component không cần quan tâm dữ liệu gốc dạng nào
    return {
        ...found,
        id: found.id ?? found.value ?? variantId,
        name: found.name ?? found.label ?? null,
    };
};

/**
 * Tính tổng tiền cho danh sách product variants
 *
 * @param {Array} items
 * @returns {{ totalAmount, totalVat, totalAfterTax, vatAmount, grandTotal }}
 */
export const calculateTotals = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            totalAmount: 0,
            totalVat: 0,
            totalAfterTax: 0,
            vatAmount: 0,
            grandTotal: 0,
        };
    }

    const totalAmount = items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseFloat(item.quantity) || 0;
        return sum + price * qty;
    }, 0);

    const totalVat = items.reduce(
        (sum, item) => sum + (parseFloat(item.vat_amount) || 0),
        0,
    );

    const totalAfterTax = totalAmount + totalVat;

    return {
        totalAmount,
        totalVat,
        totalAfterTax,
        vatAmount: totalVat, // alias
        grandTotal: totalAfterTax, // alias
    };
};