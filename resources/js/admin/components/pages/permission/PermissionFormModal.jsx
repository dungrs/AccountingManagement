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
import { Info, Shield, Key, Save, Hash, Type } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";

export default function PermissionFormModal({
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
        canonical: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                name: data.name || "",
                canonical: data.canonical || "",
            });
        } else {
            setForm({
                name: "",
                canonical: "",
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
            ? route("admin.permission.update")
            : route("admin.permission.store");

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
                            <Shield className="h-5 w-5" />
                            {isEdit ? "Chỉnh sửa quyền" : "Thêm quyền mới"}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            {isEdit
                                ? "Cập nhật thông tin quyền trong hệ thống."
                                : "Tạo mới một quyền để phân quyền cho người dùng."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Alert */}
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
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Type className="h-3.5 w-3.5 text-blue-600" />
                                Tên quyền{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                    placeholder="Ví dụ: Quản lý người dùng"
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all",
                                        errors?.name &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.name && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.name[0]}
                                </p>
                            )}
                        </div>

                        {/* Canonical */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Key className="h-3.5 w-3.5 text-purple-600" />
                                Mã quyền (Canonical)
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.canonical}
                                    onChange={(e) =>
                                        handleChange(
                                            "canonical",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ví dụ: user.manage"
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-purple-500 focus:ring-purple-500 transition-all",
                                        errors?.canonical &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.canonical && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.canonical[0]}
                                </p>
                            )}
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Mã quyền dùng để kiểm tra trong code, nên dùng
                                định dạng module.action
                            </p>
                        </div>
                    </div>

                    {/* Preview Info */}
                    {isEdit && data && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-sm">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {data.name}
                                </Badge>
                                {data.canonical && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-mono">
                                        <Key className="h-3 w-3 mr-1" />
                                        {data.canonical}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
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
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEdit ? "Cập nhật" : "Thêm mới"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}