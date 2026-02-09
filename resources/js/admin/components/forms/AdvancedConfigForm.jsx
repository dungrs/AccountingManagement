import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";

import CategorySelect from "@/admin/components/fields/CategorySelect";
import MultiCategorySelect from "@/admin/components/fields/MultiCategorySelect";
import StatusSelect from "@/admin/components/fields/StatusSelect";
import NavigationSelect from "@/admin/components/fields/NavigationSelect";
import { useEffect } from "react";

export default function AdvancedConfigForm({
    data,
    onChange,
    title = "Cấu hình nâng cao",
    description = "Thiết lập danh mục, tình trạng và các cấu hình",
    dropdown = {},
    navigations = [
        { value: "2", label: "Chọn điều hướng", disabled: true },
        { value: "0", label: "Không cho phép lập chỉ mục" },
        { value: "1", label: "Cho phép lập chỉ mục" },
    ],
    statusOptions = [
        { value: "2", label: "Chọn tình trạng", disabled: true },
        { value: "0", label: "Không xuất bản" },
        { value: "1", label: "Xuất bản" },
    ],
    hasCatalogue = false,
    excludeCategoryId = null,
    showInfoMessage,
    errors = {},
}) {
    const handleChange = (field, value) => {
        const newData = {
            ...data,
            [field]: value,
        };
        onChange(newData);
    };

    const categories = Object.entries(dropdown).map(([key, value]) => ({
        value: key, // GIỮ NGUYÊN STRING - không parseInt
        label: value,
    }));

    const stringExcludeId = excludeCategoryId
        ? String(excludeCategoryId)
        : null;

    const stringParentCategory = data.parentCategory
        ? String(data.parentCategory)
        : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <CategorySelect
                    value={data.parentCategory}
                    onChange={(value) => handleChange("parentCategory", value)}
                    label="Danh mục cha"
                    required
                    categories={categories}
                    excludeValue={stringExcludeId}
                    showInfoMessage={showInfoMessage}
                    errors = {errors}
                />

                {hasCatalogue && (
                    <MultiCategorySelect
                        value={data.catalogues ?? []}
                        onChange={(value) => handleChange("catalogues", value)}
                        categories={categories}
                        parentCategoryId={stringParentCategory}
                    />
                )}

                <StatusSelect
                    value={data.status}
                    onChange={(value) => handleChange("status", value)}
                    label="Tình trạng"
                    options={statusOptions}
                />

                <NavigationSelect
                    value={data.navigation}
                    onChange={(value) => handleChange("navigation", value)}
                    label="Điều hướng"
                    navigations={navigations}
                />
            </CardContent>
        </Card>
    );
}
