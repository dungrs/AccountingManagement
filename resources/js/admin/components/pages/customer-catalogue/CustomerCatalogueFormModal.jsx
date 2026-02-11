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

// cn helper của shadcn
import { cn } from "@/admin/lib/utils";

export default function CustomerCatalogueFormModal({
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
        description: "",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                name: data.name || "",
                description: data.description || "",
            });
        } else {
            setForm({
                name: "",
                description: "",
            });
        }
    }, [open, isEdit, data]);

    // Toast khi có lỗi validate
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors)
                .flat()
                .join(", ");

            // toast.error(errorMessages);
        }
    }, [errors]);

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
            ? route("admin.customer.catalogue.update")
            : route("admin.customer.catalogue.store");

        const payload = isEdit ? { id: data.id, ...form } : { ...form };

        axios
            .post(apiRoute, payload)
            .then((res) => {
                toast.success(res.data?.message || "Thao tác thành công!");
                onSuccess?.();
                onClose();
            })
            .catch((err) => {
                console.log("Submit error:", err);

                // validate error laravel
                if (err.response?.status === 422) {
                    setErrors(err.response.data.errors || {});
                    return;
                }

                // lỗi khác
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
                            ? "Chỉnh sửa nhóm khách hàng"
                            : "Thêm nhóm khách hàng"}
                    </DialogTitle>

                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật thông tin nhóm khách hàng."
                            : "Tạo mới nhóm khách hàng trong hệ thống."}
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
                            Tên nhóm <span className="text-red-500">*</span>
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
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name[0]}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>

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
                            <p className="text-red-500 text-sm mt-1">
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