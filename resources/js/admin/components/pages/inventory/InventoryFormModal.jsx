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
import { Info, Package, Barcode, Hash } from "lucide-react";
import toast from "react-hot-toast";

// cn helper của shadcn
import { cn } from "@/admin/lib/utils";

export default function InventoryFormModal({
    open,
    mode = "create",
    data = null,
    onClose,
    onSuccess,
}) {
    const isEdit = mode === "edit" || mode === "adjust";

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        sku: "",
        barcode: "",
        quantity: 0,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            setForm({
                sku: data.sku || "",
                barcode: data.barcode || "",
                quantity: data.quantity || 0,
            });
        } else {
            setForm({
                sku: "",
                barcode: "",
                quantity: 0,
            });
        }
    }, [open, isEdit, data]);

    // Toast khi có lỗi validate
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors)
                .flat()
                .join(", ");
        }
    }, [errors]);

    const handleChange = (field, value) => {
        if (field === "quantity") {
            // Đảm bảo quantity là số không âm
            value = Math.max(0, parseInt(value) || 0);
        }

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

        // Sử dụng route update cho cả edit và adjust
        const apiRoute = route("admin.product.variant.update");

        const payload = {
            id: data.id,
            sku: form.sku,
            barcode: form.barcode,
            quantity: form.quantity
        };

        axios
            .post(apiRoute, payload)
            .then((res) => {
                toast.success(res.data?.message || "Cập nhật tồn kho thành công!");
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

    const getTitle = () => {
        if (mode === "adjust") return "Điều chỉnh tồn kho";
        if (isEdit) return "Chỉnh sửa thông tin sản phẩm";
        return "Thêm sản phẩm mới";
    };

    const getDescription = () => {
        if (mode === "adjust") return "Cập nhật số lượng tồn kho cho sản phẩm.";
        if (isEdit) return "Cập nhật thông tin SKU và Barcode cho sản phẩm.";
        return "Thêm sản phẩm mới vào kho.";
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-md">
                <DialogHeader>
                    <DialogTitle>
                        {getTitle()}
                    </DialogTitle>

                    <DialogDescription>
                        {getDescription()}
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
                    {/* SKU */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            Mã SKU <span className="text-red-500">*</span>
                        </label>

                        <Input
                            value={form.sku}
                            onChange={(e) =>
                                handleChange("sku", e.target.value)
                            }
                            placeholder="Nhập mã SKU..."
                            className={cn(
                                errors?.sku &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {errors?.sku && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.sku[0]}
                            </p>
                        )}
                    </div>

                    {/* Barcode */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                            <Barcode className="w-4 h-4" />
                            Mã Barcode
                        </label>

                        <Input
                            value={form.barcode}
                            onChange={(e) =>
                                handleChange("barcode", e.target.value)
                            }
                            placeholder="Nhập mã barcode..."
                            className={cn(
                                errors?.barcode &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {errors?.barcode && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.barcode[0]}
                            </p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Số lượng tồn kho <span className="text-red-500">*</span>
                        </label>

                        <Input
                            type="number"
                            min=""
                            value={form.quantity}
                            onChange={(e) =>
                                handleChange("quantity", e.target.value)
                            }
                            placeholder="Nhập số lượng..."
                            className={cn(
                                errors?.quantity &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {errors?.quantity && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.quantity[0]}
                            </p>
                        )}

                        {isEdit && data?.name && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Đang cập nhật cho sản phẩm: <span className="font-medium">{data.name}</span>
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
                            : mode === "adjust"
                              ? "Cập nhật tồn kho"
                              : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}