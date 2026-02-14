import React from "react";
import { Link } from "@inertiajs/react";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function ReceiptHeader({
    isEdit,
    formData,
    indexRoute,
    type = "purchase", // "purchase" | "sale"
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

    if (!isEdit) return null;

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
                            Phiếu {type === "purchase" ? "nhập" : "xuất"} {formData.code}
                        </h1>
                        <Badge variant={getStatusVariant(formData.status)}>
                            {getStatusText(formData.status)}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                        Chỉnh sửa phiếu {type === "purchase" ? "nhập" : "xuất"} hàng
                    </p>
                </div>
            </div>
        </div>
    );
}