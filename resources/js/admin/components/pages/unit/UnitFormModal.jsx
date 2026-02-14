"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import axios from "axios";
import { Info } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";

export default function UnitFormModal({
    open,
    mode = "create",
    data = null,
    onClose,
    onSuccess,
}) {
    const isEdit = mode === "edit";

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        code: "",
        description: "",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                name: data.name || "",
                code: data.code || "",
                description: data.description || "",
            });
        } else {
            setForm({
                name: "",
                code: "",
                description: "",
            });
        }
    }, [open, isEdit, data]);

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: null,
        }));
    };

    const handleSubmit = () => {
        setLoading(true);
        setErrors({});

        const apiRoute = isEdit
            ? route("admin.unit.update")
            : route("admin.unit.store");

        const payload = isEdit
            ? { id: data.id, ...form }
            : { ...form };

        axios
            .post(apiRoute, payload)
            .then((res) => {
                toast.success(res.data?.message || "Thao tác thành công!");
                onSuccess?.();
                onClose();
            })
            .catch((err) => {
                if (err.response?.status === 422) {
                    setErrors(err.response.data.errors || {});
                    return;
                }

                toast.error(
                    err.response?.data?.message ||
                        "Có lỗi xảy ra, vui lòng thử lại!"
                );
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit
                            ? "Chỉnh sửa đơn vị tính"
                            : "Thêm đơn vị tính"}
                    </DialogTitle>

                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật thông tin đơn vị tính."
                            : "Tạo mới đơn vị tính trong hệ thống."}
                    </DialogDescription>
                </DialogHeader>

                {/* Alert */}
                <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                    <Info className="w-4 h-4 mt-0.5" />
                    <p>
                        Những trường có dấu{" "}
                        <span className="text-red-500 font-semibold">*</span>{" "}
                        là bắt buộc phải nhập.
                    </p>
                </div>

                <div className="space-y-4 mt-3">

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Tên đơn vị <span className="text-red-500">*</span>
                        </label>

                        <Input
                            value={form.name}
                            onChange={(e) =>
                                handleChange("name", e.target.value)
                            }
                            className={cn(
                                errors?.name &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {errors?.name && (
                            <p className="text-red-500 text-sm">
                                {errors.name[0]}
                            </p>
                        )}
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Mã đơn vị
                        </label>

                        <Input
                            value={form.code}
                            onChange={(e) =>
                                handleChange("code", e.target.value)
                            }
                            placeholder="Ví dụ: KG, PCS, BOX..."
                            className={cn(
                                errors?.code &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {errors?.code && (
                            <p className="text-red-500 text-sm">
                                {errors.code[0]}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Mô tả
                        </label>

                        <Input
                            value={form.description}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            className={cn(
                                errors?.description &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {errors?.description && (
                            <p className="text-red-500 text-sm">
                                {errors.description[0]}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>

                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading
                            ? "Đang xử lý..."
                            : isEdit
                              ? "Cập nhật"
                              : "Thêm mới"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}