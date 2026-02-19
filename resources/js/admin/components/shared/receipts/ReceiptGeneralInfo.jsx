import React from "react";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
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
import {
    CalendarIcon,
    Info,
    Truck,
    User,
    ShoppingCart,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Building2,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import SelectCombobox from "../../ui/select-combobox";

export default function ReceiptGeneralInfo({
    formData,
    setFormData,
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
    isEdit = false,
    children,
}) {
    // Format options cho supplier/customer
    const partnerOptions =
        (type === "purchase" ? suppliers : customers)?.map((item) => ({
            value: String(item.id),
            label: item.name,
        })) || [];

    // Format options cho user
    const userOptions =
        users?.map((user) => ({
            value: String(user.id),
            label: user.name,
        })) || [];

    const getStatusOptions = () => {
        const options = [
            { value: "draft", label: "Nháp" },
            { value: "confirmed", label: "Đã xác nhận" },
            { value: "cancelled", label: "Đã hủy" },
        ];
        
        // Thêm icon tương ứng
        return options.map(opt => ({
            ...opt,
            icon: opt.value === "draft" ? Clock : opt.value === "confirmed" ? CheckCircle2 : XCircle
        }));
    };

    // Xử lý thay đổi partner
    const handlePartnerChange = (value) => {
        const fieldName = type === "purchase" ? "supplier_id" : "customer_id";
        handleChange(fieldName, value ? parseInt(value) : null);

        const selectedPartner = (
            type === "purchase" ? suppliers : customers
        )?.find((p) => String(p.id) === value);

        if (selectedPartner) {
            setFormData?.((prev) => ({
                ...prev,
                partner_info: selectedPartner,
            }));
        }
    };

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-slate-800">
                            Thông tin chung
                        </CardTitle>
                        <CardDescription>
                            Cập nhật thông tin cơ bản của phiếu{" "}
                            {type === "purchase" ? "nhập" : "xuất"}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                {/* Alert */}
                <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm text-slate-700">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p>
                        Các trường có dấu{" "}
                        <Badge
                            variant="outline"
                            className="bg-red-100 text-red-600 border-red-200 mx-1 px-1.5"
                        >
                            *
                        </Badge>{" "}
                        là bắt buộc nhập
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Ngày nhập/xuất */}
                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
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
                                        "w-full justify-start font-normal border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all",
                                        !receiptDate && "text-muted-foreground",
                                        errors.receipt_date &&
                                            "border-red-500 hover:border-red-500",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                    {receiptDate
                                        ? format(receiptDate, "dd/MM/yyyy", {
                                              locale: vi,
                                          })
                                        : `Chọn ngày ${type === "purchase" ? "nhập" : "xuất"}`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-0 border-blue-200"
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
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                {errors.receipt_date}
                            </p>
                        )}
                    </div>

                    {/* Nhà cung cấp hoặc Khách hàng */}
                    <SelectCombobox
                        label={type === "purchase" ? "Nhà cung cấp" : "Khách hàng"}
                        value={String(
                            type === "purchase"
                                ? formData.supplier_id || ""
                                : formData.customer_id || "",
                        )}
                        onChange={handlePartnerChange}
                        options={partnerOptions}
                        placeholder={`Chọn ${type === "purchase" ? "nhà cung cấp" : "khách hàng"}`}
                        searchPlaceholder={`Tìm ${type === "purchase" ? "nhà cung cấp" : "khách hàng"}...`}
                        error={
                            errors[
                                type === "purchase"
                                    ? "supplier_id"
                                    : "customer_id"
                            ]
                        }
                        required
                        icon={
                            type === "purchase" ? (
                                <Truck className="h-4 w-4" />
                            ) : (
                                <ShoppingCart className="h-4 w-4" />
                            )
                        }
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* User phụ trách */}
                    <SelectCombobox
                        label="Người phụ trách"
                        value={formData.user_id ? String(formData.user_id) : ""}
                        onChange={(value) => handleChange("user_id", value ? parseInt(value) : null)}
                        options={userOptions}
                        placeholder="Chọn người phụ trách"
                        searchPlaceholder="Tìm người phụ trách..."
                        error={errors.user_id}
                        required
                        icon={<User className="h-4 w-4" />}
                    />

                    {/* Trạng thái */}
                    <SelectCombobox
                        label="Trạng thái"
                        value={formData.status || (isEdit ? "confirmed" : "draft")}
                        onChange={(value) => handleChange("status", value)}
                        options={getStatusOptions()}
                        placeholder="Chọn trạng thái"
                        searchPlaceholder="Tìm trạng thái..."
                        error={errors.status}
                        icon={<Clock className="h-4 w-4" />}
                    />
                </div>

                {/* Render children ở đây - có thể là bảng giá hoặc các field khác */}
                {children && <div className="space-y-4">{children}</div>}

                {/* Ghi chú */}
                <div className="space-y-2">
                    <Label
                        htmlFor="note"
                        className="text-slate-700 flex items-center gap-1"
                    >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        Ghi chú
                    </Label>
                    <Textarea
                        id="note"
                        value={formData.note || ""}
                        onChange={(e) => handleChange("note", e.target.value)}
                        placeholder={`Nhập ghi chú cho phiếu ${type === "purchase" ? "nhập" : "xuất"}`}
                        rows={3}
                        className={cn(
                            "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                            errors.note &&
                                "border-red-500 focus:border-red-500",
                        )}
                    />
                    {errors.note && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {errors.note}
                        </p>
                    )}
                </div>

                {/* Partner Info Preview */}
                {formData.partner_info && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-700">
                                {formData.partner_info.name}
                            </span>
                            {formData.partner_info.tax_code && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                    MST: {formData.partner_info.tax_code}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}