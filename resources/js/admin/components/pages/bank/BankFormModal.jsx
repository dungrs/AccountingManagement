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
import { Info, Upload } from "lucide-react";
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
            <DialogContent className="sm:max-w-[750px] rounded-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Chỉnh sửa ngân hàng" : "Thêm ngân hàng"}
                    </DialogTitle>

                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật thông tin ngân hàng."
                            : "Tạo mới ngân hàng trong hệ thống."}
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

                {/* FORM GRID 2 CỘT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {/* Bank Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Tên ngân hàng{" "}
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
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name[0]}
                            </p>
                        )}
                    </div>

                    {/* Short Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Tên viết tắt
                        </label>

                        <Input
                            value={form.short_name}
                            onChange={(e) =>
                                handleChange("short_name", e.target.value)
                            }
                            className={cn(
                                errors?.short_name &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />

                        {errors?.short_name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.short_name[0]}
                            </p>
                        )}
                    </div>

                    {/* Swift Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Swift Code
                        </label>

                        <Input
                            value={form.swift_code}
                            onChange={(e) =>
                                handleChange("swift_code", e.target.value)
                            }
                            className={cn(
                                errors?.swift_code &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />

                        {errors?.swift_code && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.swift_code[0]}
                            </p>
                        )}
                    </div>

                    {/* BIN Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">BIN Code</label>

                        <Input
                            value={form.bin_code}
                            onChange={(e) =>
                                handleChange("bin_code", e.target.value)
                            }
                            className={cn(
                                errors?.bin_code &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />

                        {errors?.bin_code && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.bin_code[0]}
                            </p>
                        )}
                    </div>

                    {/* Logo */}
                    <div className="space-y-2 md:col-span-2">
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium">
                                Logo (URL)
                            </label>
                            <div className="flex items-center gap-3">
                                <Input
                                    readOnly
                                    placeholder="Nhập URL hoặc chọn ảnh..."
                                    value={form.logo}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={openCKFinder}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Chọn ảnh
                                </Button>
                            </div>
                        </div>
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
