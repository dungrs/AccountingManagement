import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/admin/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { useEventBus } from "@/EventBus";

export default function Login() {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            email: "",
            password: "",
            remember: false,
        });

    const { flash } = usePage().props;
    const { emit } = useEventBus();

    const [showPassword, setShowPassword] = useState(false);

    // Hiển thị toast khi có flash message
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Hiển thị toast khi có lỗi validation
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).join(", ");
            toast.error(errorMessages);
        }
    }, [errors]);

    const submit = (e) => {
        e.preventDefault();
        clearErrors();

        post(route("admin.login"), {
            onSuccess: () => {
                emit("toast:success", "Đăng nhập thành công!");
            },
            onFinish: () => reset("password"),
        });
    };

    return (
        <>
            <Head title="Login" />

            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 light">
                <div className="w-full max-w-sm">
                    <Card>
                        <CardHeader className="text-center gap-2">
                            <div className="mb-4 flex justify-center">
                                <img
                                    src="/images/icon_laravel.png"
                                    alt="Laravel"
                                    className="h-10 w-auto"
                                />
                            </div>
                            <CardTitle className="text-xl">
                                Chào mừng bạn trở lại!
                            </CardTitle>
                            <CardDescription>
                                Nhập email của bạn bên dưới để đăng nhập vào tài
                                khoản.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        autoComplete="username"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        className={
                                            errors.email
                                                ? "border-red-500 focus-visible:ring-red-500"
                                                : ""
                                        }
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">
                                            Mật khẩu
                                        </Label>
                                        <Link
                                            href="#"
                                            className="ml-auto text-sm underline hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            className={`pr-10 ${
                                                errors.password
                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                    : ""
                                            }`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label={
                                                showPassword
                                                    ? "Ẩn mật khẩu"
                                                    : "Hiển thị mật khẩu"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="text-sm text-red-600">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-4">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing
                                            ? "Đang đăng nhập..."
                                            : "Đăng nhập"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Đăng nhập với Google
                                    </Button>
                                </div>

                                {/* Register */}
                                <div className="text-center text-sm">
                                    Chưa có tài khoản?{" "}
                                    <Link
                                        href="#"
                                        className="underline underline-offset-4"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
