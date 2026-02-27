// admin/components/pages/inventory/InventoryAdjustModal.jsx
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/admin/components/ui/dialog";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Badge } from "@/admin/components/ui/badge";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Loader2,
    Package,
    Info,
    AlertTriangle,
    Save,
    Hash,
    FileText,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function InventoryAdjustModal({
    open,
    onClose,
    data,
    onSuccess,
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        new_quantity: data?.quantity || 0,
        reason: "",
        note: "",
    });

    if (!data) return null;

    const quantityChange = formData.new_quantity - (data?.quantity || 0);
    const isIncrease = quantityChange > 0;
    const isDecrease = quantityChange < 0;

    const handleSubmit = async () => {
        if (!formData.reason) {
            toast.error("Vui lòng nhập lý do điều chỉnh");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(route("admin.inventory.adjust"), {
                product_variant_id: data.id,
                new_quantity: formData.new_quantity,
                reason: formData.reason,
                note: formData.note,
            });

            if (res.data.status === "success") {
                toast.success(res.data.message);
                onSuccess?.();
                onClose();
            } else {
                toast.info(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Điều chỉnh thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-0 p-0 gap-0 rounded-lg overflow-hidden">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Điều chỉnh tồn kho
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            Điều chỉnh số lượng tồn kho cho sản phẩm
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Product Info */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                <Package className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800">
                                    {data.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="outline"
                                        className="bg-blue-100 text-blue-700 border-blue-200"
                                    >
                                        <Hash className="h-3 w-3 mr-1" />
                                        Mã SP: {data.sku || data.code || "N/A"}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="bg-purple-100 text-purple-700 border-purple-200"
                                    >
                                        ĐVT: {data.unit_name || "---"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t border-blue-200 pt-2 mt-1">
                            <span className="text-slate-600">
                                Số lượng hiện tại:
                            </span>
                            <span className="font-bold text-blue-600 text-lg">
                                {data.quantity}
                            </span>
                        </div>
                    </div>

                    {/* Change Preview */}
                    {formData.new_quantity !== data.quantity && (
                        <div
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border",
                                isIncrease
                                    ? "bg-green-50 border-green-200"
                                    : "bg-red-50 border-red-200",
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle
                                    className={cn(
                                        "h-4 w-4",
                                        isIncrease
                                            ? "text-green-600"
                                            : "text-red-600",
                                    )}
                                />
                                <span className="text-sm text-slate-700">
                                    Thay đổi:
                                </span>
                            </div>
                            <Badge
                                className={cn(
                                    isIncrease
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : "bg-red-100 text-red-700 border-red-200",
                                )}
                            >
                                {isIncrease ? "+" : ""}
                                {quantityChange}
                            </Badge>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* New Quantity */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 flex items-center gap-1">
                                <Package className="h-3.5 w-3.5 text-blue-600" />
                                Số lượng mới{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="new_quantity"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.new_quantity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            new_quantity:
                                                parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className="pl-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                Nhập số lượng mới sau khi điều chỉnh
                            </p>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 flex items-center gap-1">
                                <Info className="h-3.5 w-3.5 text-purple-600" />
                                Lý do điều chỉnh{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="reason"
                                    placeholder="VD: Kiểm kê, hàng hỏng, ..."
                                    value={formData.reason}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reason: e.target.value,
                                        })
                                    }
                                    className="pl-3 border-slate-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                                Ghi chú
                            </Label>
                            <Textarea
                                id="note"
                                placeholder="Ghi chú thêm (nếu có)"
                                value={formData.note}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        note: e.target.value,
                                    })
                                }
                                rows={3}
                                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Warning for large changes */}
                    {Math.abs(quantityChange) > 100 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                                Bạn đang điều chỉnh số lượng lớn. Vui lòng kiểm
                                tra kỹ trước khi xác nhận.
                            </p>
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
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="mr-2 h-4 w-4" />
                        Xác nhận điều chỉnh
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}