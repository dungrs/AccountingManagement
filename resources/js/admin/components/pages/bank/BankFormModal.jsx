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
import {
    Info,
    Upload,
    Landmark,
    Hash,
    Globe,
    CreditCard,
    Building2,
    Save,
    ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";

export default function BankFormModal({
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
        short_name: "",
        swift_code: "",
        bin_code: "",
        logo: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                name: data.name || "",
                short_name: data.short_name || "",
                swift_code: data.swift_code || "",
                bin_code: data.bin_code || "",
                logo: data.logo || "",
            });
        } else {
            setForm({
                name: "",
                short_name: "",
                swift_code: "",
                bin_code: "",
                logo: "",
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
            ? route("admin.bank.update")
            : route("admin.bank.store");

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

    const openCKFinder = () => {
        if (!window.CKFinder) {
            toast.error("CKFinder chưa được load");
            return;
        }

        window.CKFinder.popup({
            chooseFiles: true,
            width: 900,
            height: 600,

            selectActionFunction: function (fileUrl) {
                console.log("CKFinder selected:", fileUrl);

                handleChange("logo", fileUrl);
                toast.success("Đã chọn ảnh thành công!");
            },

            removePlugins: "basket",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] border-0 p-0 gap-0 rounded-lg overflow-hidden">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white flex items-center gap-2">
                            <Landmark className="h-5 w-5" />
                            {isEdit
                                ? "Chỉnh sửa ngân hàng"
                                : "Thêm ngân hàng mới"}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            {isEdit
                                ? "Cập nhật thông tin ngân hàng trong hệ thống."
                                : "Tạo mới ngân hàng để sử dụng cho các giao dịch."}
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

                    {/* FORM GRID 2 CỘT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bank Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                                Tên ngân hàng{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                    placeholder="VD: Ngân hàng TMCP Ngoại thương Việt Nam"
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

                        {/* Short Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5 text-purple-600" />
                                Tên viết tắt
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.short_name}
                                    onChange={(e) =>
                                        handleChange(
                                            "short_name",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="VD: Vietcombank"
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-purple-500 focus:ring-purple-500 transition-all",
                                        errors?.short_name &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.short_name && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.short_name[0]}
                                </p>
                            )}
                        </div>

                        {/* Swift Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5 text-blue-600" />
                                Swift Code
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.swift_code}
                                    onChange={(e) =>
                                        handleChange(
                                            "swift_code",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="VD: BFTVVNVX"
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all",
                                        errors?.swift_code &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.swift_code && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.swift_code[0]}
                                </p>
                            )}
                        </div>

                        {/* BIN Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                                BIN Code
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.bin_code}
                                    onChange={(e) =>
                                        handleChange("bin_code", e.target.value)
                                    }
                                    placeholder="VD: 970436"
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-orange-500 focus:ring-orange-500 transition-all",
                                        errors?.bin_code &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.bin_code && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.bin_code[0]}
                                </p>
                            )}
                        </div>

                        {/* Logo */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                                Logo (URL)
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        placeholder="Nhập URL hoặc chọn ảnh..."
                                        value={form.logo}
                                        className="flex-1 border-slate-200 bg-slate-50"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={openCKFinder}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Chọn ảnh
                                </Button>
                            </div>
                            {form.logo && (
                                <div className="mt-2 flex items-center gap-3">
                                    <img
                                        src={form.logo}
                                        alt="Logo preview"
                                        className="h-12 w-12 rounded-lg object-cover border-2 border-blue-200"
                                    />
                                    <span className="text-xs text-slate-500">
                                        Logo xem trước
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Info */}
                    {isEdit && data && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-sm">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                                    <Landmark className="h-3 w-3" />
                                    {data.name}
                                </Badge>
                                {data.short_name && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                        {data.short_name}
                                    </Badge>
                                )}
                                <Badge
                                    className={cn(
                                        data.active
                                            ? "bg-green-100 text-green-700 border-green-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200",
                                    )}
                                >
                                    {data.active
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