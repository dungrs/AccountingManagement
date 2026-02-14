import React from "react";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Button } from "@/admin/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/admin/components/ui/popover";
import { Calendar } from "@/admin/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { CalendarIcon, Info } from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function ReceiptGeneralInfo({
    formData,
    errors,
    receiptDate,
    setReceiptDate,
    openReceiptDate,
    setOpenReceiptDate,
    handleChange,
    setErrors,
    type = "purchase",
    suppliers = [],
    customers = [],
    users = [], // 👈 thêm dòng này
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
                <CardDescription>
                    Cập nhật thông tin cơ bản của phiếu{" "}
                    {type === "purchase" ? "nhập" : "xuất"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                        Các trường có dấu (*) là bắt buộc nhập
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {/* Ngày nhập/xuất */}
                    <div className="space-y-2">
                        <Label>
                            Ngày {type === "purchase" ? "nhập" : "xuất"}{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                            open={openReceiptDate}
                            onOpenChange={setOpenReceiptDate}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start font-normal",
                                        !receiptDate && "text-muted-foreground",
                                        errors.receipt_date && "border-red-500",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {receiptDate
                                        ? format(receiptDate, "dd/MM/yyyy", {
                                              locale: vi,
                                          })
                                        : `Chọn ngày ${type === "purchase" ? "nhập" : "xuất"}`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={receiptDate}
                                    defaultMonth={receiptDate || new Date()}
                                    captionLayout="dropdown"
                                    fromYear={2020}
                                    toYear={2030}
                                    onSelect={(date) => {
                                        if (!date) return;
                                        setReceiptDate(date);
                                        setOpenReceiptDate(false);
                                        setErrors((prev) => ({
                                            ...prev,
                                            receipt_date: null,
                                        }));
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.receipt_date && (
                            <p className="text-xs text-red-500">
                                {errors.receipt_date}
                            </p>
                        )}
                    </div>

                    {/* Nhà cung cấp hoặc Khách hàng */}
                    <div className="space-y-2">
                        <Label>
                            {type === "purchase"
                                ? "Nhà cung cấp"
                                : "Khách hàng"}{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={String(
                                type === "purchase"
                                    ? formData.supplier_id
                                    : formData.customer_id,
                            )}
                            onValueChange={(value) =>
                                handleChange(
                                    type === "purchase"
                                        ? "supplier_id"
                                        : "customer_id",
                                    parseInt(value),
                                )
                            }
                        >
                            <SelectTrigger
                                className={cn(
                                    errors[
                                        type === "purchase"
                                            ? "supplier_id"
                                            : "customer_id"
                                    ] && "border-red-500",
                                )}
                            >
                                <SelectValue
                                    placeholder={`Chọn ${type === "purchase" ? "nhà cung cấp" : "khách hàng"}`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {(type === "purchase"
                                    ? suppliers
                                    : customers
                                )?.map((item) => (
                                    <SelectItem
                                        key={item.id}
                                        value={String(item.id)}
                                    >
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors[
                            type === "purchase" ? "supplier_id" : "customer_id"
                        ] && (
                            <p className="text-xs text-red-500">
                                {
                                    errors[
                                        type === "purchase"
                                            ? "supplier_id"
                                            : "customer_id"
                                    ]
                                }
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* User phụ trách */}
                    <div className="space-y-2">
                        <Label>
                            Người phụ trách{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={
                                formData.user_id ? String(formData.user_id) : ""
                            }
                            onValueChange={(value) =>
                                handleChange("user_id", parseInt(value))
                            }
                        >
                            <SelectTrigger
                                className={cn(
                                    errors.user_id && "border-red-500",
                                )}
                            >
                                <SelectValue placeholder="Chọn người phụ trách" />
                            </SelectTrigger>
                            <SelectContent>
                                {users?.map((user) => (
                                    <SelectItem
                                        key={user.id}
                                        value={String(user.id)}
                                    >
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.user_id && (
                            <p className="text-xs text-red-500">
                                {errors.user_id}
                            </p>
                        )}
                    </div>

                    {/* Tình trạng */}
                    <div className="space-y-2">
                        <Label>Trạng thái</Label>
                        <Select
                            value={formData.status || "draft"}
                            onValueChange={(value) =>
                                handleChange("status", value)
                            }
                        >
                            <SelectTrigger
                                className={cn(
                                    errors.status && "border-red-500",
                                )}
                            >
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Nháp</SelectItem>
                                <SelectItem value="confirmed">
                                    Đã xác nhận
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    Đã huỷ
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-xs text-red-500">
                                {errors.status}
                            </p>
                        )}
                    </div>
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú</Label>
                    <Textarea
                        id="note"
                        value={formData.note}
                        onChange={(e) => handleChange("note", e.target.value)}
                        placeholder={`Nhập ghi chú cho phiếu ${type === "purchase" ? "nhập" : "xuất"}`}
                        rows={3}
                        className={cn(errors.note && "border-red-500")}
                    />
                    {errors.note && (
                        <p className="text-xs text-red-500">{errors.note}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
