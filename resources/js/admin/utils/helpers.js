export const getInitials = (name = "", fallback = "B") => {
    if (!name || typeof name !== "string") return fallback;

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return fallback;
    if (words.length === 1) return words[0][0].toUpperCase();

    return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase();
};

// utils/helpers.js

/**
 * Format date với nhiều định dạng khác nhau
 * @param {string|Date} dateString - Ngày cần format (có thể là string, Date object, hoặc timestamp)
 * @param {string} format - Định dạng mong muốn (mặc định: "DD/MM/YYYY")
 * @param {Object} options - Các tùy chọn bổ sung
 * @returns {string} - Ngày đã được format
 */
export const formatDate = (dateString, format = "DD/MM/YYYY", options = {}) => {
    if (!dateString) return options.fallback || "-";

    let date;

    // Xử lý các loại đầu vào khác nhau
    if (dateString instanceof Date) {
        date = dateString;
    } else if (typeof dateString === "number") {
        // Xử lý timestamp
        date = new Date(dateString);
    } else if (typeof dateString === "string") {
        // Xử lý string date
        // Kiểm tra nếu là ISO date (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split("-");
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateString);
        }
    } else {
        return options.fallback || "-";
    }

    if (isNaN(date.getTime())) return options.fallback || "-";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    // Tên tháng và ngày trong tuần
    const monthNames = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
    ];

    const shortMonthNames = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
    ];

    const weekdayNames = [
        "Chủ nhật",
        "Thứ hai",
        "Thứ ba",
        "Thứ tư",
        "Thứ năm",
        "Thứ sáu",
        "Thứ bảy",
    ];

    const shortWeekdayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    const weekDay = date.getDay(); // 0 = Chủ nhật

    // Các định dạng hỗ trợ
    const formats = {
        // Ngày tháng năm cơ bản
        "DD/MM/YYYY": `${day}/${month}/${year}`,
        "DD/MM/YY": `${day}/${month}/${year.toString().slice(-2)}`,
        "MM/DD/YYYY": `${month}/${day}/${year}`,
        "YYYY-MM-DD": `${year}-${month}-${day}`,
        "YYYY/MM/DD": `${year}/${month}/${day}`,
        "DD-MM-YYYY": `${day}-${month}-${year}`,
        "DD.MM.YYYY": `${day}.${month}.${year}`,

        // Có thứ trong tuần
        "ddd, DD/MM/YYYY": `${shortWeekdayNames[weekDay]}, ${day}/${month}/${year}`,
        "dddd, DD/MM/YYYY": `${weekdayNames[weekDay]}, ${day}/${month}/${year}`,

        // Có tên tháng
        "DD MMM YYYY": `${day} ${shortMonthNames[date.getMonth()]} ${year}`,
        "DD MMMM YYYY": `${day} ${monthNames[date.getMonth()]} ${year}`,
        "MMMM DD, YYYY": `${monthNames[date.getMonth()]} ${day}, ${year}`,

        // Có giờ phút
        "DD/MM/YYYY HH:mm": `${day}/${month}/${year} ${hours}:${minutes}`,
        "DD/MM/YYYY HH:mm:ss": `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
        "YYYY-MM-DD HH:mm:ss": `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
        "HH:mm DD/MM/YYYY": `${hours}:${minutes} ${day}/${month}/${year}`,

        // Chỉ giờ
        "HH:mm": `${hours}:${minutes}`,
        "HH:mm:ss": `${hours}:${minutes}:${seconds}`,
        "h:mm A": `${date.getHours() % 12 || 12}:${minutes} ${date.getHours() >= 12 ? "PM" : "AM"}`,

        // Định dạng tiếng Việt đầy đủ
        "vi-full": `${day} tháng ${month} năm ${year}`,
        "vi-full-with-weekday": `${weekdayNames[weekDay]}, ngày ${day} tháng ${month} năm ${year}`,
        "vi-short": `${day}/${month}/${year}`,

        // Định dạng cho API
        "api-date": `${year}-${month}-${day}`,
        "api-datetime": `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,

        // Định dạng cho báo cáo
        report: `${day}/${month}/${year}`,
        "report-with-time": `${day}/${month}/${year} ${hours}:${minutes}`,

        // Định dạng khác
        iso: date.toISOString(),
        "locale-vi": date.toLocaleDateString("vi-VN"),
        "locale-en": date.toLocaleDateString("en-US"),
    };

    // Nếu format không tồn tại trong danh sách, trả về định dạng mặc định
    return formats[format] || formats["DD/MM/YYYY"];
};

/**
 * Format date range (khoảng thời gian)
 * @param {string|Date} startDate - Ngày bắt đầu
 * @param {string|Date} endDate - Ngày kết thúc
 * @param {string} format - Định dạng cho từng ngày
 * @returns {string} - Khoảng thời gian đã format
 */
export const formatDateRange = (startDate, endDate, format = "DD/MM/YYYY") => {
    if (!startDate || !endDate) return "-";

    const start = formatDate(startDate, format);
    const end = formatDate(endDate, format);

    if (start === end) return start;
    return `${start} - ${end}`;
};

/**
 * Format date dạng tương đối (ví dụ: "2 ngày trước")
 * @param {string|Date} dateString - Ngày cần format
 * @param {string} prefix - Tiền tố (mặc định: "")
 * @returns {string} - Ngày tương đối
 */
export const formatRelativeDate = (dateString, prefix = "") => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffSeconds = Math.floor(diffTime / 1000);

    // Kiểm tra xem là ngày trong quá khứ hay tương lai
    const isPast = date < now;
    const suffix = isPast ? "trước" : "nữa";

    if (diffSeconds < 60) {
        return `${prefix} vừa xong`;
    } else if (diffMinutes < 60) {
        return `${prefix} ${diffMinutes} phút ${suffix}`;
    } else if (diffHours < 24) {
        return `${prefix} ${diffHours} giờ ${suffix}`;
    } else if (diffDays < 7) {
        return `${prefix} ${diffDays} ngày ${suffix}`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${prefix} ${weeks} tuần ${suffix}`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${prefix} ${months} tháng ${suffix}`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${prefix} ${years} năm ${suffix}`;
    }
};

