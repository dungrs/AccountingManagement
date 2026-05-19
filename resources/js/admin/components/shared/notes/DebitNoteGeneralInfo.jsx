import React, { memo, useCallback, useMemo } from "react";
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
    FileDown,
    User,
    Building2,
    Users,
    FileText,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import SelectCombobox from "../../ui/select-combobox";

const DebitNoteGeneralInfo = memo(
    ({
        formData,
        setFormData,
        errors = {},
        issueDate,
        setIssueDate,
        openIssueDate,
        setOpenIssueDate,
        handleChange,
        setErrors,
        customers = [],
        suppliers = [],
        users = [],
        isEdit = false,
    }) => {
        // Xử lý số tiền
        const handleAmountChange = useCallback(
            (e) => {
                const rawValue = e.target.value.replace(/[^0-9]/g, "");
                handleChange("amount", rawValue);
                // Cập nhật total_amount bằng amount (không có VAT)
                if (rawValue) {
                    const amount = parseFloat(rawValue) || 0;
                    handleChange("total_amount", amount);
                } else {
                    handleChange("total_amount", 0);
                }
            },
            [handleChange],
        );

        const formatAmountDisplay = useCallback((value) => {
            if (!value) return "";
            return new Intl.NumberFormat("vi-VN").format(value);
        }, []);

        const getStatusOptions = useCallback(() => {
            return [
                { value: "draft", label: "Nháp", icon: Clock },
                {
                    value: "confirmed",
                    label: "Đã xác nhận",
                    icon: CheckCircle2,
                },
            ];
        }, []);

        const getTypeOptions = useCallback(() => {
            return [
                {
                    value: "sales_return",
                    label: "Hàng bán trả lại",
                    icon: AlertCircle,
                },
                {
                    value: "discount_after",
                    label: "Chiết khấu thương mại",
                    icon: AlertCircle,
                },
                {
                    value: "price_adjustment",
                    label: "Điều chỉnh giá",
                    icon: AlertCircle,
                },
                { value: "penalty", label: "Phạt hợp đồng", icon: AlertCircle },
                { value: "interest", label: "Lãi quá hạn", icon: AlertCircle },
                { value: "other", label: "Khác", icon: FileText },
            ];
        }, []);

        const customerOptions = useMemo(
            () =>
                customers?.map((customer) => ({
                    value: String(customer.id),
                    label: customer.name,
                    tax_code: customer.tax_code,
                })) || [],
            [customers],
        );

        const supplierOptions = useMemo(
            () =>
                suppliers?.map((supplier) => ({
                    value: String(supplier.id),
                    label: supplier.name,
                    tax_code: supplier.tax_code,
                })) || [],
            [suppliers],
        );

        const userOptions = useMemo(
            () =>
                users?.map((user) => ({
                    value: String(user.id),
                    label: user.name,
                })) || [],
            [users],
        );

        const handleCustomerChange = useCallback(
            (value) => {
                const selectedCustomer = customers?.find(
                    (c) => String(c.id) === value,
                );
                handleChange("customer_id", parseInt(value));
                handleChange("supplier_id", null);
                if (selectedCustomer) {
                    setFormData((prev) => ({
                        ...prev,
                        party_info: selectedCustomer,
                        party_type: "customer",
                    }));
                }
            },
            [customers, handleChange, setFormData],
        );

        const handleSupplierChange = useCallback(
            (value) => {
                const selectedSupplier = suppliers?.find(
                    (s) => String(s.id) === value,
                );
                handleChange("supplier_id", parseInt(value));
                handleChange("customer_id", null);
                if (selectedSupplier) {
                    setFormData((prev) => ({
                        ...prev,
                        party_info: selectedSupplier,
                        party_type: "supplier",
                    }));
                }
            },
            [suppliers, handleChange, setFormData],
        );

        const hasCustomer = formData.customer_id && !formData.supplier_id;
        const hasSupplier = formData.supplier_id && !formData.customer_id;
        const selectedPartyId = hasCustomer
            ? formData.customer_id
            : hasSupplier
              ? formData.supplier_id
              : "";
        const partyIcon = formData.customer_id ? Users : Building2;

        return (
            <Card className="border-slate-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <FileDown className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">
                                Thông tin giấy báo nợ
                            </CardTitle>
                            <CardDescription>
                                Cập nhật thông tin cơ bản của giấy báo nợ
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
                            </Badge>
                            là bắt buộc nhập
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-700 flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                                Ngày lập <span className="text-red-500">*</span>
                            </Label>
                            <Popover
                                open={openIssueDate}
                                onOpenChange={setOpenIssueDate}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start font-normal border-slate-200",
                                            !issueDate &&
                                                "text-muted-foreground",
                                            errors?.issue_date &&
                                                "border-red-500",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                        {issueDate
                                            ? format(issueDate, "dd/MM/yyyy", {
                                                  locale: vi,
                                              })
                                            : "Chọn ngày lập"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0 border-blue-200"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={issueDate}
                                        defaultMonth={issueDate || new Date()}
                                        captionLayout="dropdown"
                                        fromYear={2020}
                                        toYear={2030}
                                        onSelect={(date) => {
                                            if (!date) return;
                                            setIssueDate(date);
                                            setOpenIssueDate(false);
                                            setErrors((prev) => ({
                                                ...prev,
                                                issue_date: null,
                                            }));
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors?.issue_date && (
                                <p className="text-xs text-red-500">
                                    {errors.issue_date}
                                </p>
                            )}
                        </div>

                        <SelectCombobox
                            label="Loại chứng từ"
                            value={formData.type || "other"}
                            onChange={(value) => handleChange("type", value)}
                            options={getTypeOptions()}
                            placeholder="Chọn loại chứng từ"
                            required
                            icon={
                                <FileText className="h-4 w-4 text-orange-600" />
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectCombobox
                            label="Khách hàng"
                            value={hasCustomer ? String(selectedPartyId) : ""}
                            onChange={handleCustomerChange}
                            options={customerOptions}
                            placeholder="Chọn khách hàng"
                            icon={<Users className="h-4 w-4 text-blue-600" />}
                        />

                        <SelectCombobox
                            label="Nhà cung cấp"
                            value={hasSupplier ? String(selectedPartyId) : ""}
                            onChange={handleSupplierChange}
                            options={supplierOptions}
                            placeholder="Chọn nhà cung cấp"
                            icon={
                                <Building2 className="h-4 w-4 text-purple-600" />
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                        "pr-12",
                                        errors?.amount && "border-red-500",
                                    )}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                    VNĐ
                                </span>
                            </div>
                            {errors?.amount && (
                                <p className="text-xs text-red-500">
                                    {errors.amount}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700 flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                                Tổng tiền
                            </Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    value={formatAmountDisplay(
                                        formData.total_amount ||
                                            formData.amount ||
                                            0,
                                    )}
                                    readOnly
                                    className="bg-slate-50 text-purple-700 font-semibold pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                    VNĐ
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectCombobox
                            label="Người tạo"
                            value={
                                formData.created_by
                                    ? String(formData.created_by)
                                    : ""
                            }
                            onChange={(value) =>
                                handleChange("created_by", parseInt(value))
                            }
                            options={userOptions}
                            placeholder="Chọn người tạo"
                            required
                            icon={<User className="h-4 w-4 text-purple-600" />}
                        />

                        <SelectCombobox
                            label="Trạng thái"
                            value={formData.status || "draft"}
                            onChange={(value) => handleChange("status", value)}
                            options={getStatusOptions()}
                            placeholder="Chọn trạng thái"
                            icon={<Clock className="h-4 w-4 text-purple-600" />}
                        />
                    </div>

                    {isEdit && (
                        <div className="space-y-2">
                            <Label className="text-slate-700 flex items-center gap-1">
                                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                                Mã chứng từ
                            </Label>
                            <Input
                                type="text"
                                value={formData.code || ""}
                                readOnly
                                className="bg-slate-50 font-mono"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label
                            htmlFor="reason"
                            className="text-slate-700 flex items-center gap-1"
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                            Lý do <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            value={formData.reason || ""}
                            onChange={(e) =>
                                handleChange("reason", e.target.value)
                            }
                            placeholder="Nhập lý do lập giấy báo nợ..."
                            rows={3}
                            className={errors?.reason && "border-red-500"}
                        />
                        {errors?.reason && (
                            <p className="text-xs text-red-500">
                                {errors.reason}
                            </p>
                        )}
                    </div>

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
                            onChange={(e) =>
                                handleChange("note", e.target.value)
                            }
                            placeholder="Nhập ghi chú cho giấy báo nợ..."
                            rows={2}
                        />
                    </div>

                    {formData.party_info && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-sm">
                                {React.createElement(partyIcon, {
                                    className: "h-4 w-4 text-blue-600",
                                })}
                                <span className="font-medium text-slate-700">
                                    {formData.party_info.name}
                                </span>
                                {formData.party_info.tax_code && (
                                    <Badge className="bg-purple-100 text-purple-700">
                                        MST: {formData.party_info.tax_code}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    },
);

DebitNoteGeneralInfo.displayName = "DebitNoteGeneralInfo";

export default DebitNoteGeneralInfo;