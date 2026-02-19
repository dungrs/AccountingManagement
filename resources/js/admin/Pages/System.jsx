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
import { Badge } from "@/admin/components/ui/badge";
import { Head, usePage } from "@inertiajs/react";
import {
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Settings,
    Globe,
    Image as ImageIcon,
    FileText,
    Mail,
    Phone,
    MapPin,
    Save,
    Loader2,
    Info,
} from "lucide-react";
import toast from "react-hot-toast";
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

            if (err.response?.status === 422) {
                const validationErrors = err.response.data?.errors || {};
                setErrors(validationErrors);
                return;
            }

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
                <Label className="text-slate-700 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                    {field.label}
                    {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                    )}
                </Label>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            id={fullFieldKey}
                            readOnly
                            placeholder={
                                field.placeholder || "Nhấn nút chọn ảnh..."
                            }
                            value={fieldValue}
                            className={cn(
                                "pl-3 border-slate-200",
                                hasError &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => openCKFinder(fullFieldKey)}
                        disabled={isSubmitting}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {fieldValue && (
                    <div className="mt-2 flex items-center gap-3">
                        <img
                            src={fieldValue}
                            alt={field.label}
                            className="h-16 w-16 rounded-lg object-cover border-2 border-blue-200"
                        />
                        <span className="text-xs text-slate-500">
                            Ảnh xem trước
                        </span>
                    </div>
                )}

                {hasError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {Array.isArray(hasError) ? hasError[0] : hasError}
                    </p>
                )}

                {field.link && (
                    <p className="text-xs text-slate-500">
                        <a
                            href={field.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
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
        const isTextarea = field.type === "textarea" || field.type === "editor";

        // Chọn icon phù hợp
        const getIcon = () => {
            if (fullFieldKey.includes("email"))
                return <Mail className="h-3.5 w-3.5 text-purple-600" />;
            if (
                fullFieldKey.includes("phone") ||
                fullFieldKey.includes("hotline")
            )
                return <Phone className="h-3.5 w-3.5 text-blue-600" />;
            if (fullFieldKey.includes("address"))
                return <MapPin className="h-3.5 w-3.5 text-green-600" />;
            if (fullFieldKey.includes("meta"))
                return <FileText className="h-3.5 w-3.5 text-purple-600" />;
            return <FileText className="h-3.5 w-3.5 text-blue-600" />;
        };

        return (
            <div className="space-y-2">
                <Label className="text-slate-700 flex items-center gap-1">
                    {getIcon()}
                    {field.label}
                    {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                    )}
                </Label>

                {isTextarea ? (
                    <div className="border border-slate-200 rounded-md overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
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
                            "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                            hasError &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                    />
                )}

                {hasError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {Array.isArray(hasError) ? hasError[0] : hasError}
                    </p>
                )}

                {field.link && (
                    <p className="text-xs text-slate-500">
                        <a
                            href={field.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
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

            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Cấu hình hệ thống
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Quản lý các thông số cấu hình chung của hệ thống
                    </p>
                </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Language Tabs */}
                {availableLanguages && availableLanguages.length > 0 && (
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                    <Globe className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Chọn ngôn ngữ
                                    </CardTitle>
                                    <CardDescription>
                                        Cấu hình hệ thống theo từng ngôn ngữ
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
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
                                        className={cn(
                                            "whitespace-nowrap",
                                            activeLanguage ===
                                                language.canonical
                                                ? "btn-gradient-premium"
                                                : "border-slate-200 hover:border-blue-500 hover:bg-blue-50",
                                        )}
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
                    {sortedGroups.map(([groupKey, group], groupIndex) => (
                        <Card
                            key={groupKey}
                            className="border-slate-200 shadow-lg overflow-hidden"
                        >
                            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center",
                                            groupIndex % 2 === 0
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600"
                                                : "bg-gradient-to-r from-purple-600 to-blue-600",
                                        )}
                                    >
                                        {groupIndex === 0 && (
                                            <Globe className="h-4 w-4 text-white" />
                                        )}
                                        {groupIndex === 1 && (
                                            <Mail className="h-4 w-4 text-white" />
                                        )}
                                        {groupIndex === 2 && (
                                            <MapPin className="h-4 w-4 text-white" />
                                        )}
                                        {groupIndex === 3 && (
                                            <Settings className="h-4 w-4 text-white" />
                                        )}
                                        {groupIndex > 3 && (
                                            <FileText className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-slate-800">
                                            {group.label}
                                        </CardTitle>
                                        {group.description && (
                                            <CardDescription className="mt-1">
                                                {group.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(group.value || {}).map(
                                        ([fieldKey, field]) => {
                                            const fullFieldKey = `${groupKey}_${fieldKey}`;
                                            const fieldValue =
                                                formData[fullFieldKey] || "";

                                            const isImageField =
                                                field.type === "image" ||
                                                fullFieldKey.includes("logo") ||
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
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                        disabled={isSubmitting}
                        className="border-slate-200 hover:bg-slate-100"
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-gradient-premium min-w-[150px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Lưu cấu hình
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}