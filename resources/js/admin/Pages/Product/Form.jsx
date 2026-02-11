"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import { Head, usePage, router } from "@inertiajs/react";

import GeneralInfoForm from "@/admin/components/shared/forms/GeneralInfoForm";
import SEOForm from "@/admin/components/shared/forms/SEOForm";
import AdvancedConfigForm from "@/admin/components/shared/forms/AdvancedConfigForm";
import ImageUpload from "@/admin/components/shared/upload/ImageUpload";
import AlbumUpload from "@/admin/components/shared/upload/AlbumUpload";

import { useEventBus } from "@/EventBus";
import { parseJsonArray } from "@/admin/utils/parseJsonArray";
import ProductVariantManager from "@/admin/components/pages/product/ProductVariantManager";

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
        attribute, // Nhận attribute từ controller
        attributeCatalogues,
        errors: serverErrors,
        flash,
    } = usePage().props;
    const { emit } = useEventBus();

    const isEdit = !!product;

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Validation phía client
        if (formData.status === "2") {
            emit("toast:error", "Vui lòng chọn tình trạng!");
            return;
        }

        if (formData.navigation === "2") {
            emit("toast:error", "Vui lòng chọn điều hướng!");
            return;
        }

        // 🔥 Lấy mã sản phẩm
        const productCode = variantManagerRef.current?.getProductCode() || "";

        // ❌ CHẶN SUBMIT nếu chưa nhập mã sản phẩm
        if (!productCode.trim()) {
            emit("toast:error", "Vui lòng nhập mã sản phẩm trước khi lưu!");
            return;
        }

        setIsSubmitting(true);

        // Lấy variant data
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
            code: productCode, // ✅ đảm bảo luôn có mã

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

        console.log("Submit Data:", submitData);

        const submitRoute = isEdit
            ? route("admin.product.update", product.id)
            : route("admin.product.store");

        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,

            onSuccess: () => {
                setErrors({});

                emit(
                    "toast:success",
                    isEdit
                        ? "Cập nhật sản phẩm thành công!"
                        : "Thêm mới sản phẩm thành công!",
                );
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
                        mainPrice={formData.price}
                        productData={
                            isEdit
                                ? {
                                      ...product,
                                      product_variants: attribute || [], // Sử dụng attribute từ controller
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
                </div>
            </div>

            {/* Floating Save Button */}
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
