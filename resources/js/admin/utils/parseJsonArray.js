export const parseJsonArray = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("parseJsonArray error:", error, value);
            return [];
        }
    }

    return [];
};