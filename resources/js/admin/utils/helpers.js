export const getInitials = (name = "", fallback = "B") => {
    if (!name || typeof name !== "string") return fallback;

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return fallback;
    if (words.length === 1) return words[0][0].toUpperCase();

    return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase();
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

export const formatCompactNumber = (value) => {
    if (value === null || value === undefined || value === 0) return "0";

    const num = Number(value);
    if (isNaN(num)) return "0";

    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + "B";
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
};
