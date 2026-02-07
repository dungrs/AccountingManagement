import axios from "axios";
import toast from "react-hot-toast";

/**
 * Custom hook để xử lý bulk update status
 * @param {Array} selectedRows - Mảng các ID được chọn
 * @param {Function} setData - Hàm để update data optimistically
 * @param {Function} setSelectedRows - Hàm để clear selected rows
 */
export function useBulkUpdateStatus(selectedRows, setData, setSelectedRows) {
    const bulkUpdateStatus = async (status, model, modelParent) => {
        if (selectedRows.length === 0) {
            toast.error("Vui lòng chọn ít nhất một mục!");
            return;
        }

        try {
            const res = await axios.post(route("admin.changeStatusAll"), {
                ids: selectedRows,
                field: "publish",
                status: status ? 1 : 0,
                model: model,
                modelParent: modelParent,
            });

            toast.success(
                res.data?.message || "Cập nhật trạng thái thành công!"
            );

            // update UI ngay lập tức
            setData((prev) =>
                prev.map((item) =>
                    selectedRows.includes(item.id)
                        ? { ...item, active: status }
                        : item
                )
            );

            setSelectedRows([]);
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                    "Đã xảy ra lỗi khi cập nhật trạng thái!"
            );
        }
    };

    return bulkUpdateStatus;
}