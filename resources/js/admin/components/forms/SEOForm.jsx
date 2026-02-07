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
import { removeUtf8 } from "@/admin/utils/slug";
import { cn } from "@/admin/lib/utils";

export default function SEOForm({
    seoData,
    onChange,
    errors = {},
    baseUrl = "https://2024.is.shop",
    title = "Cấu hình SEO",
    description = "Thiết lập các dữ liệu về khóa SEO",
}) {
    const handleChange = (field, value) => {
        onChange({
            ...seoData,
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

                {/* SEO Preview */}
                <div className="space-y-1">
                    <h3 className="text-blue-600 text-md font-medium">
                        {seoData.meta_title || "Bạn chưa có tiêu đề SEO"}
                    </h3>
                    <a
                        href="#"
                        className="text-sm text-green-700 hover:underline block"
                    >
                        {seoData.canonical
                            ? `${baseUrl}/${removeUtf8(seoData.canonical)}.html`
                            : `${baseUrl}/canonical.html`}
                    </a>
                    <p className="text-sm text-gray-600">
                        {seoData.meta_description || "Bạn chưa có mô tả SEO"}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Tiêu đề SEO</Label>
                    <Input
                        placeholder="Nhập tiêu đề SEO"
                        value={seoData.meta_title}
                        onChange={(e) =>
                            handleChange("meta_title", e.target.value)
                        }
                        className={cn(
                            getError("meta_title") &&
                                "border-red-500 focus-visible:ring-red-500"
                        )}
                    />
                    {getError("meta_title") && (
                        <p className="text-sm text-red-500">
                            {getError("meta_title")}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Từ khóa SEO</Label>
                    <Input
                        placeholder="Nhập từ khóa SEO"
                        value={seoData.meta_keyword}
                        onChange={(e) =>
                            handleChange("meta_keyword", e.target.value)
                        }
                        className={cn(
                            getError("meta_keyword") &&
                                "border-red-500 focus-visible:ring-red-500"
                        )}
                    />
                    {getError("meta_keyword") && (
                        <p className="text-sm text-red-500">
                            {getError("meta_keyword")}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Mô tả SEO</Label>
                    <Textarea
                        placeholder="Nhập mô tả SEO"
                        className={cn(
                            "min-h-[100px]",
                            getError("meta_description") &&
                                "border-red-500 focus-visible:ring-red-500"
                        )}
                        value={seoData.meta_description}
                        onChange={(e) =>
                            handleChange("meta_description", e.target.value)
                        }
                    />
                    {getError("meta_description") && (
                        <p className="text-sm text-red-500">
                            {getError("meta_description")}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>
                        Đường dẫn (Canonical){" "}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        placeholder="Nhập đường dẫn"
                        value={seoData.canonical}
                        onChange={(e) => {
                            handleChange("canonical", e.target.value);
                        }}
                        className={cn(
                            getError("canonical") &&
                                "border-red-500 focus-visible:ring-red-500"
                        )}
                    />

                    {getError("canonical") && (
                        <p className="text-sm text-red-500">
                            {getError("canonical")}
                        </p>
                    )}

                    <p className="text-xs text-gray-500">
                        Ví dụ: san-pham-moi hoặc nhập tiếng Việt có dấu sẽ tự
                        chuyển
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}