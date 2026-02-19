"use client";

import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
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
import { Label } from "@/admin/components/ui/label";
import { Calendar } from "@/admin/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/admin/components/ui/popover";
import {
    Info,
    CalendarIcon,
    Eye,
    EyeOff,
    Upload,
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    FileText,
    Gift,
    Building2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";
import { format } from "date-fns";
import SelectCombobox from "../../ui/select-combobox";
import { Badge } from "@/admin/components/ui/badge";
import { Separator } from "@/admin/components/ui/separator";

export default function UserFormModal({
    open,
    mode = "create",
    data = null,
    onClose,
    onSuccess,
}) {
    const isEdit = mode === "edit";
    const { userCatalogues, provinces } = usePage().props;

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [wards, setWards] = useState([]);
    const [loadingWard, setLoadingWard] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [openBirthday, setOpenBirthday] = useState(false);
    const [birthday, setBirthday] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        user_catalogue_id: "",
        password: "",
        password_confirmation: "",
        avatar: "",
        province_id: "",
        ward_id: "",
        address: "",
        phone: "",
        note: "",
    });

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (isEdit && data) {
            let parsedBirthday = null;

            if (data.birthday) {
                const dateOnly = data.birthday.split(" ")[0];
                parsedBirthday = new Date(dateOnly);
            }

            setBirthday(parsedBirthday);

            setForm({
                name: data.name || "",
                email: data.email || "",
                user_catalogue_id: data.user_catalogue_id
                    ? String(data.user_catalogue_id)
                    : "",
                password: "",
                password_confirmation: "",
                avatar: data.avatar || "",
                province_id: data.province_id ? String(data.province_id) : "",
                ward_id: data.ward_id ? String(data.ward_id) : "",
                address: data.address || "",
                phone: data.phone || "",
                note: data.note || "",
            });

            if (data.province_id) {
                fetchWardsByProvince(String(data.province_id));
            }
        } else {
            setBirthday(null);

            setForm({
                name: "",
                email: "",
                user_catalogue_id: "",
                password: "",
                password_confirmation: "",
                avatar: "",
                province_id: "",
                ward_id: "",
                address: "",
                phone: "",
                note: "",
            });

            setWards([]);
        }
    }, [open, isEdit, data]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const openCKFinder = () => {
        if (!window.CKFinder) {
            toast.error("CKFinder chưa được load");
            return;
        }

        window.CKFinder.popup({
            chooseFiles: true,
            width: 900,
            height: 600,

            selectActionFunction: function (fileUrl) {
                console.log("CKFinder selected:", fileUrl);

                handleChange("avatar", fileUrl);
                toast.success("Đã chọn ảnh thành công!");
            },

            removePlugins: "basket",
        });
    };

    const handleProvinceChange = (provinceId) => {
        const id = String(provinceId);

        setForm((prev) => ({
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

    const handleSubmit = () => {
        setLoading(true);
        setErrors({});

        const apiRoute = isEdit
            ? route("admin.user.update")
            : route("admin.user.store");

        const payload = {
            ...form,
            birthday: birthday ? format(birthday, "dd/MM/yyyy") : "",
        };

        if (isEdit) {
            payload.id = data.id;
        }

        axios
            .post(apiRoute, payload)
            .then((res) => {
                toast.success(res.data?.message || "Thao tác thành công!");
                onSuccess?.();
                onClose();
            })
            .catch((err) => {
                if (err.response?.status === 422) {
                    setErrors(err.response.data.errors || {});
                    toast.error("Vui lòng kiểm tra lại thông tin!");
                    return;
                }
                toast.error("Có lỗi xảy ra, vui lòng thử lại!");
            })
            .finally(() => setLoading(false));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] border-0 max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white flex items-center gap-2">
                            {isEdit ? (
                                <>
                                    <User className="h-5 w-5" />
                                    Chỉnh sửa thành viên
                                </>
                            ) : (
                                <>
                                    <User className="h-5 w-5" />
                                    Thêm thành viên mới
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            {isEdit
                                ? "Cập nhật thông tin của thành viên hiện có. Vui lòng kiểm tra kỹ trước khi lưu thay đổi."
                                : "Nhập đầy đủ thông tin để thêm một thành viên mới vào hệ thống."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-6">
                    {/* Info Alert */}
                    <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm text-slate-700">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p>
                            Những trường có dấu{" "}
                            <Badge
                                variant="outline"
                                className="bg-red-100 text-red-600 border-red-200 mx-1 px-1.5"
                            >
                                *
                            </Badge>{" "}
                            là bắt buộc phải nhập.
                        </p>
                    </div>

                    {/* THÔNG TIN CHUNG */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <Gift className="h-4 w-4 text-blue-600" />
                                Thông tin chung
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Họ Tên */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-slate-700 font-medium"
                                >
                                    Họ Tên{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="name"
                                        placeholder="Nhập họ và tên đầy đủ..."
                                        value={form.name}
                                        onChange={(e) =>
                                            handleChange("name", e.target.value)
                                        }
                                        className={cn(
                                            "pl-9 border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                            errors.name &&
                                                "border-red-500 focus:border-red-500 focus:ring-red-500",
                                        )}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        {errors.name[0]}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-slate-700 font-medium"
                                >
                                    Email{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Nhập email của bạn..."
                                        value={form.email}
                                        onChange={(e) =>
                                            handleChange(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        className={cn(
                                            "pl-9 border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                            errors.email &&
                                                "border-red-500 focus:border-red-500 focus:ring-red-500",
                                        )}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        {errors.email[0]}
                                    </p>
                                )}
                            </div>

                            {/* Nhóm khách hàng */}
                            <div className="space-y-2">
                                <SelectCombobox
                                    label="Nhóm khách hàng"
                                    required
                                    value={form.user_catalogue_id}
                                    onChange={(v) =>
                                        handleChange("user_catalogue_id", v)
                                    }
                                    options={userCatalogues.map((u) => ({
                                        value: u.id,
                                        label: u.name,
                                    }))}
                                    placeholder="Chọn nhóm khách hàng..."
                                    error={errors.user_catalogue_id?.[0]}
                                    className="border-slate-200 focus:border-blue-500"
                                />
                            </div>

                            {/* Ngày sinh */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">
                                    Ngày sinh{" "}
                                    <span className="text-red-500">*</span>
                                </Label>

                                <Popover
                                    open={openBirthday}
                                    onOpenChange={setOpenBirthday}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start font-normal border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all",
                                                errors.birthday &&
                                                    "border-red-500 hover:border-red-500",
                                                !birthday && "text-slate-400",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                            {birthday
                                                ? format(birthday, "dd/MM/yyyy")
                                                : "Chọn ngày sinh"}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0 border-blue-200"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={birthday}
                                            defaultMonth={
                                                birthday || new Date()
                                            }
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                if (!date) return;
                                                setBirthday(date);
                                                setOpenBirthday(false);
                                            }}
                                            className="rounded-md border-0"
                                        />
                                    </PopoverContent>
                                </Popover>

                                {errors.birthday && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        {errors.birthday[0]}
                                    </p>
                                )}
                            </div>

                            {/* Mật khẩu */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-slate-700 font-medium"
                                >
                                    Mật khẩu{" "}
                                    {!isEdit && (
                                        <span className="text-red-500">*</span>
                                    )}
                                    {isEdit && (
                                        <span className="text-xs text-slate-400 ml-1">
                                            (để trống nếu không đổi)
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder={
                                            isEdit
                                                ? "Để trống nếu không đổi..."
                                                : "Nhập mật khẩu..."
                                        }
                                        value={form.password}
                                        onChange={(e) =>
                                            handleChange(
                                                "password",
                                                e.target.value,
                                            )
                                        }
                                        className={cn(
                                            "pl-9 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                            errors.password &&
                                                "border-red-500 focus:border-red-500 focus:ring-red-500",
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 hover:bg-transparent"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        {errors.password[0]}
                                    </p>
                                )}
                            </div>

                            {/* Nhập lại mật khẩu */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-slate-700 font-medium"
                                >
                                    Nhập lại mật khẩu{" "}
                                    {!isEdit && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password_confirmation"
                                        type={
                                            showPasswordConfirm
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder={
                                            isEdit
                                                ? "Để trống nếu không đổi..."
                                                : "Nhập lại mật khẩu..."
                                        }
                                        value={form.password_confirmation}
                                        onChange={(e) =>
                                            handleChange(
                                                "password_confirmation",
                                                e.target.value,
                                            )
                                        }
                                        className={cn(
                                            "pl-9 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                            errors.password_confirmation &&
                                                "border-red-500 focus:border-red-500 focus:ring-red-500",
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 hover:bg-transparent"
                                        onClick={() =>
                                            setShowPasswordConfirm(
                                                !showPasswordConfirm,
                                            )
                                        }
                                    >
                                        {showPasswordConfirm ? (
                                            <EyeOff className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Ảnh đại diện */}
                            <div className="col-span-2 space-y-2">
                                <Label className="text-slate-700 font-medium">
                                    Ảnh đại diện
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Input
                                            readOnly
                                            placeholder="Nhập URL hoặc chọn ảnh..."
                                            value={form.avatar}
                                            className="flex-1 border-slate-200 bg-slate-50"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={openCKFinder}
                                        className="btn-gradient-premium"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Chọn ảnh
                                    </Button>
                                </div>
                                {form.avatar && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img
                                            src={form.avatar}
                                            alt="Preview"
                                            className="h-12 w-12 rounded-lg object-cover border-2 border-blue-200"
                                        />
                                        <span className="text-xs text-slate-500">
                                            Ảnh đại diện
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent" />

                    {/* THÔNG TIN LIÊN HỆ */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-purple-600" />
                                Thông tin liên hệ
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Thành phố */}
                            <div className="space-y-2">
                                <SelectCombobox
                                    label="Tỉnh/Thành phố"
                                    value={form.province_id}
                                    onChange={handleProvinceChange}
                                    options={provinces.map((p) => ({
                                        value: p.province_code,
                                        label: p.name,
                                    }))}
                                    placeholder="Chọn Tỉnh/Thành phố..."
                                    className="border-slate-200 focus:border-purple-500"
                                />
                            </div>

                            {/* Phường/Xã */}
                            <div className="space-y-2">
                                <SelectCombobox
                                    label="Phường/Xã"
                                    value={form.ward_id}
                                    onChange={(v) => handleChange("ward_id", v)}
                                    options={wards}
                                    disabled={!form.province_id || loadingWard}
                                    placeholder={
                                        loadingWard
                                            ? "Đang tải..."
                                            : !form.province_id
                                              ? "Chọn Tỉnh/Thành phố trước"
                                              : "Chọn Phường/Xã..."
                                    }
                                    className="border-slate-200 focus:border-purple-500"
                                />
                            </div>

                            {/* Địa chỉ */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="address"
                                    className="text-slate-700 font-medium"
                                >
                                    Địa chỉ
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="address"
                                        placeholder="Nhập địa chỉ (nếu có)..."
                                        value={form.address}
                                        onChange={(e) =>
                                            handleChange(
                                                "address",
                                                e.target.value,
                                            )
                                        }
                                        className="pl-9 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Số điện thoại */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="phone"
                                    className="text-slate-700 font-medium"
                                >
                                    Số điện thoại
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="phone"
                                        placeholder="Nhập số điện thoại liên hệ..."
                                        value={form.phone}
                                        onChange={(e) =>
                                            handleChange(
                                                "phone",
                                                e.target.value,
                                            )
                                        }
                                        className="pl-9 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Ghi chú */}
                            <div className="col-span-2 space-y-2">
                                <Label
                                    htmlFor="note"
                                    className="text-slate-700 font-medium"
                                >
                                    Ghi chú
                                </Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="note"
                                        placeholder="Nhập ghi chú (nếu có)..."
                                        value={form.note}
                                        onChange={(e) =>
                                            handleChange("note", e.target.value)
                                        }
                                        className="pl-9 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    >
                        Đóng
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-gradient-premium"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Đang xử lý...
                            </>
                        ) : (
                            "Xác nhận"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}