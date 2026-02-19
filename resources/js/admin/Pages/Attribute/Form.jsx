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
import AlbumUpload from "@/admin/components/shared/upload/AlbumUpload";

import { useEventBus } from "@/EventBus";
import { parseJsonArray } from "@/admin/utils/parseJsonArray";
import {
    Tag,
    Save,
    Info,
    CheckCircle2,
    XCircle,
    Layers,
    FolderTree,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

const normalizeCatalogues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    return [];
};

export default function Form() {
    const {
        dropdown,
        attribute,
        catalogues,
        errors: serverErrors,
        flash,
    } = usePage().props;
    const { emit } = useEventBus();

    const isEdit = !!attribute;

    useEffect(() => {
        console.log(attribute);
    }, []);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationProgress, setValidationProgress] = useState({
        generalInfo: false,
        image: false,
        album: false,
        seo: false,
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        content: "",
        album: [],
        image: null,
        parentCategory: "0",
        status: "0",
        navigation: "0",
        catalogues: [],
        meta_title: "",
        canonical: "",
        meta_keyword: "",
        meta_description: "",
    });

    // Load dữ liệu khi Edit
    useEffect(() => {
        if (!attribute) return;

        setFormData((prev) => ({
            ...prev,
            name: attribute.name || "",
            description: attribute.description || "",
            content: attribute.content || "",
            album: parseJsonArray(attribute.album),
            image: attribute.image || null,
            parentCategory: attribute.attribute_catalogue_id?.toString() || "0",
            status: attribute.publish?.toString() || "0",
            navigation: attribute.follow?.toString() || "0",
            catalogues: normalizeCatalogues(catalogues),
            meta_title: attribute.meta_title || "",
            canonical: attribute.canonical || "",
            meta_keyword: attribute.meta_keyword || "",
            meta_description: attribute.meta_description || "",
        }));
    }, [attribute, catalogues]);

    // Cập nhật validation progress
    useEffect(() => {
        setValidationProgress({
            generalInfo: !!formData.name.trim(),
            image: !!formData.image,
            album: formData.album.length > 0,
            seo: !!(
                formData.meta_title ||
                formData.canonical ||
                formData.meta_keyword ||
                formData.meta_description
            ),
        });
    }, [
        formData.name,
        formData.image,
        formData.album,
        formData.meta_title,
        formData.canonical,
        formData.meta_keyword,
        formData.meta_description,
    ]);

    // Xử lý flash messages
    useEffect(() => {
        if (flash?.success) {
            emit("toast:success", flash.success);
        }
        if (flash?.error) {
            emit("toast:error", flash.error);
        }
    }, [flash, emit]);

    // Sync server errors vào state
    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
        }
    }, [serverErrors]);

    // Handle General Info changes
    const handleGeneralChange = (data) => {
        setFormData((prev) => ({
            ...prev,
            name: data.name,
            description: data.description,
            content: data.content,
        }));
        clearFieldErrors(["name", "description", "content"]);
    };

    // Handle SEO changes
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

    // Handle Advanced Config changes
    const handleAdvancedChange = (data) => {
        setFormData((prev) => ({
            ...prev,
            parentCategory: data.parentCategory,
            status: data.status,
            navigation: data.navigation,
            catalogues: data.catalogues ?? prev.catalogues,
        }));
        clearFieldErrors(["parent_id", "publish", "follow"]);
    };

    // Handle Image Upload
    const handleImageChange = (url) => {
        setFormData((prev) => ({
            ...prev,
            image: url,
        }));
        clearFieldErrors(["image"]);
    };

    // Handle Album Upload
    const handleAlbumChange = (images) => {
        setFormData((prev) => ({
            ...prev,
            album: images,
        }));
        clearFieldErrors(["album"]);
    };

    // Helper function để clear errors
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

        if (!formData.name.trim()) {
            emit("toast:error", "Vui lòng nhập tên thuộc tính!");
            return;
        }

        setIsSubmitting(true);

        const submitData = {
            name: formData.name,
            description: formData.description,
            content: formData.content,
            image: formData.image,
            album: formData.album,
            attribute_catalogue_id: formData.parentCategory,
            publish: formData.status,
            follow: formData.navigation,
            catalogues: formData.catalogues,
            meta_title: formData.meta_title,
            canonical: formData.canonical,
            meta_keyword: formData.meta_keyword,
            meta_description: formData.meta_description,
        };

        const submitRoute = isEdit
            ? route("admin.attribute.update", attribute.id)
            : route("admin.attribute.store");

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

    // Tính phần trăm hoàn thành
    const completionPercentage =
        (Object.values(validationProgress).filter(Boolean).length /
            Object.values(validationProgress).length) *
        100;

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "QL Thuộc Tính",
                    link: route("admin.attribute.index"),
                },
                {
                    label: isEdit
                        ? "Cập Nhật Thuộc Tính"
                        : "Thêm Mới Thuộc Tính",
                },
            ]}
        >
            <Head
                title={isEdit ? "Cập Nhật Thuộc Tính" : "Thêm Mới Thuộc Tính"}
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
                            <Tag className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Danh mục cha
                            </p>
                            <p className="text-lg font-bold text-purple-600">
                                {formData.parentCategory === "0"
                                    ? "Không có"
                                    : "Có"}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <FolderTree className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tiến độ
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-bold text-green-600">
                                    {Math.round(completionPercentage)}%
                                </p>
                                <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                >
                                    {
                                        Object.values(
                                            validationProgress,
                                        ).filter(Boolean).length
                                    }
                                    /4
                                </Badge>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">
                            Tiến độ hoàn thành
                        </span>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                        {Math.round(completionPercentage)}%
                    </Badge>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className="flex items-center gap-1 text-xs">
                        {validationProgress.generalInfo ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                        )}
                        <span className="text-slate-600">Thông tin</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {validationProgress.image ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                        )}
                        <span className="text-slate-600">Ảnh</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {validationProgress.album ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                        )}
                        <span className="text-slate-600">Album</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {validationProgress.seo ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                        )}
                        <span className="text-slate-600">SEO</span>
                    </div>
                </div>
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

                    <AlbumUpload
                        images={formData.album}
                        onChange={handleAlbumChange}
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
                            catalogues: formData.catalogues,
                        }}
                        onChange={handleAdvancedChange}
                        dropdown={dropdown}
                        hasCatalogue={true}
                        excludeCategoryId={attribute?.id ?? null}
                        showInfoMessage={false}
                        errors={errors}
                    />

                    <ImageUpload
                        image={formData.image}
                        onChange={handleImageChange}
                        title="Ảnh đại diện thuộc tính"
                        description="Chọn ảnh đại diện cho thuộc tính"
                    />

                    {/* Quick Info Card */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-3">
                            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                Thông tin nhanh
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Đường dẫn:
                                </span>
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded text-blue-600">
                                    {formData.canonical || "Chưa có"}
                                </code>
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
                                        ? "Cho phép lập chỉ mục"
                                        : formData.navigation === "0"
                                          ? "Không cho phép lập chỉ mục"
                                          : "Chưa chọn"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-100">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                    <Layers className="h-3 w-3 mr-1" />
                                    Album: {formData.album.length} ảnh
                                </Badge>
                                {formData.catalogues.length > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                        <FolderTree className="h-3 w-3 mr-1" />
                                        {formData.catalogues.length} nhóm
                                    </Badge>
                                )}
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
