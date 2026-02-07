/**
 * Chuyển tiếng Việt có dấu → không dấu + slug
 */
export function removeUtf8(str = "") {
    return str
        .toLowerCase()
        .trim()
        .replace(/à|á|ả|ạ|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
        .replace(/è|é|ẻ|ẹ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
        .replace(/ì|í|ỉ|ị|ĩ/g, "i")
        .replace(/ò|ó|ỏ|ọ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
        .replace(/ù|ú|ủ|ụ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
        .replace(/ỳ|ý|ỷ|ỵ|ỹ/g, "y")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}
