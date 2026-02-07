import { Upload } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { CKFinderHelper } from "@/admin/utils/ckfinder";
import toast from "react-hot-toast";

export default function ImageUpload({ 
    image, 
    onChange, 
    title = "Ảnh đại diện",
    description = "Chọn ảnh đại diện nhận diện" 
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={openImagePicker}
                >
                    {image ? (
                        <img
                            src={image}
                            alt="Ảnh đại diện"
                            className="w-full h-full object-cover rounded"
                        />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                                Upload ảnh
                            </p>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}