import React from "react";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Button } from "@/admin/components/ui/button";
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
import SelectCombobox from "../../ui/select-combobox";

export default function ReceiptGeneralInfo({
    formData,
    setFormData, // Thêm setFormData
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
    users = [],
    isEdit = false, // Thêm prop isEdit
}) {
    // Format options cho supplier/customer
    const partnerOptions = (type === "purchase" ? suppliers : customers)?.map(
        (item) => ({
            value: String(item.id),
            label: item.name,
        })
    ) || [];

    // Format options cho user
    const userOptions = users?.map((user) => ({
        value: String(user.id),
        label: user.name,
    })) || [];

    // Format options cho status - dựa vào mode (create/edit)
    const getStatusOptions = () => {
        // Nếu là edit mode, chỉ hiển thị "Đã xác nhận" và "Đã hủy"
        if (isEdit) {
            return [
                { value: "confirmed", label: "Đã xác nhận" },
                { value: "cancelled", label: "Đã hủy" },
            ];
        }
        
        // Nếu là create mode, hiển thị "Nháp" và "Đã xác nhận"
        return [
            { value: "draft", label: "Nháp" },
            { value: "confirmed", label: "Đã xác nhận" },
        ];
    };

    // Xử lý thay đổi partner
    const handlePartnerChange = (value) => {
        const fieldName = type === "purchase" ? "supplier_id" : "customer_id";
        handleChange(fieldName, parseInt(value));
        
        // Cập nhật thêm partner_info nếu cần
        const selectedPartner = (type === "purchase" ? suppliers : customers)?.find(
            (p) => String(p.id) === value
        );
        
        if (selectedPartner) {
            setFormData?.(prev => ({
                ...prev,
                partner_info: selectedPartner,
            }));
        }
    };

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

                    {/* Nhà cung cấp hoặc Khách hàng - Sử dụng SelectCombobox */}
                    <SelectCombobox
                        label={type === "purchase" ? "Nhà cung cấp" : "Khách hàng"}
                        value={String(
                            type === "purchase"
                                ? formData.supplier_id || ""
                                : formData.customer_id || ""
                        )}
                        onChange={handlePartnerChange}
                        options={partnerOptions}
                        placeholder={`Chọn ${type === "purchase" ? "nhà cung cấp" : "khách hàng"}`}
                        searchPlaceholder={`Tìm ${type === "purchase" ? "nhà cung cấp" : "khách hàng"}...`}
                        error={errors[type === "purchase" ? "supplier_id" : "customer_id"]}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* User phụ trách - Sử dụng SelectCombobox */}
                    <SelectCombobox
                        label="Người phụ trách"
                        value={formData.user_id ? String(formData.user_id) : ""}
                        onChange={(value) => handleChange("user_id", parseInt(value))}
                        options={userOptions}
                        placeholder="Chọn người phụ trách"
                        searchPlaceholder="Tìm người phụ trách..."
                        error={errors.user_id}
                        required
                    />

                    {/* Trạng thái - Sử dụng SelectCombobox với options động */}
                    <SelectCombobox
                        label="Trạng thái"
                        value={formData.status || (isEdit ? "confirmed" : "draft")}
                        onChange={(value) => handleChange("status", value)}
                        options={getStatusOptions()}
                        placeholder="Chọn trạng thái"
                        searchPlaceholder="Tìm trạng thái..."
                        error={errors.status}
                    />
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú</Label>
                    <Textarea
                        id="note"
                        value={formData.note || ""}
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