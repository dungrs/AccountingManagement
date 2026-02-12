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
