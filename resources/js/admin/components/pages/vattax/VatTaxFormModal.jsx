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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import axios from "axios";
import { Info } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";

export default function VatTaxFormModal({
    open,
    mode = "create",
    data = null,
    onClose,
    onSuccess,
}) {
    const isEdit = mode === "edit";

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        code: "",
        name: "",
        rate: "",
        direction: "input",
        description: "",
        publish: 1,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                code: data.code || "",
                name: data.name || "",
                rate: data.rate ?? "",
                direction: data.direction || "input",
                description: data.description || "",
            });
        } else {
            setForm({
                code: "",
                name: "",
                rate: "",
                direction: "input",
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
            ? route("admin.vattax.update")
            : route("admin.vattax.store");

        const payload = isEdit ? { id: data.id, ...form } : form;

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
                        "Có lỗi xảy ra, vui lòng thử lại!",
                );
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] rounded-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Chỉnh sửa thuế VAT" : "Thêm thuế VAT"}
                    </DialogTitle>

                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật thông tin thuế VAT."
                            : "Tạo mới thuế VAT trong hệ thống."}
                    </DialogDescription>
                </DialogHeader>

                {/* Alert */}
                <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                    <Info className="w-4 h-4 mt-0.5" />
                    <p>
                        Những trường có dấu{" "}
                        <span className="text-red-500 font-semibold">*</span> là
                        bắt buộc phải nhập.
                    </p>
                </div>

                {/* GRID 2 CỘT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Mã thuế <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={form.code}
                            onChange={(e) =>
                                handleChange(
                                    "code",
                                    e.target.value.toUpperCase(),
                                )
                            }
                            placeholder="VD: R10, V8"
                            className={cn(
                                errors?.code &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />
                        {errors?.code && (
                            <p className="text-red-500 text-sm">
                                {errors.code[0]}
                            </p>
                        )}
                    </div>

                    {/* Rate */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Thuế suất (%){" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            value={form.rate}
                            onChange={(e) =>
                                handleChange("rate", e.target.value)
                            }
                            placeholder="0, 5, 8, 10"
                            className={cn(
                                errors?.rate &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />
                        {errors?.rate && (
                            <p className="text-red-500 text-sm">
                                {errors.rate[0]}
                            </p>
                        )}
                    </div>

                    {/* Name + Direction cùng 1 dòng */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Tên thuế VAT <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={form.name}
                            onChange={(e) =>
                                handleChange("name", e.target.value)
                            }
                            className={cn(
                                errors?.name &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />
                        {errors?.name && (
                            <p className="text-red-500 text-sm">
                                {errors.name[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Loại thuế <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={form.direction}
                            onValueChange={(value) =>
                                handleChange("direction", value)
                            }
                        >
                            <SelectTrigger
                                className={cn(
                                    errors?.direction &&
                                        "border-red-500 focus-visible:ring-red-500",
                                )}
                            >
                                <SelectValue placeholder="Chọn loại thuế" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="input">
                                    Thuế đầu vào
                                </SelectItem>
                                <SelectItem value="output">
                                    Thuế đầu ra
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {errors?.direction && (
                            <p className="text-red-500 text-sm">
                                {errors.direction[0]}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            className={cn(
                                "w-full rounded-md border px-3 py-2 text-sm",
                                errors?.description &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />
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
