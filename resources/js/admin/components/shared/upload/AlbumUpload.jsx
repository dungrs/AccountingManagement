import { useState } from "react";
import { Upload, GripVertical, Images, Trash2, Move, Plus } from "lucide-react";
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

export default function AlbumUpload({
    images = [],
    onChange,
    title = "Album Ảnh",
    description = "Chọn và tải lên hình ảnh thuộc tính (có thể kéo thả để sắp xếp)",
}) {
    const [draggedIndex, setDraggedIndex] = useState(null);

    const openCKFinderAlbum = () => {
        CKFinderHelper.open({
            multiple: true,
            onSelect: (selectedFiles) => {
                let newImages = [];

                if (Array.isArray(selectedFiles)) {
                    newImages = selectedFiles;
                } else if (selectedFiles && typeof selectedFiles === "object") {
                    newImages = Object.values(selectedFiles);
                } else {
                    newImages = [selectedFiles];
                }

                onChange([...images, ...newImages]);
                toast.success(`Đã thêm ${newImages.length} ảnh vào album!`);
            },
        });
    };

    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === index) return;

        const newAlbum = [...images];
        const draggedItem = newAlbum[draggedIndex];

        newAlbum.splice(draggedIndex, 1);
        newAlbum.splice(index, 0, draggedItem);

        onChange(newAlbum);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const removeImage = (index) => {
        onChange(images.filter((_, i) => i !== index));
        toast.success("Đã xóa ảnh!");
    };

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Images className="h-4 w-4 text-white" />
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
                {/* Upload Area */}
                <div
                    className="relative group cursor-pointer"
                    onClick={openCKFinderAlbum}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur" />
                    <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-slate-700 font-medium">
                                    Click để chọn nhiều ảnh album
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Có thể chọn nhiều ảnh cùng lúc
                                </p>
                            </div>
                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-3 py-1">
                                <Plus className="h-3 w-3 mr-1" />
                                Thêm ảnh
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Album Grid */}
                {images.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="bg-blue-100 text-blue-700 border-blue-200"
                                >
                                    <Images className="h-3.5 w-3.5 mr-1" />
                                    {images.length} ảnh
                                </Badge>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Move className="h-3 w-3" />
                                    Kéo thả để sắp xếp
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={openCKFinderAlbum}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm ảnh
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((img, index) => (
                                <div
                                    key={index}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        "group relative rounded-xl overflow-hidden border-2 bg-white shadow-sm transition-all cursor-move",
                                        draggedIndex === index
                                            ? "opacity-50 scale-95 border-blue-500 shadow-lg"
                                            : "border-slate-200 hover:border-blue-500 hover:shadow-md",
                                    )}
                                >
                                    {/* Image */}
                                    <div className="relative aspect-square overflow-hidden">
                                        <img
                                            src={img}
                                            alt={`Album ${index + 1}`}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Top actions */}
                                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Drag handle */}
                                        <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-600 shadow-lg border border-slate-200">
                                            <GripVertical className="h-3.5 w-3.5 text-blue-600" />
                                            <span>Kéo</span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(index);
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Index Badge */}
                                    <div className="absolute bottom-2 left-2">
                                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                                            #{index + 1}
                                        </Badge>
                                    </div>

                                    {/* Drag indicator */}
                                    {draggedIndex === index && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/20 backdrop-blur-sm">
                                            <div className="bg-white rounded-full p-2 shadow-xl">
                                                <Move className="h-6 w-6 text-blue-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {images.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                <Images className="h-8 w-8 text-blue-600/50" />
                            </div>
                            <p className="text-slate-600 font-medium">
                                Album trống
                            </p>
                            <p className="text-sm text-slate-400 max-w-sm">
                                Click vào ô bên trên để thêm ảnh vào album. Có
                                thể chọn nhiều ảnh cùng lúc.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}