/**
 * Lấy tên tháng
 * @param {number} month - Tháng (1-12)
 * @param {boolean} short - Rút gọn hay không
 * @returns {string} - Tên tháng
 */
export const getMonthName = (month, short = false) => {
    const monthNames = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
    ];

    const shortMonthNames = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
    ];

    if (month < 1 || month > 12) return "";
    return short ? shortMonthNames[month - 1] : monthNames[month - 1];
};

/**
 * Lấy tên ngày trong tuần
 * @param {number} day - Ngày trong tuần (0-6, 0 = Chủ nhật)
 * @param {boolean} short - Rút gọn hay không
 * @returns {string} - Tên ngày
 */
export const getWeekdayName = (day, short = false) => {
    const weekdayNames = [
        "Chủ nhật",
        "Thứ hai",
        "Thứ ba",
        "Thứ tư",
        "Thứ năm",
        "Thứ sáu",
        "Thứ bảy",
    ];

    const shortWeekdayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    if (day < 0 || day > 6) return "";
    return short ? shortWeekdayNames[day] : weekdayNames[day];
};

/**
 * Kiểm tra ngày có hợp lệ không
 * @param {string|Date} dateString - Ngày cần kiểm tra
 * @returns {boolean} - true nếu hợp lệ
 */
export const isValidDate = (dateString) => {
    if (!dateString) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

/**
 * Lấy ngày đầu tiên của tháng
 * @param {string|Date} dateString - Ngày tham chiếu
 * @returns {Date} - Ngày đầu tiên của tháng
 */
export const getFirstDayOfMonth = (dateString = new Date()) => {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Lấy ngày cuối cùng của tháng
 * @param {string|Date} dateString - Ngày tham chiếu
 * @returns {Date} - Ngày cuối cùng của tháng
 */
export const getLastDayOfMonth = (dateString = new Date()) => {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Thêm ngày vào một ngày
 * @param {string|Date} dateString - Ngày gốc
 * @param {number} days - Số ngày cần thêm (có thể âm)
 * @returns {Date} - Ngày mới
 */
export const addDays = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date;
};

/**
 * Tính số ngày giữa 2 ngày
 * @param {string|Date} startDate - Ngày bắt đầu
 * @param {string|Date} endDate - Ngày kết thúc
 * @returns {number} - Số ngày
 */
export const daysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
