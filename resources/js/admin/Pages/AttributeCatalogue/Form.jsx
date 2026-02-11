"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Button } from "@/admin/components/ui/button";
import { Head, usePage, router } from "@inertiajs/react";

import GeneralInfoForm from "@/admin/components/shared/forms/GeneralInfoForm";
import SEOForm from "@/admin/components/shared/forms/SEOForm";
import AdvancedConfigForm from "@/admin/components/shared/forms/AdvancedConfigForm";
import ImageUpload from "@/admin/components/shared/upload/ImageUpload";
// import AlbumUpload from "@/admin/components/upload/AlbumUpload";

import { useEventBus } from "@/EventBus";

export default function FormCatalogue() {
    const {
        dropdown,
        attributeCatalogue,
        errors: serverErrors,
        flash,
    } = usePage().props;
    const { emit } = useEventBus();

    // Kiểm tra xem đang ở chế độ Edit hay Create
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

    // Load dữ liệu khi Edit
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

        // Clear errors khi user nhập
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

        // Clear errors khi user nhập
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

        // Clear errors khi user nhập
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

        // Clear tất cả errors trước khi submit
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

        // Xác định route và method dựa vào chế độ Edit/Create
        const submitRoute = isEdit
            ? route("admin.attribute.catalogue.update", attributeCatalogue.id)
            : route("admin.attribute.catalogue.store");

        // Sử dụng PUT cho Edit, POST cho Create
        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,

            onSuccess: () => {
                setErrors({});

                emit("toast.attribute.catalogue.success", {
                    action: isEdit ? "update" : "create",
                    message: isEdit
                        ? "Cập nhật loại thuộc tính thành công!"
                        : "Thêm mới loại thuộc tính thành công!",
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
                    label: "QL Thuộc Tính",
                    link: route("admin.attribute.catalogue.index"),
                },
                {
                    label: isEdit ? "Cập Nhật Loại Thuộc Tính" : "Thêm Mới Loại Thuộc Tính",
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
                        excludeCategoryId={attributeCatalogue?.id ?? null}
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
