"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import { Head, usePage, router } from "@inertiajs/react";

import GeneralInfoForm from "@/admin/components/forms/GeneralInfoForm";
import SEOForm from "@/admin/components/forms/SEOForm";
import AdvancedConfigForm from "@/admin/components/forms/AdvancedConfigForm";
import ImageUpload from "@/admin/components/upload/ImageUpload";
// import AlbumUpload from "@/admin/components/upload/AlbumUpload";

import { useEventBus } from "@/EventBus";

export default function FormCatalogue() {
    const {
        dropdown,
        productCatalogue,
        errors: serverErrors,
        flash,
    } = usePage().props;

    const { emit } = useEventBus();

    // Kiểm tra đang edit hay create
    const isEdit = !!productCatalogue;

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

    // Load dữ liệu khi Edit
    useEffect(() => {
        if (productCatalogue) {
            setFormData({
                name: productCatalogue.name || "",
                description: productCatalogue.description || "",
                content: productCatalogue.content || "",

                album: productCatalogue.album || [],
                image: productCatalogue.image || null,

                parentCategory: productCatalogue.parent_id?.toString() || "0",
                status: productCatalogue.publish?.toString() || "0",
                navigation: productCatalogue.follow?.toString() || "0",

                meta_title: productCatalogue.meta_title || "",
                canonical: productCatalogue.canonical || "",
                meta_keyword: productCatalogue.meta_keyword || "",
                meta_description: productCatalogue.meta_description || "",
            });
        }
    }, [productCatalogue]);

    // Flash message
    useEffect(() => {
        if (flash?.success) {
            emit("toast:success", flash.success);
        }
        if (flash?.error) {
            emit("toast:error", flash.error);
        }
    }, [flash, emit]);

    // Server errors
    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
        }
    }, [serverErrors]);

    const clearFieldErrors = (fields) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            fields.forEach((field) => {
                delete newErrors[field];
            });
            return newErrors;
        });
    };

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

    const handleSubmit = () => {
        if (isSubmitting) return;

        setErrors({});

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
            ? route("admin.product.catalogue.update", productCatalogue.id)
            : route("admin.product.catalogue.store");

        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,

            onSuccess: () => {
                setErrors({});

                emit("toast.product.catalogue.success", {
                    action: isEdit ? "update" : "create",
                    message: isEdit
                        ? "Cập nhật nhóm sản phẩm thành công!"
                        : "Thêm mới nhóm sản phẩm thành công!",
                });
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

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "QL Nhóm Sản Phẩm",
                    link: route("admin.product.catalogue.index"),
                },
                                {
                    label: isEdit ? "Cập Nhật Nhóm Sản Phẩm" : "Thêm Mới Nhóm Sản Phẩm",
                },
            ]}
        >
            <Head
                title={
                    isEdit ? "Cập Nhật Nhóm Sản Phẩm" : "Thêm Mới Nhóm Sản Phẩm"
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <GeneralInfoForm
                        data={{
                            name: formData.name,
                            description: formData.description,
                            content: formData.content,
                        }}
                        description="Nhập thông tin chung về nhóm sản phẩm"
                        onChange={handleGeneralChange}
                        errors={errors}
                    />

                    {/* <AlbumUpload
                        images={formData.album}
                        onChange={handleAlbumChange}
                    /> */}

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
                        excludeCategoryId={productCatalogue?.id ?? null}
                    />

                    <ImageUpload
                        image={formData.image}
                        onChange={handleImageChange}
                    />
                </div>
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
