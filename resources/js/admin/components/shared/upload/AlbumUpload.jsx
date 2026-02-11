import { useState } from "react";
import { Upload, GripVertical } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { CKFinderHelper } from "@/admin/utils/ckfinder";
import toast from "react-hot-toast";

export default function AlbumUpload({ 
    images = [], 
    onChange,
    title = "Album Ảnh",
    description = "Chọn và tải lên hình ảnh thuộc tính (có thể kéo thả để sắp xếp)"
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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={openCKFinderAlbum}
                >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                        Click để chọn nhiều ảnh album
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Có thể chọn nhiều ảnh cùng lúc
                    </p>
                </div>

                {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`group relative rounded-xl border bg-white shadow-sm transition-all
                                    ${draggedIndex === index ? "opacity-50 scale-95" : "hover:shadow-md"}
                                `}
                            >
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden rounded-xl">
                                    <img
                                        src={img}
                                        alt={`Album ${index + 1}`}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>

                                {/* Top actions */}
                                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    {/* Drag handle */}
                                    <div className="pointer-events-auto flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
                                        <GripVertical className="h-4 w-4" />
                                        Kéo
                                    </div>

                                    {/* Delete */}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Index */}
                                <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                                    #{index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}