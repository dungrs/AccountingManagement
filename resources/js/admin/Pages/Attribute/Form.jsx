"use client";

import { useState, useEffect } from "react";
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

    // Kiểm tra xem đang ở chế độ Edit hay Create
    const isEdit = !!attribute;
    useEffect(() => {
        console.log(attribute);
    }, []);

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

            // ✅ nhận catalogues từ props
            catalogues: normalizeCatalogues(catalogues),

            meta_title: attribute.meta_title || "",
            canonical: attribute.canonical || "",
            meta_keyword: attribute.meta_keyword || "",
            meta_description: attribute.meta_description || "",
        }));
    }, [attribute, catalogues]);

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
            catalogues: data.catalogues ?? prev.catalogues, // ✅ GIỮ LẠI
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

            attribute_catalogue_id: formData.parentCategory,
            publish: formData.status,
            follow: formData.navigation,

            // ✅ THÊM DÒNG NÀY
            catalogues: formData.catalogues,

            meta_title: formData.meta_title,
            canonical: formData.canonical,
            meta_keyword: formData.meta_keyword,
            meta_description: formData.meta_description,
        };

        // Xác định route và method dựa vào chế độ Edit/Create
        const submitRoute = isEdit
            ? route("admin.attribute.update", attribute.id)
            : route("admin.attribute.store");

        // Sử dụng PUT cho Edit, POST cho Create
        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,

            onSuccess: () => {
                setErrors({});

                emit("toast.attribute.success", {
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
                    link: route("admin.attribute.index"),
                },
                {
                    label: isEdit ? "Cập Nhật Thuộc Tính" : "Thêm Mới Thuộc Tính",
                },
            ]}
        >
            <Head
                title={
                    isEdit
                        ? "Cập Nhật Thuộc Tính"
                        : "Thêm Mới Thuộc Tính"
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
                            catalogues: formData.catalogues, // ✅
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
