"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Head, usePage, router } from "@inertiajs/react";

import GeneralInfoForm from "@/admin/components/shared/forms/GeneralInfoForm";
import SEOForm from "@/admin/components/shared/forms/SEOForm";
import AdvancedConfigForm from "@/admin/components/shared/forms/AdvancedConfigForm";
import ImageUpload from "@/admin/components/shared/upload/ImageUpload";

import { useEventBus } from "@/EventBus";
import {
    Save,
    Tags,
    Layers,
    ChevronRight,
    Info,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function FormCatalogue() {
    const {
        dropdown,
        attributeCatalogue,
        errors: serverErrors,
        flash,
    } = usePage().props;
    const { emit } = useEventBus();

    const isEdit = !!attributeCatalogue;

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        content: "",
        album: [],
        image: null,
        parentCategory: "0",
        status: "0",
        navigation: "0",
        meta_title: "",
        canonical: "",
        meta_keyword: "",
        meta_description: "",
    });

    useEffect(() => {
        if (attributeCatalogue) {
            setFormData({
                name: attributeCatalogue.name || "",
                description: attributeCatalogue.description || "",
                content: attributeCatalogue.content || "",
                album: attributeCatalogue.album || [],
                image: attributeCatalogue.image || null,
                parentCategory: attributeCatalogue.parent_id?.toString() || "0",
                status: attributeCatalogue.publish?.toString() || "0",
                navigation: attributeCatalogue.follow?.toString() || "0",
                meta_title: attributeCatalogue.meta_title || "",
                canonical: attributeCatalogue.canonical || "",
                meta_keyword: attributeCatalogue.meta_keyword || "",
                meta_description: attributeCatalogue.meta_description || "",
            });
        }
    }, [attributeCatalogue]);

    useEffect(() => {
        if (flash?.success) {
            emit("toast:success", flash.success);
        }
        if (flash?.error) {
            emit("toast:error", flash.error);
        }
    }, [flash, emit]);

    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
        }
    }, [serverErrors]);

    const handleGeneralChange = (data) => {
        setFormData((prev) => ({
            ...prev,
            name: data.name,
            description: data.description,
            content: data.content,
        }));
        clearFieldErrors(["name", "description", "content"]);
    };

    const handleSEOChange = (data) => {
        setFormData((prev) => ({
            ...prev,
            meta_title: data.meta_title,
            canonical: data.canonical,
            meta_keyword: data.meta_keyword,
            meta_description: data.meta_description,
        }));
        clearFieldErrors([
            "meta_title",
            "canonical",
            "meta_keyword",
            "meta_description",
        ]);
    };

    const handleAdvancedChange = (data) => {
        setFormData((prev) => ({
            ...prev,
            parentCategory: data.parentCategory,
            status: data.status,
            navigation: data.navigation,
        }));
        clearFieldErrors(["parent_id", "publish", "follow"]);
    };

    const handleImageChange = (url) => {
        setFormData((prev) => ({
            ...prev,
            image: url,
        }));
        clearFieldErrors(["image"]);
    };

    const handleAlbumChange = (images) => {
        setFormData((prev) => ({
            ...prev,
            album: images,
        }));
        clearFieldErrors(["album"]);
    };

    const clearFieldErrors = (fields) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            fields.forEach((field) => {
                delete newErrors[field];
            });
            return newErrors;
        });
    };

    const handleSubmit = () => {
        if (isSubmitting) return;

        setErrors({});

        if (formData.status === "2") {
            emit("toast:error", "Vui lòng chọn tình trạng!");
            return;
        }

        if (formData.navigation === "2") {
            emit("toast:error", "Vui lòng chọn điều hướng!");
            return;
        }

        setIsSubmitting(true);

        const submitData = {
            name: formData.name,
            description: formData.description,
            content: formData.content,
            image: formData.image,
            album: formData.album,
            parent_id: formData.parentCategory,
            publish: formData.status,
            follow: formData.navigation,
            meta_title: formData.meta_title,
            canonical: formData.canonical,
            meta_keyword: formData.meta_keyword,
            meta_description: formData.meta_description,
        };

        const submitRoute = isEdit
            ? route("admin.attribute.catalogue.update", attributeCatalogue.id)
            : route("admin.attribute.catalogue.store");

        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,

            onSuccess: () => {
                setErrors({});
                toast.success(
                    isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!",
                );
            },

            onError: (errors) => {
                if (Object.keys(errors).length > 0) {
                    emit(
                        "toast:error",
                        "Vui lòng kiểm tra lại thông tin nhập vào!",
                    );
                }
            },

            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Thống kê nhanh
    const getStats = () => {
        const totalFields = 12; // Tổng số field chính
        const filledFields = [
            formData.name,
            formData.description,
            formData.content,
            formData.image,
            formData.meta_title,
            formData.canonical,
            formData.meta_keyword,
            formData.meta_description,
        ].filter(Boolean).length;

        return {
            filled: filledFields,
            total: totalFields,
            percentage: Math.round((filledFields / totalFields) * 100),
        };
    };

    const stats = getStats();

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "QL Thuộc Tính",
                    link: route("admin.attribute.catalogue.index"),
                },
                {
                    label: isEdit
                        ? "Cập Nhật Loại Thuộc Tính"
                        : "Thêm Mới Loại Thuộc Tính",
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? "Cập Nhật Loại Thuộc Tính"
                        : "Thêm Mới Loại Thuộc Tính"
                }
            />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Trạng thái
                            </p>
                            <Badge
                                className={cn(
                                    "mt-1",
                                    formData.status === "1"
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : formData.status === "0"
                                          ? "bg-red-100 text-red-700 border-red-200"
                                          : "bg-slate-100 text-slate-700 border-slate-200",
                                )}
                            >
                                {formData.status === "1"
                                    ? "Đang hoạt động"
                                    : formData.status === "0"
                                      ? "Ngừng hoạt động"
                                      : "Chưa chọn"}
                            </Badge>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            {formData.status === "1" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : formData.status === "0" ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                                <Info className="h-5 w-5 text-slate-600" />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Cấp độ
                            </p>
                            <p className="text-lg font-bold text-purple-600">
                                {formData.parentCategory === "0"
                                    ? "Gốc"
                                    : "Con"}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Hoàn thành
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-bold text-green-600">
                                    {stats.percentage}%
                                </p>
                                <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                >
                                    {stats.filled}/{stats.total}
                                </Badge>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Save className="h-5 w-5 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <GeneralInfoForm
                        data={{
                            name: formData.name,
                            description: formData.description,
                            content: formData.content,
                        }}
                        onChange={handleGeneralChange}
                        errors={errors}
                    />

                    <SEOForm
                        seoData={{
                            meta_title: formData.meta_title,
                            canonical: formData.canonical,
                            meta_keyword: formData.meta_keyword,
                            meta_description: formData.meta_description,
                        }}
                        onChange={handleSEOChange}
                        errors={errors}
                    />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <AdvancedConfigForm
                        data={{
                            parentCategory: formData.parentCategory,
                            status: formData.status,
                            navigation: formData.navigation,
                        }}
                        onChange={handleAdvancedChange}
                        dropdown={dropdown}
                        hasCatalogue={false}
                        excludeCategoryId={attributeCatalogue?.id ?? null}
                    />

                    <ImageUpload
                        image={formData.image}
                        onChange={handleImageChange}
                        title="Ảnh đại diện"
                        description="Chọn ảnh đại diện cho loại thuộc tính"
                    />

                    {/* Quick Info Card */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-3">
                            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                Thông tin nhanh
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Đường dẫn:
                                </span>
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded text-blue-600">
                                    {formData.canonical || "Chưa có"}
                                </code>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Từ khóa:</span>
                                <span className="text-slate-700 truncate max-w-[150px]">
                                    {formData.meta_keyword || "Chưa có"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Điều hướng:
                                </span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        formData.navigation === "1"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : formData.navigation === "0"
                                              ? "bg-slate-50 text-slate-700 border-slate-200"
                                              : "bg-slate-100 text-slate-500",
                                    )}
                                >
                                    {formData.navigation === "1"
                                        ? "Theo dõi"
                                        : formData.navigation === "0"
                                          ? "Không theo dõi"
                                          : "Chưa chọn"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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