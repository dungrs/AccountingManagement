// admin/components/shared/vouchers/VoucherHeader.jsx
import React from "react";
import { Link } from "@inertiajs/react";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function VoucherHeader({
    isEdit,
    formData,
    indexRoute,
    type = "payment", // "payment" | "receipt"
}) {
    const getStatusText = (status) => {
        const statusMap = {
            draft: "Nháp",
            confirmed: "Đã xác nhận",
            cancelled: "Đã hủy",
        };
        return statusMap[status] || status;
    };

    const getStatusVariant = (status) => {
        const variantMap = {
            draft: "secondary",
            confirmed: "default",
            cancelled: "destructive",
        };
        return variantMap[status] || "secondary";
    };

    const getTitle = () => {
        if (!isEdit) {
            return type === "payment" ? "Thêm phiếu chi" : "Thêm phiếu thu";
        }
        return `Phiếu ${type === "payment" ? "chi" : "thu"} ${formData.code || ""}`;
    };

    const getDescription = () => {
        if (!isEdit) {
            return type === "payment" 
                ? "Tạo phiếu chi mới cho nhà cung cấp" 
                : "Tạo phiếu thu mới từ khách hàng";
        }
        return `Chỉnh sửa phiếu ${type === "payment" ? "chi" : "thu"}`;
    };

    if (!isEdit) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={indexRoute}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {getTitle()}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {getDescription()}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href={indexRoute}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {getTitle()}
                        </h1>
                        {formData.status && (
                            <Badge variant={getStatusVariant(formData.status)}>
                                {getStatusText(formData.status)}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        {getDescription()}
                    </p>
                </div>
            </div>
        </div>
    );
}