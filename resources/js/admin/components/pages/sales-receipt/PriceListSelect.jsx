// components/PriceListSelect.js
import React, { useState } from "react";
import { Badge } from "@/admin/components/ui/badge";
import { Tag, Loader2 } from "lucide-react";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import axios from "axios";
import { useEventBus } from "@/EventBus";
import { format } from "date-fns";

export default function PriceListSelect({
    formData,
    setFormData,
    handleChange,
    priceLists = [],
    errors = {},
    onPriceListChange,
}) {
    const { emit } = useEventBus();
    const [loadingPriceList, setLoadingPriceList] = useState(false);

    const priceListOptions =
        priceLists?.map((item) => ({
            value: String(item.id),
            label: item.name,
            start_date: item.start_date,
            end_date: item.end_date,
            description: item.description,
        })) || [];

    const handlePriceListChange = async (value) => {
        // Nếu xóa chọn bảng giá
        if (!value) {
            handleChange("price_list_id", null);
            setFormData?.((prev) => ({
                ...prev,
                price_list_id: null,
                price_list_info: null,
            }));
            if (onPriceListChange) onPriceListChange(null);
            return;
        }

        handleChange("price_list_id", parseInt(value));
        setLoadingPriceList(true);

        try {
            const response = await axios.post(
                route("admin.price.list.getDetails", value),
            );

            if (response.data?.status === "success" && response.data?.data) {
                const priceListData = response.data.data;

                // product_variants từ Laravel Collection đã serialize thành array
                // Đảm bảo luôn là array
                const variants = Array.isArray(priceListData.product_variants)
                    ? priceListData.product_variants
                    : [];

                console.log(
                    "[PriceListSelect] Price list data:",
                    priceListData,
                );
                console.log("[PriceListSelect] Variants:", variants);

                const priceListInfo = {
                    id: priceListData.id,
                    name: priceListData.name,
                    start_date: priceListData.start_date,
                    end_date: priceListData.end_date,
                    product_variants: variants,
                };

                setFormData?.((prev) => ({
                    ...prev,
                    price_list_info: priceListInfo,
                }));

                if (onPriceListChange) {
                    onPriceListChange(priceListInfo);
                }

                emit(
                    "toast:success",
                    `Đã áp dụng bảng giá "${priceListData.name}"!`,
                );
            } else {
                throw new Error("Dữ liệu không hợp lệ");
            }
        } catch (error) {
            console.error("[PriceListSelect] Error:", error);
            emit("toast:error", "Không thể lấy thông tin bảng giá!");
            // Reset nếu lỗi
            handleChange("price_list_id", null);
            setFormData?.((prev) => ({
                ...prev,
                price_list_id: null,
                price_list_info: null,
            }));
        } finally {
            setLoadingPriceList(false);
        }
    };

    return (
        <div className="space-y-2">
            <SelectCombobox
                label="Bảng giá"
                value={
                    formData.price_list_id ? String(formData.price_list_id) : ""
                }
                onChange={handlePriceListChange}
                options={priceListOptions}
                placeholder="Chọn bảng giá (nếu có)"
                searchPlaceholder="Tìm bảng giá..."
                error={errors.price_list_id}
                icon={
                    loadingPriceList ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Tag className="h-4 w-4" />
                    )
                }
                disabled={loadingPriceList}
            />

            {/* Preview thông tin bảng giá đang áp dụng */}
            {formData.price_list_info && (
                <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                            <Tag className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="font-medium text-slate-700">
                                {formData.price_list_info.name}
                            </span>
                            {formData.price_list_info.start_date && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                    Từ:{" "}
                                    {format(
                                        new Date(
                                            formData.price_list_info.start_date,
                                        ),
                                        "dd/MM/yyyy",
                                    )}
                                </Badge>
                            )}
                            {formData.price_list_info.end_date && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                    Đến:{" "}
                                    {format(
                                        new Date(
                                            formData.price_list_info.end_date,
                                        ),
                                        "dd/MM/yyyy",
                                    )}
                                </Badge>
                            )}
                        </div>
                        {Array.isArray(
                            formData.price_list_info.product_variants,
                        ) && (
                            <p className="text-xs text-slate-500">
                                {
                                    formData.price_list_info.product_variants
                                        .length
                                }{" "}
                                sản phẩm trong bảng giá
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}