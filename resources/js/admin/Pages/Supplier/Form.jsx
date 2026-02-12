"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage, router } from "@inertiajs/react";

import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
import { Label } from "@/admin/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Separator } from "@/admin/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

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

    // Chỉ load data từ supplier lần đầu tiên
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
        
        // Xóa lỗi của bank account này
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
        
        // Xóa lỗi khi user nhập
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
            preserveState: true, // Thêm preserveState để giữ state hiện tại

            onSuccess: () => {
                setErrors({});
            },

            onError: (errors) => {
                setErrors(errors);

                if (errors.bank_accounts || Object.keys(errors).some(key => key.startsWith('bank_accounts.'))) {
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin tài khoản ngân hàng!");
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

            <div className="space-y-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Thông tin nhà cung cấp
                                    </CardTitle>
                                    <CardDescription>
                                        {isEdit
                                            ? "Cập nhật thông tin nhà cung cấp"
                                            : "Nhập đầy đủ thông tin bên dưới"}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>
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
                                                    errors.name &&
                                                        "border-red-500",
                                                )}
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-red-500">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
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
                                                    errors.phone &&
                                                        "border-red-500",
                                                )}
                                            />
                                            {errors.phone && (
                                                <p className="text-xs text-red-500">
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>
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
                                                    errors.tax_code &&
                                                        "border-red-500",
                                                )}
                                            />
                                            {errors.tax_code && (
                                                <p className="text-xs text-red-500">
                                                    {errors.tax_code}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Email</Label>
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
                                                    errors.email &&
                                                        "border-red-500",
                                                )}
                                            />
                                            {errors.email && (
                                                <p className="text-xs text-red-500">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Fax</Label>
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
                                                    errors.fax &&
                                                        "border-red-500",
                                                )}
                                            />
                                            {errors.fax && (
                                                <p className="text-xs text-red-500">
                                                    {errors.fax}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

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
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Địa chỉ chi tiết</Label>
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
                                                    errors.address &&
                                                        "border-red-500",
                                                )}
                                            />
                                            {errors.address && (
                                                <p className="text-xs text-red-500">
                                                    {errors.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label>Mô tả</Label>
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
                                                errors.description &&
                                                    "border-red-500",
                                            )}
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-500">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle className="mb-2">
                                            Tài khoản ngân hàng
                                        </CardTitle>
                                        <CardDescription>
                                            Quản lý thông tin tài khoản ngân
                                            hàng
                                        </CardDescription>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addBankAccount}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm
                                    </Button>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {formData.bank_accounts.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <svg
                                                        className="w-6 h-6 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Chưa có tài khoản ngân hàng
                                                    nào
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Nhấn nút "Thêm" để thêm tài
                                                    khoản
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
                                                            "relative border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white hover:shadow-sm transition-shadow",
                                                            (errors[`bank_accounts.${index}.bank_code`] || 
                                                             errors[`bank_accounts.${index}.account_number`]) &&
                                                                "border-red-300 bg-red-50/30"
                                                        )}
                                                    >
                                                        <div className="absolute top-3 right-3">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() =>
                                                                    removeBankAccount(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-muted-foreground">
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
                                                                    error={errors[`bank_accounts.${index}.bank_code`]}
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-muted-foreground">
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
                                                                        errors[`bank_accounts.${index}.account_number`] &&
                                                                            "border-red-500",
                                                                    )}
                                                                />
                                                                {errors[`bank_accounts.${index}.account_number`] && (
                                                                    <p className="text-xs text-red-500">
                                                                        {errors[`bank_accounts.${index}.account_number`]}
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
                        </div>
                    </div>
                </form>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-6 right-6">
                <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? "Đang lưu..."
                        : isEdit
                          ? "Cập Nhật"
                          : "Lưu Lại"}
                </Button>
            </div>
        </AdminLayout>
    );
}