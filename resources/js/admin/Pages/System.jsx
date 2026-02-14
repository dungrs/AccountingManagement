"use client";

import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Button } from "@/admin/components/ui/button";
import { Head, usePage } from "@inertiajs/react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/admin/components/ui/badge";
import axios from "axios";
import { cn } from "@/admin/lib/utils";
import { CKEditorHelper } from "@/admin/utils/ckeditor";

export default function Home() {
    const { systemLanguage, systemConfigs, availableLanguages } =
        usePage().props;

    // State
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState("");
    const editorInitRef = useRef(false);

    // Initialize
    useEffect(() => {
        console.log("Language:", systemLanguage);
        console.log("Configs:", systemConfigs);
        console.log("Available Languages:", availableLanguages);

        // Khởi tạo formData từ systemLanguage
        if (systemLanguage && typeof systemLanguage === "object") {
            setFormData(systemLanguage);
        }

        // Set active language mặc định
        if (availableLanguages && availableLanguages.length > 0) {
            setActiveLanguage(availableLanguages[0].canonical);
        }
    }, [systemLanguage, systemConfigs, availableLanguages]);

    // Khởi tạo CKEditor
    useEffect(() => {
        const initEditors = async () => {
            if (editorInitRef.current) return;

            setTimeout(async () => {
                try {
                    await CKEditorHelper.init(".ckeditor-classic");
                    editorInitRef.current = true;
                } catch (error) {
                    console.error("Failed to initialize CKEditor:", error);
                }
            }, 100);
        };

        initEditors();

        return () => {
            CKEditorHelper.destroy(".ckeditor-classic");
            editorInitRef.current = false;
        };
    }, []);

    // Update CKEditor data
    useEffect(() => {
        if (!editorInitRef.current) return;

        const editorElements = document.querySelectorAll(".ckeditor-classic");
        editorElements.forEach((el) => {
            if (el.ckEditorInstance) {
                const fieldKey = el.dataset.fieldKey;
                const currentValue = formData[fieldKey] || "";
                const currentData = el.ckEditorInstance.getData();

                if (currentData !== currentValue) {
                    el.ckEditorInstance.setData(currentValue);
                }
            }
        });
    }, [formData]);

    // Toast khi có lỗi validate
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors)
                .flat()
                .filter(Boolean)
                .join(", ");

            if (errorMessages) {
                toast.error(errorMessages);
            }
        }
    }, [errors]);

    const handleInputChange = (fieldKey, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldKey]: value,
        }));

        // Clear error khi user nhập lại
        setErrors((prev) => ({
            ...prev,
            [fieldKey]: null,
        }));
    };

    const handleCKEditorChange = (fieldKey, value) => {
        handleInputChange(fieldKey, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Tạo payload đúng format
        const submitData = {
            language_id: 1,
            config: { ...formData },
        };

        try {
            const response = await axios.post(
                route("admin.system.create"),
                submitData,
            );

            toast.success(response.data?.message || "Lưu cấu hình thành công!");
        } catch (err) {
            console.error("Submit error:", err);

            // Validate error từ Laravel (422 Unprocessable Entity)
            if (err.response?.status === 422) {
                const validationErrors = err.response.data?.errors || {};
                setErrors(validationErrors);
                return;
            }

            // Lỗi khác
            toast.error(
                err.response?.data?.message ||
                    "Có lỗi xảy ra khi lưu cấu hình!",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCKFinder = (fieldKey) => {
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
                handleInputChange(fieldKey, fileUrl);
                toast.success("Đã chọn ảnh thành công!");
            },
            removePlugins: "basket",
        });
    };

    const removeImage = (fieldKey) => {
        handleInputChange(fieldKey, "");
        toast.success("Đã xóa ảnh!");
    };

    // Sắp xếp các group theo index
    const sortedGroups = Object.entries(systemConfigs || {}).sort(
        ([, a], [, b]) => (a.index || "").localeCompare(b.index || ""),
    );

    // Kiểm tra xem ngôn ngữ có dữ liệu chưa
    const hasLanguageData = (languageId) => {
        return Object.keys(formData).length > 0;
    };

    // ===== Render trường ảnh =====
    const renderImageField = (fullFieldKey, field, fieldValue) => {
        const hasError = errors[fullFieldKey];

        return (
            <div className="space-y-2">
                <Label htmlFor={fullFieldKey}>
                    {field.label}
                    {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                    )}
                </Label>

                {/* Input và nút chọn ảnh */}
                <div className="flex items-center gap-2">
                    <Input
                        id={fullFieldKey}
                        readOnly
                        placeholder={
                            field.placeholder || "Nhấn nút chọn ảnh..."
                        }
                        value={fieldValue}
                        className={cn(
                            "flex-1",
                            hasError &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => openCKFinder(fullFieldKey)}
                        disabled={isSubmitting}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Chọn ảnh
                    </Button>
                    {fieldValue && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeImage(fullFieldKey)}
                            disabled={isSubmitting}
                        >
                            <X className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                </div>

                {/* Error message */}
                {hasError && (
                    <p className="text-red-500 text-sm">
                        {Array.isArray(hasError) ? hasError[0] : hasError}
                    </p>
                )}

                {/* Help link */}
                {field.link && (
                    <p className="text-xs text-muted-foreground">
                        <a
                            href={field.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {field.link.text}
                        </a>
                    </p>
                )}
            </div>
        );
    };

    // ===== Render trường text/textarea =====
    const renderTextField = (fullFieldKey, field, fieldValue) => {
        const hasError = errors[fullFieldKey];
        const isTextarea =
            field.type === "textarea" || field.type === "editor";

        return (
            <div className="space-y-2">
                <Label htmlFor={fullFieldKey}>
                    {field.label}
                    {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                    )}
                </Label>

                {isTextarea ? (
                    <div className="border rounded-md">
                        <Textarea
                            id={fullFieldKey}
                            placeholder={field.placeholder || ""}
                            value={fieldValue}
                            onChange={(e) =>
                                handleInputChange(fullFieldKey, e.target.value)
                            }
                            onInput={(e) => {
                                handleCKEditorChange(
                                    fullFieldKey,
                                    e.target.value,
                                );
                            }}
                            data-field-key={fullFieldKey}
                            rows={field.type === "editor" ? 8 : 4}
                            className={cn(
                                "resize-none border-0 focus-visible:ring-0 ckeditor-classic",
                                hasError &&
                                    "border border-red-500 focus-visible:ring-red-500",
                            )}
                        />
                    </div>
                ) : (
                    <Input
                        id={fullFieldKey}
                        type={field.type || "text"}
                        placeholder={field.placeholder || ""}
                        value={fieldValue}
                        onChange={(e) =>
                            handleInputChange(fullFieldKey, e.target.value)
                        }
                        className={cn(
                            hasError &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                    />
                )}

                {/* Error message */}
                {hasError && (
                    <p className="text-red-500 text-sm">
                        {Array.isArray(hasError) ? hasError[0] : hasError}
                    </p>
                )}

                {/* Help link */}
                {field.link && (
                    <p className="text-xs text-muted-foreground">
                        <a
                            href={field.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {field.link.text}
                        </a>
                    </p>
                )}
            </div>
        );
    };

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Cấu hình hệ thống",
                },
            ]}
        >
            <Head title="Cấu hình hệ thống" />

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Language Tabs */}
                {availableLanguages && availableLanguages.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Chọn ngôn ngữ</CardTitle>
                            <CardDescription>
                                Cấu hình hệ thống theo từng ngôn ngữ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {availableLanguages.map((language) => (
                                    <Button
                                        key={language.id}
                                        type="button"
                                        variant={
                                            activeLanguage ===
                                            language.canonical
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            setActiveLanguage(
                                                language.canonical,
                                            )
                                        }
                                        className="whitespace-nowrap"
                                    >
                                        <span className="mr-2">
                                            {language.name}
                                        </span>
                                        {hasLanguageData(language.id) ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-gray-400" />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Content - System Config Groups */}
                <div className="space-y-6">
                    {sortedGroups.map(([groupKey, group]) => (
                        <Card key={groupKey}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <CardTitle>{group.label}</CardTitle>
                                        {group.description && (
                                            <CardDescription className="mt-1">
                                                {group.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(group.value || {}).map(
                                        ([fieldKey, field]) => {
                                            const fullFieldKey = `${groupKey}_${fieldKey}`;
                                            const fieldValue =
                                                formData[fullFieldKey] || "";

                                            // Kiểm tra nếu là trường hình ảnh
                                            const isImageField =
                                                field.type === "image" ||
                                                fullFieldKey.includes(
                                                    "logo",
                                                ) ||
                                                fullFieldKey.includes(
                                                    "favicon",
                                                ) ||
                                                fullFieldKey.includes(
                                                    "image",
                                                ) ||
                                                fullFieldKey.includes(
                                                    "banner",
                                                ) ||
                                                fullFieldKey.includes(
                                                    "thumbnail",
                                                );

                                            return (
                                                <div
                                                    key={fieldKey}
                                                    className={
                                                        field.type ===
                                                            "textarea" ||
                                                        field.type ===
                                                            "editor" ||
                                                        isImageField
                                                            ? "md:col-span-2"
                                                            : ""
                                                    }
                                                >
                                                    {isImageField
                                                        ? renderImageField(
                                                              fullFieldKey,
                                                              field,
                                                              fieldValue,
                                                          )
                                                        : renderTextField(
                                                              fullFieldKey,
                                                              field,
                                                              fieldValue,
                                                          )}
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                        disabled={isSubmitting}
                    >
                        Hủy bỏ
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}