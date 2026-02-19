"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage, router } from "@inertiajs/react";

import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
import { Label } from "@/admin/components/ui/label";
import { Badge } from "@/admin/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Separator } from "@/admin/components/ui/separator";
import {
    Plus,
    Trash2,
    Truck,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    Hash,
    CreditCard,
    Info,
    Save,
    X,
} from "lucide-react";

import SelectCombobox from "@/admin/components/ui/select-combobox";
import { useEventBus } from "@/EventBus";
import ImageUpload from "@/admin/components/shared/upload/ImageUpload";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";

export default function SupplierForm() {
    const {
        banks,
        supplier,
        provinces,
        flash,
        errors: serverErrors,
    } = usePage().props;

    const { emit } = useEventBus();
    const isEdit = !!supplier;

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [wards, setWards] = useState([]);
    const [loadingWard, setLoadingWard] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [formData, setFormData] = useState({
        supplier_code: "",
        name: "",
        tax_code: "",
        province_id: "",
        ward_id: "",
        address: "",
        phone: "",
        fax: "",
        email: "",
        avatar: "",
        description: "",
        publish: true,
        bank_accounts: [],
    });

    useEffect(() => {
        if (supplier && !isInitialized) {
            setFormData({
                supplier_code: supplier.supplier_code || "",
                name: supplier.name || "",
                tax_code: supplier.tax_code || "",
                province_id: supplier.province_id?.toString() || "",
                ward_id: supplier.ward_id?.toString() || "",
                address: supplier.address || "",
                phone: supplier.phone || "",
                fax: supplier.fax || "",
                email: supplier.email || "",
                avatar: supplier.avatar || "",
                description: supplier.description || "",
                publish: supplier.publish === 1 || supplier.publish === true,
                bank_accounts: supplier.bank_accounts || [],
            });

            if (supplier.province_id) {
                fetchWardsByProvince(String(supplier.province_id));
            }

            setIsInitialized(true);
        }
    }, [supplier, isInitialized]);

    useEffect(() => {
        if (flash?.error) emit("toast:error", flash.error);
    }, [flash, emit]);

    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
        }
    }, [serverErrors]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleProvinceChange = (provinceId) => {
        const id = String(provinceId);

        setFormData((prev) => ({
            ...prev,
            province_id: id,
            ward_id: "",
        }));

        setErrors((prev) => ({
            ...prev,
            province_id: null,
            ward_id: null,
        }));

        fetchWardsByProvince(id);
    };

    const fetchWardsByProvince = async (provinceId) => {
        if (!provinceId) {
            setWards([]);
            return;
        }

        setLoadingWard(true);
        setWards([]);

        try {
            const res = await axios.post(route("location.getLocation"), {
                params: {
                    data: {
                        location_id: provinceId,
                    },
                    target: "wards",
                },
            });
            setWards(res.data?.data || []);
        } catch (error) {
            console.error("Fetch wards error:", error);
            toast.error("Không thể tải danh sách phường/xã");
            setWards([]);
        } finally {
            setLoadingWard(false);
        }
    };

    const addBankAccount = () => {
        setFormData((prev) => ({
            ...prev,
            bank_accounts: [
                ...prev.bank_accounts,
                {
                    supplier_code: prev.supplier_code,
                    bank_code: "",
                    account_number: "",
                },
            ],
        }));
    };

    const removeBankAccount = (index) => {
        setFormData((prev) => ({
            ...prev,
            bank_accounts: prev.bank_accounts.filter((_, i) => i !== index),
        }));

        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`bank_accounts.${index}.bank_code`];
            delete newErrors[`bank_accounts.${index}.account_number`];
            return newErrors;
        });
    };

    const updateBankAccount = (index, field, value) => {
        setFormData((prev) => {
            const newAccounts = [...prev.bank_accounts];
            newAccounts[index] = { ...newAccounts[index], [field]: value };
            return { ...prev, bank_accounts: newAccounts };
        });

        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`bank_accounts.${index}.${field}`];
            return newErrors;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setErrors({});
        setIsSubmitting(true);

        const submitData = {
            supplier_code: formData.supplier_code,
            name: formData.name,
            tax_code: formData.tax_code,
            province_id: formData.province_id,
            ward_id: formData.ward_id,
            address: formData.address,
            phone: formData.phone,
            fax: formData.fax,
            email: formData.email,
            avatar: formData.avatar,
            description: formData.description,
            publish: formData.publish ? 1 : 0,
            bank_accounts: formData.bank_accounts,
        };

        const submitRoute = isEdit
            ? route("admin.supplier.update", supplier.id)
            : route("admin.supplier.store");

        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            preserveState: true,

            onSuccess: () => {
                setErrors({});
                toast.success(
                    isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!",
                );
            },

            onError: (errors) => {
                setErrors(errors);

                if (
                    errors.bank_accounts ||
                    Object.keys(errors).some((key) =>
                        key.startsWith("bank_accounts."),
                    )
                ) {
                    emit(
                        "toast:error",
                        "Vui lòng kiểm tra lại thông tin tài khoản ngân hàng!",
                    );
                }

                if (Object.keys(errors).length > 0) {
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                }
            },

            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const bankOptions =
        banks
            ?.filter((bank) => bank.publish === 1)
            ?.map((bank) => {
                const fullLabel = `${bank.short_name} - ${bank.name}`;
                return {
                    value: bank.bank_code,
                    label: fullLabel,
                };
            }) || [];

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                { label: "Nhà cung cấp", link: route("admin.supplier.index") },
                {
                    label: isEdit
                        ? "Chỉnh sửa nhà cung cấp"
                        : "Thêm mới nhà cung cấp",
                },
            ]}
        >
            <Head
                title={isEdit ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp"}
            />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Mã NCC
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                                {formData.supplier_code || "Chưa có"}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Hash className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tài khoản NH
                            </p>
                            <p className="text-lg font-bold text-purple-600">
                                {formData.bank_accounts?.length || 0}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Trạng thái
                            </p>
                            <Badge
                                className={cn(
                                    "mt-1",
                                    formData.publish
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200",
                                )}
                            >
                                {formData.publish
                                    ? "Đang hoạt động"
                                    : "Ngừng hoạt động"}
                            </Badge>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Truck className="h-5 w-5 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Thông tin nhà cung cấp */}
                            <Card className="border-slate-200 shadow-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-slate-800">
                                                Thông tin nhà cung cấp
                                            </CardTitle>
                                            <CardDescription>
                                                {isEdit
                                                    ? "Cập nhật thông tin nhà cung cấp"
                                                    : "Nhập đầy đủ thông tin bên dưới"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                                                Tên nhà cung cấp{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                value={formData.name}
                                                maxLength={150}
                                                onChange={(e) => {
                                                    handleChange(
                                                        "name",
                                                        e.target.value,
                                                    );
                                                }}
                                                placeholder="Nhập tên đầy đủ..."
                                                className={cn(
                                                    "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                                    errors.name &&
                                                        "border-red-500 focus:border-red-500",
                                                )}
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-700 flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5 text-purple-600" />
                                                Số điện thoại{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    handleChange(
                                                        "phone",
                                                        e.target.value,
                                                    );
                                                }}
                                                placeholder="VD: 024 3xxx xxxx"
                                                className={cn(
                                                    "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                                                    errors.phone &&
                                                        "border-red-500 focus:border-red-500",
                                                )}
                                            />
                                            {errors.phone && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 flex items-center gap-1">
                                                <Hash className="h-3.5 w-3.5 text-blue-600" />
                                                Mã số thuế{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                value={formData.tax_code}
                                                maxLength={13}
                                                onChange={(e) => {
                                                    handleChange(
                                                        "tax_code",
                                                        e.target.value,
                                                    );
                                                }}
                                                placeholder="Nhập 13 ký tự"
                                                className={cn(
                                                    "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                                    errors.tax_code &&
                                                        "border-red-500 focus:border-red-500",
                                                )}
                                            />
                                            {errors.tax_code && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {errors.tax_code}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-700 flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5 text-purple-600" />
                                                Email
                                            </Label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => {
                                                    handleChange(
                                                        "email",
                                                        e.target.value,
                                                    );
                                                }}
                                                placeholder="example@company.vn"
                                                className={cn(
                                                    "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                                                    errors.email &&
                                                        "border-red-500 focus:border-red-500",
                                                )}
                                            />
                                            {errors.email && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 flex items-center gap-1">
                                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                                                Fax
                                            </Label>
                                            <Input
                                                value={formData.fax}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "fax",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Tùy chọn"
                                                className={cn(
                                                    "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                                    errors.fax &&
                                                        "border-red-500 focus:border-red-500",
                                                )}
                                            />
                                            {errors.fax && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {errors.fax}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent" />

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <SelectCombobox
                                                label="Tỉnh/Thành phố"
                                                value={formData.province_id}
                                                onChange={handleProvinceChange}
                                                options={provinces.map((p) => ({
                                                    value: p.province_code,
                                                    label: p.name,
                                                }))}
                                                placeholder="Chọn Tỉnh/Thành phố..."
                                                searchPlaceholder="Tìm kiếm tỉnh/thành phố..."
                                                error={errors.province_id}
                                                icon={
                                                    <MapPin className="h-4 w-4 text-blue-600" />
                                                }
                                            />

                                            <SelectCombobox
                                                label="Phường/Xã"
                                                value={formData.ward_id}
                                                onChange={(v) =>
                                                    handleChange("ward_id", v)
                                                }
                                                options={wards}
                                                disabled={
                                                    !formData.province_id ||
                                                    loadingWard
                                                }
                                                placeholder={
                                                    loadingWard
                                                        ? "Đang tải..."
                                                        : !formData.province_id
                                                          ? "Chọn Tỉnh/Thành phố trước"
                                                          : "Chọn Phường/Xã..."
                                                }
                                                searchPlaceholder="Tìm kiếm phường/xã..."
                                                error={errors.ward_id}
                                                icon={
                                                    <MapPin className="h-4 w-4 text-purple-600" />
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-700 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                Địa chỉ chi tiết
                                            </Label>
                                            <Input
                                                value={formData.address}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "address",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Số nhà, tên đường..."
                                                className={cn(
                                                    "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                                    errors.address &&
                                                        "border-red-500 focus:border-red-500",
                                                )}
                                            />
                                            {errors.address && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {errors.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent" />

                                    <div className="space-y-2">
                                        <Label className="text-slate-700 flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5 text-purple-600" />
                                            Mô tả
                                        </Label>
                                        <Textarea
                                            value={formData.description}
                                            rows={4}
                                            onChange={(e) =>
                                                handleChange(
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Thông tin bổ sung về nhà cung cấp..."
                                            className={cn(
                                                "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                                                errors.description &&
                                                    "border-red-500 focus:border-red-500",
                                            )}
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tài khoản ngân hàng */}
                            <Card className="border-slate-200 shadow-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                                <CreditCard className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg text-slate-800">
                                                    Tài khoản ngân hàng
                                                </CardTitle>
                                                <CardDescription>
                                                    Quản lý thông tin tài khoản
                                                    ngân hàng
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addBankAccount}
                                            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Thêm tài khoản
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 space-y-4">
                                    {formData.bank_accounts.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-blue-200 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                                    <CreditCard className="w-8 h-8 text-blue-600/50" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">
                                                    Chưa có tài khoản ngân hàng
                                                    nào
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Nhấn nút "Thêm tài khoản" để
                                                    thêm tài khoản mới
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {formData.bank_accounts.map(
                                                (account, index) => (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "relative border rounded-lg p-5 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all",
                                                            (errors[
                                                                `bank_accounts.${index}.bank_code`
                                                            ] ||
                                                                errors[
                                                                    `bank_accounts.${index}.account_number`
                                                                ]) &&
                                                                "border-red-300 bg-red-50/30",
                                                        )}
                                                    >
                                                        <div className="absolute -top-2 -right-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-red-50 hover:text-red-600 border border-slate-200"
                                                                onClick={() =>
                                                                    removeBankAccount(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                                                <CreditCard className="h-4 w-4 text-white" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">
                                                                Tài khoản{" "}
                                                                {index + 1}
                                                            </span>
                                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                                #{index + 1}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-slate-500">
                                                                    Ngân hàng
                                                                </Label>
                                                                <SelectCombobox
                                                                    value={
                                                                        account.bank_code
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateBankAccount(
                                                                            index,
                                                                            "bank_code",
                                                                            value,
                                                                        )
                                                                    }
                                                                    options={
                                                                        bankOptions
                                                                    }
                                                                    placeholder="-- Chọn ngân hàng --"
                                                                    searchPlaceholder="Tìm kiếm ngân hàng..."
                                                                    error={
                                                                        errors[
                                                                            `bank_accounts.${index}.bank_code`
                                                                        ]
                                                                    }
                                                                    icon={
                                                                        <Building2 className="h-4 w-4 text-blue-600" />
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-slate-500">
                                                                    Số tài khoản
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        account.account_number
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateBankAccount(
                                                                            index,
                                                                            "account_number",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Nhập số tài khoản"
                                                                    className={cn(
                                                                        "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                                                                        errors[
                                                                            `bank_accounts.${index}.account_number`
                                                                        ] &&
                                                                            "border-red-500 focus:border-red-500",
                                                                    )}
                                                                />
                                                                {errors[
                                                                    `bank_accounts.${index}.account_number`
                                                                ] && (
                                                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                                                        <Info className="h-3 w-3" />
                                                                        {
                                                                            errors[
                                                                                `bank_accounts.${index}.account_number`
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT */}
                        <div className="lg:col-span-4 space-y-6">
                            <ImageUpload
                                image={formData.avatar}
                                onChange={(val) => handleChange("avatar", val)}
                                title="Ảnh đại diện"
                                description="Chọn ảnh nhận diện nhà cung cấp"
                            />

                            {/* Quick Actions */}
                            <Card className="border-slate-200 shadow-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                                    <CardTitle className="text-sm font-medium text-slate-700">
                                        Thao tác nhanh
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                            onClick={() =>
                                                window.open(
                                                    route(
                                                        "admin.supplier.index",
                                                    ),
                                                    "_blank",
                                                )
                                            }
                                        >
                                            <Truck className="mr-2 h-4 w-4" />
                                            Danh sách nhà cung cấp
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() =>
                                                window.open(
                                                    "https://www.google.com/maps",
                                                    "_blank",
                                                )
                                            }
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Xem trên bản đồ
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn-gradient-premium shadow-xl hover:shadow-2xl px-8"
                >
                    {isSubmitting ? (
                        <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            {isEdit ? "Cập Nhật" : "Lưu Lại"}
                        </>
                    )}
                </Button>
            </div>
        </AdminLayout>
    );
}