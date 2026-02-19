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
    BookOpen,
    Hash,
    Type,
    FileText,
    FolderTree,
    Save,
    DollarSign,
    CreditCard,
    PieChart,
    TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";
import { usePage } from "@inertiajs/react";
import SelectCombobox from "../../ui/select-combobox";

export default function AccountingAccountFormModal({
    open,
    mode = "create",
    data = null,
    onClose,
    onSuccess,
}) {
    const { accountTypes = [], dropdown = {} } = usePage().props;

    const isEdit = mode === "edit";
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        account_code: "",
        name: "",
        account_type: "",
        parent_id: null,
        description: "",
        publish: 1,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                account_code: data.account_code ?? "",
                name: data.name ?? "",
                account_type: data.account_type ?? "",
                parent_id: data.parent_id ?? null,
                description: data.description ?? "",
                publish: data.publish ?? 1,
            });
        } else {
            setForm({
                account_code: "",
                name: "",
                account_type: "",
                parent_id: null,
                description: "",
                publish: 1,
            });
        }
    }, [open, isEdit, data]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleSubmit = () => {
        setLoading(true);
        setErrors({});

        const apiRoute = isEdit
            ? route("admin.accounting_account.update")
            : route("admin.accounting_account.store");

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
            .finally(() => setLoading(false));
    };

    // Hàm lấy icon cho loại tài khoản
    const getAccountTypeIcon = (type) => {
        switch (type) {
            case "ASSET":
                return <DollarSign className="h-4 w-4" />;
            case "LIABILITY":
                return <CreditCard className="h-4 w-4" />;
            case "EQUITY":
                return <PieChart className="h-4 w-4" />;
            case "REVENUE":
                return <TrendingUp className="h-4 w-4" />;
            case "EXPENSE":
                return <TrendingUp className="h-4 w-4 rotate-180" />;
            default:
                return <BookOpen className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[780px] border-0 p-0 gap-0 rounded-lg overflow-hidden">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            {isEdit
                                ? "Chỉnh sửa tài khoản kế toán"
                                : "Thêm tài khoản kế toán mới"}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            Quản lý danh mục tài khoản kế toán theo hệ thống
                            phân cấp.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Alert */}
                    <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm text-slate-700">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p>
                            Trường có dấu{" "}
                            <Badge
                                variant="outline"
                                className="bg-red-100 text-red-600 border-red-200 mx-1 px-1.5"
                            >
                                *
                            </Badge>{" "}
                            là bắt buộc.
                        </p>
                    </div>

                    {/* FORM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5 text-blue-600" />
                                Mã tài khoản{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.account_code}
                                    onChange={(e) =>
                                        handleChange(
                                            "account_code",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="VD: 111, 112, 131..."
                                    className={cn(
                                        "pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all",
                                        errors?.account_code &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                />
                            </div>
                            {errors?.account_code && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.account_code[0]}
                                </p>
                            )}
                        </div>

                        {/* Account type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                                Loại tài khoản{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={form.account_type}
                                onValueChange={(v) =>
                                    handleChange("account_type", v)
                                }
                            >
                                <SelectTrigger
                                    className={cn(
                                        "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                                        errors?.account_type &&
                                            "border-red-500 focus:border-red-500 focus:ring-red-500",
                                    )}
                                >
                                    <SelectValue placeholder="Chọn loại tài khoản" />
                                </SelectTrigger>
                                <SelectContent className="dropdown-premium-content">
                                    {accountTypes.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                            className="cursor-pointer hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5"
                                        >
                                            <span className="flex items-center gap-2">
                                                {getAccountTypeIcon(item.value)}
                                                {item.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors?.account_type && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {errors.account_type[0]}
                                </p>
                            )}
                        </div>

                        {/* Name */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <Type className="h-3.5 w-3.5 text-blue-600" />
                                Tên tài khoản{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                    placeholder="Nhập tên tài khoản..."
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

                        {/* Parent account */}
                        <div className="md:col-span-2">
                            <SelectCombobox
                                label="Tài khoản cha"
                                value={form.parent_id}
                                onChange={(v) => handleChange("parent_id", v)}
                                options={Object.entries(dropdown).map(
                                    ([value, label]) => ({
                                        value,
                                        label,
                                    }),
                                )}
                                placeholder="Chọn tài khoản cha"
                                error={errors?.parent_id?.[0]}
                                icon={
                                    <FolderTree className="h-4 w-4 text-purple-600" />
                                }
                            />
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
                                placeholder="Nhập mô tả cho tài khoản (nếu có)..."
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
                                    Mã: {data.account_code}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                    Cấp: {data.level || 1}
                                </Badge>
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