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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import { Calendar } from "@/admin/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/admin/components/ui/popover";
import { Info } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    CalendarIcon,
    Eye,
    EyeOff,
    Upload,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { format, parse } from "date-fns";

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
    const [birthday, setBirthday] = useState(new Date());

    // ✅ FIX: Khởi tạo đầy đủ với giá trị mặc định
    const [form, setForm] = useState({
        name: "",
        email: "",
        user_catalogue_id: "",
        birthday: "",
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
                // parse "1996-11-23 00:00:00"
                parsedBirthday = parse(
                    data.birthday,
                    "yyyy-MM-dd HH:mm:ss",
                    new Date(),
                );
            }

            setBirthday(parsedBirthday);

            setForm({
                name: data.name || "",
                email: data.email || "",
                user_catalogue_id: data.user_catalogue_id
                    ? String(data.user_catalogue_id)
                    : "",
                birthday: parsedBirthday
                    ? format(parsedBirthday, "dd/MM/yyyy")
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
            // Reset form về giá trị mặc định
            setForm({
                name: "",
                email: "",
                user_catalogue_id: "",
                birthday: "",
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

        const payload = isEdit ? { id: data.id, ...form } : form;

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
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {isEdit
                                ? "Chỉnh sửa thành viên"
                                : "Thêm thành viên mới"}
                        </DialogTitle>

                        <DialogDescription className="text-sm text-muted-foreground">
                            {isEdit
                                ? "Cập nhật thông tin của thành viên hiện có. Vui lòng kiểm tra kỹ trước khi lưu thay đổi."
                                : "Nhập đầy đủ thông tin để thêm một thành viên mới vào hệ thống."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                        <Info className="w-4 h-4 mt-0.5" />
                        <p>
                            Những trường có dấu{" "}
                            <span className="text-red-500 font-semibold">
                                *
                            </span>{" "}
                            là bắt buộc phải nhập.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* THÔNG TIN CHUNG */}
                        <div>
                            <h3 className="text-base font-semibold mb-4">
                                Thông tin chung
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Họ Tên */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Họ Tên{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Nhập họ và tên đầy đủ..."
                                        value={form.name}
                                        onChange={(e) =>
                                            handleChange("name", e.target.value)
                                        }
                                        className={cn(
                                            errors.name && "border-red-500",
                                        )}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500">
                                            {errors.name[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
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
                                            errors.email && "border-red-500",
                                        )}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-500">
                                            {errors.email[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Nhóm thành viên */}
                                <div className="space-y-2">
                                    <Label>
                                        Nhóm thành viên{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={form.user_catalogue_id}
                                        onValueChange={(v) =>
                                            handleChange("user_catalogue_id", v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={cn(
                                                errors.user_catalogue_id &&
                                                    "border-red-500",
                                            )}
                                        >
                                            <SelectValue placeholder="Chọn nhóm thành viên..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {userCatalogues.map((item) => (
                                                <SelectItem
                                                    key={item.id}
                                                    value={String(item.id)}
                                                >
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.user_catalogue_id && (
                                        <p className="text-xs text-red-500">
                                            {errors.user_catalogue_id[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Ngày sinh */}
                                <div className="space-y-2">
                                    <Label>
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
                                                    "w-full justify-start font-normal",
                                                    errors.birthday &&
                                                        "border-red-500",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {birthday
                                                    ? birthday.toLocaleDateString(
                                                          "vi-VN",
                                                      )
                                                    : "Chọn ngày sinh"}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="w-auto overflow-hidden p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={birthday}
                                                defaultMonth={birthday}
                                                captionLayout="dropdown"
                                                onSelect={(date) => {
                                                    if (!date) return;

                                                    setBirthday(date);

                                                    handleChange(
                                                        "birthday",
                                                        format(
                                                            date,
                                                            "dd/MM/yyyy",
                                                        ),
                                                    );

                                                    setOpenBirthday(false);
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {errors.birthday && (
                                        <p className="text-xs text-red-500">
                                            {errors.birthday[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Mật khẩu */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Mật khẩu{" "}
                                        {!isEdit && (
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        )}
                                        {isEdit && (
                                            <span className="text-xs text-gray-500">
                                                (để trống nếu không đổi)
                                            </span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
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
                                                errors.password &&
                                                    "border-red-500",
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-red-500">
                                            {errors.password[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Nhập lại mật khẩu */}
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">
                                        Nhập lại mật khẩu{" "}
                                        {!isEdit && (
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        )}
                                    </Label>
                                    <div className="relative">
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
                                                errors.password_confirmation &&
                                                    "border-red-500",
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() =>
                                                setShowPasswordConfirm(
                                                    !showPasswordConfirm,
                                                )
                                            }
                                        >
                                            {showPasswordConfirm ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Ảnh đại diện */}
                                <div className="col-span-2 space-y-2">
                                    <Label>Ảnh đại diện</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            readOnly
                                            placeholder="Nhập URL hoặc chọn ảnh..."
                                            value={form.avatar}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={openCKFinder}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Chọn ảnh
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DÒNG KẺ NGĂN CÁCH */}
                        <hr className="border-t border-muted my-2" />

                        {/* THÔNG TIN LIÊN HỆ */}
                        <div>
                            <h3 className="text-base font-semibold mb-4">
                                Thông tin liên hệ
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Thành phố */}
                                <div className="space-y-2">
                                    <Label>Tỉnh/Thành phố</Label>
                                    <Select
                                        value={form.province_id}
                                        onValueChange={handleProvinceChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn Tỉnh/Thành phố..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map((p) => (
                                                <SelectItem
                                                    key={p.province_code}
                                                    value={String(
                                                        p.province_code,
                                                    )}
                                                >
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Phường/Xã */}
                                <div className="space-y-2">
                                    <Label>Phường/Xã</Label>
                                    <Select
                                        value={form.ward_id}
                                        onValueChange={(v) =>
                                            handleChange("ward_id", v)
                                        }
                                        disabled={
                                            !form.province_id || loadingWard
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    loadingWard
                                                        ? "Đang tải..."
                                                        : !form.province_id
                                                          ? "Chọn Tỉnh/Thành phố trước"
                                                          : "Chọn Phường/Xã..."
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wards.length === 0 &&
                                                !loadingWard && (
                                                    <div className="p-2 text-sm text-gray-500">
                                                        Không có dữ liệu
                                                    </div>
                                                )}
                                            {wards.map((w) => (
                                                <SelectItem
                                                    key={w.value}
                                                    value={String(w.value)}
                                                >
                                                    {w.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Địa chỉ */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Địa chỉ</Label>
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
                                    />
                                </div>

                                {/* Số điện thoại */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
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
                                    />
                                </div>

                                {/* Ghi chú */}
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="note">Ghi chú</Label>
                                    <Input
                                        id="note"
                                        placeholder="Nhập ghi chú (nếu có)..."
                                        value={form.note}
                                        onChange={(e) =>
                                            handleChange("note", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Đóng
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Đang xử lý..." : "Xác nhận"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}