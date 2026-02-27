import React from "react";
import { Label } from "@/admin/components/ui/label";
import { Input } from "@/admin/components/ui/input";
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
    Wallet,
    User,
    Building2,
    FileText,
    CreditCard,
    Landmark,
    Clock,
    DollarSign,
    CheckCircle2, // ✅ Đã chuyển import lên đây (trước đây để cuối file gây lỗi)
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import SelectCombobox from "../../ui/select-combobox";

export default function VoucherGeneralInfo({
    formData,
    setFormData,
    errors = {},
    voucherDate,
    setVoucherDate,
    openVoucherDate,
    setOpenVoucherDate,
    handleChange,
    setErrors,
    type = "payment",
    partners = [],
    users = [],
    bankAccounts = [],
    isEdit = false,
}) {
    // ✅ Chỉ lấy số từ input số tiền
    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, "");
        handleChange("amount", rawValue);
    };

    // ✅ CheckCircle2 đã được import đúng ở trên
    const getStatusOptions = () => {
        return [
            { value: "draft", label: "Nháp", icon: Clock },
            { value: "confirmed", label: "Đã xác nhận", icon: CheckCircle2 },
        ];
    };

    // Format hiển thị số tiền
    const formatAmountDisplay = (value) => {
        if (!value) return "";
        return new Intl.NumberFormat("vi-VN").format(value);
    };

    // Format options cho partner select
    const partnerOptions =
        partners?.map((partner) => ({
            value: String(partner.id),
            label: partner.name,
        })) || [];

    // Format options cho user select
    const userOptions =
        users?.map((user) => ({
            value: String(user.id),
            label: user.name,
        })) || [];

    // Format options cho payment method
    const paymentMethodOptions = [
        { value: "cash", label: "Tiền mặt (TK 111)", icon: CreditCard },
        { value: "bank", label: "Chuyển khoản (TK 112)", icon: Landmark },
    ];

    // Xử lý thay đổi partner
    const handlePartnerChange = (value) => {
        const selectedPartner = partners?.find((p) => String(p.id) === value);

        handleChange("partner_id", parseInt(value));

        if (selectedPartner) {
            setFormData((prev) => ({
                ...prev,
                partner_info: selectedPartner,
                partner_code:
                    selectedPartner.code ||
                    selectedPartner.supplier_code ||
                    selectedPartner.customer_code ||
                    "",
            }));
        }
    };

    // Xử lý thay đổi payment method
    const handlePaymentMethodChange = (value) => {
        handleChange("payment_method", value);
    };

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-slate-800">
                            Thông tin phiếu {type === "payment" ? "chi" : "thu"}
                        </CardTitle>
                        <CardDescription>
                            Cập nhật thông tin cơ bản của phiếu{" "}
                            {type === "payment" ? "chi" : "thu"}
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
                    {/* Ngày chứng từ */}
                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                            Ngày {type === "payment" ? "chi" : "thu"}{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                            open={openVoucherDate}
                            onOpenChange={setOpenVoucherDate}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start font-normal border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all",
                                        !voucherDate && "text-muted-foreground",
                                        errors?.voucher_date &&
                                            "border-red-500 hover:border-red-500",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                    {voucherDate
                                        ? format(voucherDate, "dd/MM/yyyy", {
                                              locale: vi,
                                          })
                                        : `Chọn ngày ${type === "payment" ? "chi" : "thu"}`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-0 border-blue-200"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={voucherDate}
                                    defaultMonth={voucherDate || new Date()}
                                    captionLayout="dropdown"
                                    fromYear={2020}
                                    toYear={2030}
                                    onSelect={(date) => {
                                        if (!date) return;
                                        setVoucherDate(date);
                                        setOpenVoucherDate(false);
                                        setErrors((prev) => ({
                                            ...prev,
                                            voucher_date: null,
                                        }));
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors?.voucher_date && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                {errors.voucher_date}
                            </p>
                        )}
                    </div>

                    {/* Đối tác */}
                    <SelectCombobox
                        label={
                            type === "payment" ? "Nhà cung cấp" : "Khách hàng"
                        }
                        value={
                            formData.partner_id
                                ? String(formData.partner_id)
                                : ""
                        }
                        onChange={handlePartnerChange}
                        options={partnerOptions}
                        placeholder={`Chọn ${type === "payment" ? "nhà cung cấp" : "khách hàng"}`}
                        searchPlaceholder={`Tìm ${type === "payment" ? "nhà cung cấp" : "khách hàng"}...`}
                        error={errors?.partner_id}
                        required
                        icon={<Building2 className="h-4 w-4 text-blue-600" />}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Số tiền */}
                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                            Số tiền <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={formatAmountDisplay(formData.amount)}
                                onChange={handleAmountChange}
                                placeholder="Nhập số tiền"
                                className={cn(
                                    "pr-12 border-slate-200 focus:border-green-500 focus:ring-green-500",
                                    errors?.amount &&
                                        "border-red-500 focus:border-red-500",
                                )}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
                                VNĐ
                            </span>
                        </div>
                        {errors?.amount && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                {errors.amount}
                            </p>
                        )}
                    </div>

                    {/* Người phụ trách */}
                    <SelectCombobox
                        label="Người phụ trách"
                        value={formData.user_id ? String(formData.user_id) : ""}
                        onChange={(value) =>
                            handleChange("user_id", parseInt(value))
                        }
                        options={userOptions}
                        placeholder="Chọn người phụ trách"
                        searchPlaceholder="Tìm người phụ trách..."
                        error={errors?.user_id}
                        required
                        icon={<User className="h-4 w-4 text-purple-600" />}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Phương thức thanh toán */}
                    <SelectCombobox
                        label="Phương thức thanh toán"
                        value={formData.payment_method || "cash"}
                        onChange={handlePaymentMethodChange}
                        options={paymentMethodOptions}
                        placeholder="Chọn phương thức"
                        searchPlaceholder="Tìm phương thức..."
                        icon={<CreditCard className="h-4 w-4 text-blue-600" />}
                    />

                    {/* Trạng thái */}
                    <SelectCombobox
                        label="Trạng thái"
                        value={formData.status || "draft"}
                        onChange={(value) => handleChange("status", value)}
                        options={getStatusOptions()}
                        placeholder="Chọn trạng thái"
                        searchPlaceholder="Tìm trạng thái..."
                        icon={<Clock className="h-4 w-4 text-purple-600" />}
                    />
                </div>

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
                        placeholder={`Nhập ghi chú cho phiếu ${type === "payment" ? "chi" : "thu"}`}
                        rows={3}
                        className={cn(
                            "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                            errors?.note &&
                                "border-red-500 focus:border-red-500",
                        )}
                    />
                    {errors?.note && (
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