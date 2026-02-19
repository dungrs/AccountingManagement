import { Upload, Image as ImageIcon, XCircle } from "lucide-react";
import { Badge } from "@/admin/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { CKFinderHelper } from "@/admin/utils/ckfinder";
import toast from "react-hot-toast";
import { cn } from "@/admin/lib/utils";

export default function ImageUpload({
    image,
    onChange,
    title = "Ảnh đại diện",
    description = "Chọn ảnh đại diện nhận diện",
}) {
    const openImagePicker = () => {
        CKFinderHelper.open({
            multiple: false,
            onSelect: (fileUrl) => {
                onChange(fileUrl);
                toast.success("Đã chọn ảnh đại diện!");
            },
        });
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        onChange(null);
        toast.success("Đã xóa ảnh đại diện!");
    };

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-slate-800">
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div
                    className={cn(
                        "relative group cursor-pointer transition-all duration-300",
                        "border-2 border-dashed rounded-xl",
                        image
                            ? "border-blue-200 hover:border-blue-400"
                            : "border-slate-200 hover:border-blue-500 hover:bg-blue-50/50",
                    )}
                    onClick={openImagePicker}
                >
                    {image ? (
                        <div className="relative aspect-video overflow-hidden rounded-xl">
                            {/* Image */}
                            <img
                                src={image}
                                alt="Ảnh đại diện"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Badge className="bg-white/90 backdrop-blur-sm text-blue-600 border-0 px-4 py-2 shadow-lg">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Đổi ảnh
                                </Badge>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleRemove}
                                    className="bg-red-500 hover:bg-red-600 shadow-lg"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Xóa
                                </Button>
                            </div>

                            {/* Status Badge */}
                            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                                Ảnh đại diện
                            </Badge>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="text-slate-700 font-medium mb-1">
                                Click để chọn ảnh đại diện
                            </p>
                            <p className="text-sm text-slate-500 mb-3">
                                Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                            </p>
                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-1.5">
                                <Upload className="h-3 w-3 mr-1" />
                                Chọn ảnh
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Preview Info */}
                {image && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                                Đường dẫn ảnh:
                            </span>
                            <code className="text-xs bg-white px-2 py-1 rounded text-blue-600 border border-blue-200 truncate max-w-[200px]">
                                {image.length > 40
                                    ? image.substring(0, 40) + "..."
                                    : image}
                            </code>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}