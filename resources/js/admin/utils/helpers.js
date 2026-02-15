export const getInitials = (name = "", fallback = "B") => {
    if (!name || typeof name !== "string") return fallback;

    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return fallback;
    if (words.length === 1) return words[0][0].toUpperCase();

    return (
        words[0][0].toUpperCase() +
        words[words.length - 1][0].toUpperCase()
    );
};

export const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("vi-VN");
};

export const formatCurrency = (value) => {
    if (!value) return "-";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
};

export const formatNumber = (value) => {
    if (!value && value !== 0) return "-";
    return new Intl.NumberFormat("vi-VN").format(value);
};