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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import axios from "axios";
import {
    Info,
    Receipt,
    Percent,
    Type,
    FileText,
    Save,
    ArrowDownRight,
    ArrowUpRight,
    Hash,
} from "lucide-react";
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
            <DialogContent className="sm:max-w-[750px] border-0 p-0 gap-0 rounded-lg overflow-hidden">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            {isEdit
                                ? "Chỉnh sửa thuế VAT"
                                : "Thêm thuế VAT mới"}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            {isEdit
                                ? "Cập nhật thông tin thuế VAT trong hệ thống."
                                : "Tạo mới thuế VAT để áp dụng cho hóa đơn mua/bán."}
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

                    {/* GRID 2 CỘT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5 text-blue-600" />
                                Mã thuế <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
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
                                        "pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all",
                                        errors?.code &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.code && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.code[0]}
                                </p>
                            )}
                        </div>

                        {/* Rate */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Percent className="h-3.5 w-3.5 text-purple-600" />
                                Thuế suất (%){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={form.rate}
                                    onChange={(e) =>
                                        handleChange("rate", e.target.value)
                                    }
                                    placeholder="0, 5, 8, 10"
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-purple-500 focus:ring-purple-500 transition-all",
                                        errors?.rate &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.rate && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.rate[0]}
                                </p>
                            )}
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Type className="h-3.5 w-3.5 text-blue-600" />
                                Tên thuế VAT{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                    placeholder="VD: Thuế GTGT 10%"
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

                        {/* Direction */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                {form.direction === "input" ? (
                                    <ArrowDownRight className="h-3.5 w-3.5 text-blue-600" />
                                ) : (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-purple-600" />
                                )}
                                Loại thuế{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={form.direction}
                                onValueChange={(value) =>
                                    handleChange("direction", value)
                                }
                            >
                                <SelectTrigger
                                    className={cn(
                                        "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                        errors?.direction &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                >
                                    <SelectValue placeholder="Chọn loại thuế" />
                                </SelectTrigger>
                                <SelectContent className="dropdown-premium-content">
                                    <SelectItem
                                        value="input"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowDownRight className="h-4 w-4 text-blue-600" />
                                            Thuế đầu vào
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        value="output"
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowUpRight className="h-4 w-4 text-purple-600" />
                                            Thuế đầu ra
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {errors?.direction && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.direction[0]}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                                Mô tả
                            </label>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    handleChange("description", e.target.value)
                                }
                                placeholder="Nhập mô tả cho thuế VAT (nếu có)..."
                                className={cn(
                                    "w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 transition-all",
                                    errors?.description &&
                                        "border-red-500 focus:border-red-500 focus:ring-red-500",
                                )}
                            />
                            {errors?.description && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.description[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Preview Info */}
                    {isEdit && data && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-sm">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                    Mã: {data.code}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                    Thuế suất: {data.rate}%
                                </Badge>
                                <Badge
                                    className={cn(
                                        data.direction === "input"
                                            ? "bg-blue-100 text-blue-700 border-blue-200"
                                            : "bg-purple-100 text-purple-700 border-purple-200",
                                    )}
                                >
                                    {data.direction === "input"
                                        ? "Đầu vào"
                                        : "Đầu ra"}
                                </Badge>
                                <Badge
                                    className={cn(
                                        data.publish === 1
                                            ? "bg-green-100 text-green-700 border-green-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200",
                                    )}
                                >
                                    {data.publish === 1
                                        ? "Đang hoạt động"
                                        : "Ngừng hoạt động"}
                                </Badge>
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