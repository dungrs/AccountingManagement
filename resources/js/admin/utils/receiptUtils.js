// Utility functions for receipt forms

export const calculateTotals = (productVariants) => {
    const totalAmount = productVariants.reduce(
        (sum, item) =>
            sum + parseFloat(item.quantity || 0) * parseFloat(item.price || 0),
        0
    );
    const vatAmount = productVariants.reduce(
        (sum, item) => sum + parseFloat(item.vat_amount || 0),
        0
    );
    const grandTotal = totalAmount + vatAmount;

    return { totalAmount, vatAmount, grandTotal };
};

export const getVariantInfo = (productVariants, variantId) => {
    return productVariants?.find((pv) => pv.product_variant_id === variantId);
};