import { useEffect, useRef } from "react";
import { Info } from "lucide-react";
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
import { CKEditorHelper } from "@/admin/utils/ckeditor";
import { cn } from "@/admin/lib/utils";

export default function GeneralInfoForm({
    data,
    errors = {},
    onChange,
    title = "Thông tin chung",
    description = "Nhập thông tin chung về loại thuộc tính",
    fields = {
        showTitle: true,
        showDescription: true,
        showContent: true,
    },
}) {
    const isInitialized = useRef(false);

    useEffect(() => {
        // Khởi tạo CKEditor
        const initEditors = async () => {
            if (isInitialized.current) return;

            // Đợi DOM render xong
            setTimeout(async () => {
                try {
                    await CKEditorHelper.init(".ckeditor-classic");
                    isInitialized.current = true;
                } catch (error) {
                    console.error("Failed to initialize CKEditor:", error);
                }
            }, 100);
        };

        initEditors();

        return () => {
            CKEditorHelper.destroy(".ckeditor-classic");
            isInitialized.current = false;
        };
    }, []);

    // Update CKEditor data khi data thay đổi (cho Edit mode)
    useEffect(() => {
        if (!isInitialized.current) return;

        // Set data cho description editor
        const descriptionEditors = document.querySelectorAll('.ckeditor-description');
        descriptionEditors.forEach((el) => {
            if (el.ckEditorInstance && data.description !== undefined) {
                const currentData = el.ckEditorInstance.getData();
                if (currentData !== data.description) {
                    el.ckEditorInstance.setData(data.description || '');
                }
            }
        });

        // Set data cho content editor
        const contentEditors = document.querySelectorAll('.ckeditor-content');
        contentEditors.forEach((el) => {
            if (el.ckEditorInstance && data.content !== undefined) {
                const currentData = el.ckEditorInstance.getData();
                if (currentData !== data.content) {
                    el.ckEditorInstance.setData(data.content || '');
                }
            }
        });
    }, [data.description, data.content]);

    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    // Helper để lấy error message
    const getError = (field) => {
        if (!errors[field]) return null;
        return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                        Các trường có dấu (*) là bắt buộc nhập
                    </p>
                </div>

                {fields.showTitle && (
                    <div className="space-y-2">
                        <Label>
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="Nhập tiêu đề"
                            value={data.name}
                            onChange={(e) => {
                                handleChange("name", e.target.value);
                            }}
                            className={cn(
                                getError("name") &&
                                    "border-red-500 focus-visible:ring-red-500"
                            )}
                        />

                        {getError("name") && (
                            <p className="text-sm text-red-500">
                                {getError("name")}
                            </p>
                        )}
                    </div>
                )}

                {fields.showDescription && (
                    <div className="space-y-2">
                        <Label>Mô tả ngắn</Label>
                        <div className="border rounded-md">
                            <Textarea
                                placeholder="Nhập mô tả ngắn"
                                className={cn(
                                    "min-h-[100px] border-0 focus-visible:ring-0 ckeditor-classic ckeditor-description",
                                    getError("description") &&
                                        "border border-red-500"
                                )}
                                value={data.description}
                                onInput={(e) => {
                                    handleChange("description", e.target.value);
                                }}
                            />
                        </div>
                        {getError("description") && (
                            <p className="text-sm text-red-500">
                                {getError("description")}
                            </p>
                        )}
                    </div>
                )}

                {fields.showContent && (
                    <div className="space-y-2">
                        <Label>Nội dung</Label>
                        <div className="border rounded-md">
                            <Textarea
                                placeholder="Nhập nội dung"
                                className={cn(
                                    "min-h-[150px] border-0 focus-visible:ring-0 ckeditor-classic ckeditor-content",
                                    getError("content") &&
                                        "border border-red-500"
                                )}
                                value={data.content}
                                onInput={(e) => {
                                    handleChange("content", e.target.value);
                                }}
                            />
                        </div>
                        {getError("content") && (
                            <p className="text-sm text-red-500">
                                {getError("content")}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}