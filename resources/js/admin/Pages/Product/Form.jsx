"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Head, usePage, router } from "@inertiajs/react";

import GeneralInfoForm from "@/admin/components/shared/forms/GeneralInfoForm";
import SEOForm from "@/admin/components/shared/forms/SEOForm";
import AdvancedConfigForm from "@/admin/components/shared/forms/AdvancedConfigForm";
import ImageUpload from "@/admin/components/shared/upload/ImageUpload";
import AlbumUpload from "@/admin/components/shared/upload/AlbumUpload";

import { useEventBus } from "@/EventBus";
import { parseJsonArray } from "@/admin/utils/parseJsonArray";
import ProductVariantManager from "@/admin/components/pages/product/ProductVariantManager";

import {
    Package,
    Save,
    Info,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { CardHeader, CardTitle } from "@/admin/components/ui/card";

const normalizeCatalogues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    return [];
};

export default function Form() {
    const variantManagerRef = useRef(null);

    const {
        dropdown,
        product,
        catalogues,
        attribute,
        attributeCatalogues,
        units,
        errors: serverErrors,
        flash,
    } = usePage().props;
    const { emit } = useEventBus();

    const isEdit = !!product;

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationProgress, setValidationProgress] = useState({
        productCode: false,
        generalInfo: false,
        price: false,
        images: false,
        variants: false,
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        content: "",
        price: "",
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
        if (!product) return;

        setFormData((prev) => ({
            ...prev,
            name: product.name || "",
            description: product.description || "",
            content: product.content || "",
            price: product.price || "",
            album: parseJsonArray(product.album),
            image: product.image || null,
            parentCategory: product.product_catalogue_id?.toString() || "0",
            status: product.publish?.toString() || "0",
            navigation: product.follow?.toString() || "0",
            catalogues: normalizeCatalogues(catalogues),
            meta_title: product.meta_title || "",
            canonical: product.canonical || "",
            meta_keyword: product.meta_keyword || "",
            meta_description: product.meta_description || "",
        }));
    }, [product, catalogues]);

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

    // Cập nhật validation progress
    useEffect(() => {
        const productCode = variantManagerRef.current?.getProductCode() || "";

        setValidationProgress({
            productCode: !!productCode.trim(),
            generalInfo: !!formData.name.trim(),
            price: !!formData.price && !isNaN(parseFloat(formData.price)),
            images: !!(formData.image || formData.album.length > 0),
            variants: true, // Có thể check thêm nếu cần
        });
    }, [formData.name, formData.price, formData.image, formData.album]);

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
            catalogues: data.catalogues ?? prev.catalogues,
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

        const productCode = variantManagerRef.current?.getProductCode() || "";

        if (!productCode.trim()) {
            emit("toast:error", "Vui lòng nhập mã sản phẩm trước khi lưu!");
            return;
        }

        setIsSubmitting(true);

        const variantData = variantManagerRef.current?.getVariantData() || {
            variant: null,
            productVariant: null,
            attribute: null,
        };

        const submitData = {
            name: formData.name,
            description: formData.description,
            content: formData.content,
            price: formData.price,
            code: productCode,
            image: formData.image,
            album: formData.album,
            product_catalogue_id: formData.parentCategory,
            publish: formData.status,
            follow: formData.navigation,
            catalogues: formData.catalogues,
            meta_title: formData.meta_title,
            canonical: formData.canonical,
            meta_keyword: formData.meta_keyword,
            meta_description: formData.meta_description,
            variant: variantData.variant,
            productVariant: variantData.productVariant,
            attribute: variantData.attribute,
        };

        const submitRoute = isEdit
            ? route("admin.product.update", product.id)
            : route("admin.product.store");

        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            onSuccess: () => {
                setErrors({});
            },
            onError: (errors) => {
                console.log("Errors:", errors);
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
                    label: "QL Sản Phẩm",
                    link: route("admin.product.index"),
                },
                {
                    label: isEdit ? "Cập Nhật Sản Phẩm" : "Thêm Mới Sản Phẩm",
                },
            ]}
        >
            <Head title={isEdit ? "Cập Nhật Sản Phẩm" : "Thêm Mới Sản Phẩm"} />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Giá sản phẩm
                            </p>
                            <p className="text-lg font-bold text-purple-600">
                                {formData.price
                                    ? new Intl.NumberFormat("vi-VN").format(
                                          formData.price,
                                      ) + " đ"
                                    : "Chưa nhập"}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Ảnh đại diện
                            </p>
                            <Badge
                                className={cn(
                                    "mt-1",
                                    formData.image
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200",
                                )}
                            >
                                {formData.image ? "Đã có" : "Chưa có"}
                            </Badge>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Album ảnh
                            </p>
                            <p className="text-lg font-bold text-amber-600">
                                {formData.album.length} ảnh
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-amber-600" />
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
                <div className="grid grid-cols-5 gap-2 mt-3">
                    {Object.entries(validationProgress).map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center gap-1 text-xs"
                        >
                            {value ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                                <AlertCircle className="h-3 w-3 text-amber-600" />
                            )}
                            <span className="text-slate-600">
                                {key === "productCode" && "Mã SP"}
                                {key === "generalInfo" && "Thông tin"}
                                {key === "price" && "Giá"}
                                {key === "images" && "Hình ảnh"}
                                {key === "variants" && "Biến thể"}
                            </span>
                        </div>
                    ))}
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
                        description="Nhập thông tin chung về sản phẩm"
                    />

                    <AlbumUpload
                        images={formData.album}
                        onChange={handleAlbumChange}
                    />

                    <ProductVariantManager
                        ref={variantManagerRef}
                        attributeCatalogues={attributeCatalogues || []}
                        units={units || null}
                        mainPrice={formData.price}
                        productData={
                            isEdit
                                ? {
                                      ...product,
                                      product_variants: attribute || [],
                                  }
                                : null
                        }
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
                        excludeCategoryId={product?.id ?? null}
                        showInfoMessage={false}
                        errors={errors}
                    />

                    <ImageUpload
                        image={formData.image}
                        onChange={handleImageChange}
                    />

                    {/* Quick Tips Card */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200 py-3">
                            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                Mẹo nhanh
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            <p className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="text-blue-600 font-bold">
                                    •
                                </span>
                                Mã sản phẩm nên viết hoa và không dấu
                            </p>
                            <p className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="text-purple-600 font-bold">
                                    •
                                </span>
                                Ảnh đại diện nên có kích thước 1:1
                            </p>
                            <p className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="text-green-600 font-bold">
                                    •
                                </span>
                                Tạo biến thể để quản lý sản phẩm đa dạng
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Floating Save Button */}
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

// Card component tạm thời
function Card({ className, children, ...props }) {
    return (
        <div className={cn("bg-white rounded-lg", className)} {...props}>
            {children}
        </div>
    );
}

function CardContent({ className, children, ...props }) {
    return (
        <div className={cn("p-4", className)} {...props}>
            {children}
        </div>
    );
}