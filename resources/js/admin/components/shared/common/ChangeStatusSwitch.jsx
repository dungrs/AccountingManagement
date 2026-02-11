"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Switch } from "@/admin/components/ui/switch";
import toast from "react-hot-toast";

export default function ChangeStatusSwitch({
    id,
    checked = false,
    field = "publish",
    model = "",
    modelParent = "",
    onSuccess = null,
    onError = null,
    disabled = false,
}) {
    const [loading, setLoading] = useState(false);
    const [localChecked, setLocalChecked] = useState(checked);

    // 🔥 đồng bộ localChecked khi checked từ parent thay đổi
    useEffect(() => {
        setLocalChecked(checked);
    }, [checked]);

    const handleChange = async (value) => {
        if (loading) return;

        // optimistic update
        setLocalChecked(value);

        // nếu backend bạn dùng 1/0
        const status = value ? 1 : 0;

        setLoading(true);

        try {
            const res = await axios.post(route("admin.changeStatus", id), {
                field,
                status,
                model,
                modelParent,
            });

            toast.success(
                res.data?.message || "Cập nhật trạng thái thành công!"
            );

            // 🔥 gửi luôn trạng thái mới về table để update data
            onSuccess?.({
                ...res.data,
                checked: value,
                id: id,
            });
        } catch (err) {
            // rollback UI
            setLocalChecked(!value);

            toast.error(
                err.response?.data?.message ||
                    "Đã xảy ra lỗi khi cập nhật trạng thái."
            );

            onError?.(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Switch
            checked={localChecked}
            disabled={disabled || loading}
            onCheckedChange={handleChange}
        />
    );
}