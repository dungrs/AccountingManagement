import React from "react";
import { Label } from "@/admin/components/ui/label";
import { Input } from "@/admin/components/ui/input";
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
    isEdit = false,  // Thêm prop này với giá trị mặc định là false
}) {
    // Format số tiền khi nhập
    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, "");
        handleChange("amount", rawValue);
    };

    const getStatusOptions = () => {
        // Nếu là edit mode, chỉ hiển thị "Đã xác nhận"
        if (isEdit) {
            return [{ value: "confirmed", label: "Đã xác nhận" }];
        }

        // Nếu là create mode, hiển thị cả 2 option
        return [
            { value: "draft", label: "Nháp" },
            { value: "confirmed", label: "Đã xác nhận" },
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
        { value: "cash", label: "Tiền mặt (TK 111)" },
        { value: "bank", label: "Chuyển khoản (TK 112)" },
    ];

    // Xử lý thay đổi partner
    const handlePartnerChange = (value) => {
        const selectedPartner = partners?.find((p) => String(p.id) === value);

        // Cập nhật partner_id
        handleChange("partner_id", parseInt(value));

        // Cập nhật partner_info với đầy đủ thông tin
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
        // Không cần reset bank_account_id nữa
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Thông tin phiếu {type === "payment" ? "chi" : "thu"}
                </CardTitle>
                <CardDescription>
                    Cập nhật thông tin cơ bản của phiếu{" "}
                    {type === "payment" ? "chi" : "thu"}
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
                    {/* Ngày chứng từ */}
                    <div className="space-y-2">
                        <Label>
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
                                        "w-full justify-start font-normal",
                                        !voucherDate && "text-muted-foreground",
                                        errors?.voucher_date &&
                                            "border-red-500",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {voucherDate
                                        ? format(voucherDate, "dd/MM/yyyy", {
                                              locale: vi,
                                          })
                                        : `Chọn ngày ${type === "payment" ? "chi" : "thu"}`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-0"
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
                            <p className="text-xs text-red-500">
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
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Số tiền */}
                    <div className="space-y-2">
                        <Label>
                            Số tiền <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={formatAmountDisplay(formData.amount)}
                                onChange={handleAmountChange}
                                placeholder="Nhập số tiền"
                                className={cn(
                                    "pr-12",
                                    errors?.amount && "border-red-500",
                                )}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                VNĐ
                            </span>
                        </div>
                        {errors?.amount && (
                            <p className="text-xs text-red-500">
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
                    />
                    {/* Trạng thái */}
                    <SelectCombobox
                        label="Trạng thái"
                        value={formData.status || "draft"}
                        onChange={(value) => handleChange("status", value)}
                        options={getStatusOptions()}
                        placeholder="Chọn trạng thái"
                        searchPlaceholder="Tìm trạng thái..."
                    />
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú</Label>
                    <Textarea
                        id="note"
                        value={formData.note || ""}
                        onChange={(e) => handleChange("note", e.target.value)}
                        placeholder={`Nhập ghi chú cho phiếu ${type === "payment" ? "chi" : "thu"}`}
                        rows={3}
                        className={cn(errors?.note && "border-red-500")}
                    />
                    {errors?.note && (
                        <p className="text-xs text-red-500">{errors.note}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
