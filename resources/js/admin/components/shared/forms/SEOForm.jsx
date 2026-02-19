import { Info, Globe, Hash, FileText, Eye } from "lucide-react";
import { Badge } from "@/admin/components/ui/badge";
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

    const getError = (field) => {
        if (!errors[field]) return null;
        return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    };

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-white" />
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

                {/* SEO Preview */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-medium text-slate-700">
                            Xem trước
                        </h4>
                    </div>
                    <div className="space-y-1 pl-6">
                        <h3 className="text-blue-600 text-md font-medium">
                            {seoData.meta_title || "Bạn chưa có tiêu đề SEO"}
                        </h3>
                        <a
                            href="#"
                            className="text-sm text-green-700 hover:underline block break-all"
                        >
                            {seoData.canonical
                                ? `${baseUrl}/${removeUtf8(seoData.canonical)}.html`
                                : `${baseUrl}/canonical.html`}
                        </a>
                        <p className="text-sm text-gray-600">
                            {seoData.meta_description ||
                                "Bạn chưa có mô tả SEO"}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5 text-blue-600" />
                        Tiêu đề SEO
                    </Label>
                    <Input
                        placeholder="Nhập tiêu đề SEO"
                        value={seoData.meta_title}
                        onChange={(e) =>
                            handleChange("meta_title", e.target.value)
                        }
                        className={cn(
                            "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                            getError("meta_title") &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                    />
                    {getError("meta_title") && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <Info className="h-3 w-3" />
                            {getError("meta_title")}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5 text-purple-600" />
                        Từ khóa SEO
                    </Label>
                    <Input
                        placeholder="Nhập từ khóa SEO"
                        value={seoData.meta_keyword}
                        onChange={(e) =>
                            handleChange("meta_keyword", e.target.value)
                        }
                        className={cn(
                            "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                            getError("meta_keyword") &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                    />
                    {getError("meta_keyword") && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <Info className="h-3 w-3" />
                            {getError("meta_keyword")}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        Mô tả SEO
                    </Label>
                    <Textarea
                        placeholder="Nhập mô tả SEO"
                        className={cn(
                            "min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                            getError("meta_description") &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                        value={seoData.meta_description}
                        onChange={(e) =>
                            handleChange("meta_description", e.target.value)
                        }
                    />
                    {getError("meta_description") && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <Info className="h-3 w-3" />
                            {getError("meta_description")}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-purple-600" />
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
                            "border-slate-200 focus:border-purple-500 focus:ring-purple-500",
                            getError("canonical") &&
                                "border-red-500 focus-visible:ring-red-500",
                        )}
                    />

                    {getError("canonical") && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <Info className="h-3 w-3" />
                            {getError("canonical")}
                        </p>
                    )}

                    <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-gradient-to-r from-purple-50 to-blue-50 p-2 rounded-md">
                        <Info className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>
                            Ví dụ:{" "}
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs mx-1">
                                san-pham-moi
                            </Badge>{" "}
                            hoặc nhập tiếng Việt có dấu sẽ tự chuyển
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}