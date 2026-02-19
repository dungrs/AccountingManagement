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
import { Badge } from "@/admin/components/ui/badge";
import axios from "axios";
import { Info, Users, Phone, Mail, FileText, Crown } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/admin/lib/utils";

export default function UserCatalogueFormModal({
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
        phone: "",
        email: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                name: data.name || "",
                description: data.description || "",
                phone: data.phone || "",
                email: data.email || "",
            });
        } else {
            setForm({
                name: "",
                description: "",
                phone: "",
                email: "",
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
            ? route("admin.user.catalogue.update")
            : route("admin.user.catalogue.store");

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

                if (err.response?.status === 422) {
                    setErrors(err.response.data.errors || {});
                    toast.error("Vui lòng kiểm tra lại thông tin!");
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
            <DialogContent className="sm:max-w-[500px] border-0 p-0 gap-0 rounded-lg overflow-hidden">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white flex items-center gap-2">
                            {isEdit
                                ? "Chỉnh sửa nhóm thành viên"
                                : "Thêm nhóm thành viên mới"}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            {isEdit
                                ? "Cập nhật thông tin nhóm thành viên trong hệ thống."
                                : "Tạo mới nhóm thành viên và phân quyền cho nhóm."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Info Alert */}
                    <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm text-slate-700">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p>
                            Những trường có dấu{" "}
                            <Badge
                                variant="outline"
                                className="bg-red-100 text-red-600 border-red-200 mx-1 px-1.5"
                            >
                                *
                            </Badge>{" "}
                            là bắt buộc phải nhập.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Tên nhóm */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Users className="h-4 w-4 text-blue-600" />
                                Tên nhóm <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                    placeholder="Nhập tên nhóm..."
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all",
                                        errors?.name &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.name && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <Info className="h-3 w-3" />
                                    {errors.name[0]}
                                </p>
                            )}
                        </div>

                        {/* Mô tả */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <FileText className="h-4 w-4 text-purple-600" />
                                Mô tả
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.description}
                                    onChange={(e) =>
                                        handleChange(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nhập mô tả về nhóm..."
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-purple-500 focus:ring-purple-500 transition-all",
                                        errors?.description &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.description && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <Info className="h-3 w-3" />
                                    {errors.description[0]}
                                </p>
                            )}
                        </div>

                        {/* Số điện thoại */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Phone className="h-4 w-4 text-blue-600" />
                                Số điện thoại{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.phone}
                                    onChange={(e) =>
                                        handleChange("phone", e.target.value)
                                    }
                                    placeholder="Nhập số điện thoại liên hệ..."
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all",
                                        errors?.phone &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.phone && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <Info className="h-3 w-3" />
                                    {errors.phone[0]}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Mail className="h-4 w-4 text-purple-600" />
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        handleChange("email", e.target.value)
                                    }
                                    placeholder="Nhập địa chỉ email..."
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-purple-500 focus:ring-purple-500 transition-all",
                                        errors?.email &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.email && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <Info className="h-3 w-3" />
                                    {errors.email[0]}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-gradient-premium"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>{isEdit ? "Cập nhật" : "Thêm mới"}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}