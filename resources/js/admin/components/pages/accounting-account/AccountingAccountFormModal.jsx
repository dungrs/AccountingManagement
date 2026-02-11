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
                    return;
                }

                toast.error(
                    err.response?.data?.message ||
                        "Có lỗi xảy ra, vui lòng thử lại!",
                );
            })
            .finally(() => setLoading(false));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[780px] rounded-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit
                            ? "Chỉnh sửa tài khoản kế toán"
                            : "Thêm tài khoản kế toán"}
                    </DialogTitle>
                    <DialogDescription>
                        Quản lý danh mục tài khoản kế toán theo hệ thống phân
                        cấp.
                    </DialogDescription>
                </DialogHeader>

                {/* Alert */}
                <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                    <Info className="w-4 h-4 mt-0.5" />
                    <p>
                        Trường có dấu{" "}
                        <span className="text-red-500 font-semibold">*</span> là
                        bắt buộc.
                    </p>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Mã tài khoản <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={form.account_code}
                            onChange={(e) =>
                                handleChange(
                                    "account_code",
                                    e.target.value.toUpperCase(),
                                )
                            }
                            className={cn(
                                errors?.account_code &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />
                        {errors?.account_code && (
                            <p className="text-red-500 text-sm">
                                {errors.account_code[0]}
                            </p>
                        )}
                    </div>

                    {/* Account type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
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
                                    errors?.account_type &&
                                        "border-red-500 focus-visible:ring-red-500",
                                )}
                            >
                                <SelectValue placeholder="Chọn loại tài khoản" />
                            </SelectTrigger>
                            <SelectContent>
                                {accountTypes.map((item) => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.account_type && (
                            <p className="text-red-500 text-sm">
                                {errors.account_type[0]}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">
                            Tên tài khoản{" "}
                            <span className="text-red-500">*</span>
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
                        />
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
                            className="w-full rounded-md border px-3 py-2 text-sm"
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
