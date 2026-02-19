import { useEffect, useRef } from "react";
import { Info, FileText, AlignLeft, Type } from "lucide-react";
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
import { Badge } from "@/admin/components/ui/badge";
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
        const initEditors = async () => {
            if (isInitialized.current) return;

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

    useEffect(() => {
        if (!isInitialized.current) return;

        const descriptionEditors = document.querySelectorAll(
            ".ckeditor-description",
        );
        descriptionEditors.forEach((el) => {
            if (el.ckEditorInstance && data.description !== undefined) {
                const currentData = el.ckEditorInstance.getData();
                if (currentData !== data.description) {
                    el.ckEditorInstance.setData(data.description || "");
                }
            }
        });

        const contentEditors = document.querySelectorAll(".ckeditor-content");
        contentEditors.forEach((el) => {
            if (el.ckEditorInstance && data.content !== undefined) {
                const currentData = el.ckEditorInstance.getData();
                if (currentData !== data.content) {
                    el.ckEditorInstance.setData(data.content || "");
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

    const getError = (field) => {
        if (!errors[field]) return null;
        return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    };

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-slate-800">
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm text-slate-700">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p>
                        Các trường có dấu{" "}
                        <Badge
                            variant="outline"
                            className="bg-red-100 text-red-600 border-red-200 mx-1 px-1.5"
                        >
                            *
                        </Badge>{" "}
                        là bắt buộc nhập
                    </p>
                </div>

                {fields.showTitle && (
                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-1">
                            <Type className="h-3.5 w-3.5 text-blue-600" />
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="Nhập tiêu đề"
                            value={data.name}
                            onChange={(e) => {
                                handleChange("name", e.target.value);
                            }}
                            className={cn(
                                "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                getError("name") &&
                                    "border-red-500 focus-visible:ring-red-500",
                            )}
                        />

                        {getError("name") && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <Info className="h-3 w-3" />
                                {getError("name")}
                            </p>
                        )}
                    </div>
                )}

                {fields.showDescription && (
                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-1">
                            <AlignLeft className="h-3.5 w-3.5 text-purple-600" />
                            Mô tả ngắn
                        </Label>
                        <div className="border border-slate-200 rounded-md overflow-hidden focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                            <Textarea
                                placeholder="Nhập mô tả ngắn"
                                className={cn(
                                    "min-h-[100px] border-0 focus-visible:ring-0 ckeditor-classic ckeditor-description",
                                    getError("description") &&
                                        "border border-red-500",
                                )}
                                value={data.description}
                                onInput={(e) => {
                                    handleChange("description", e.target.value);
                                }}
                            />
                        </div>
                        {getError("description") && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <Info className="h-3 w-3" />
                                {getError("description")}
                            </p>
                        )}
                    </div>
                )}

                {fields.showContent && (
                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            Nội dung
                        </Label>
                        <div className="border border-slate-200 rounded-md overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                            <Textarea
                                placeholder="Nhập nội dung"
                                className={cn(
                                    "min-h-[150px] border-0 focus-visible:ring-0 ckeditor-classic ckeditor-content",
                                    getError("content") &&
                                        "border border-red-500",
                                )}
                                value={data.content}
                                onInput={(e) => {
                                    handleChange("content", e.target.value);
                                }}
                            />
                        </div>
                        {getError("content") && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <Info className="h-3 w-3" />
                                {getError("content")}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}