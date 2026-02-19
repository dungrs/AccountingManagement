import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";

import CategorySelect from "@/admin/components/shared/fields/CategorySelect";
import MultiCategorySelect from "@/admin/components/shared/fields/MultiCategorySelect";
import StatusSelect from "@/admin/components/shared/fields/StatusSelect";
import NavigationSelect from "@/admin/components/shared/fields/NavigationSelect";
import { Settings } from "lucide-react";

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
        value: key,
        label: value,
    }));

    const stringExcludeId = excludeCategoryId
        ? String(excludeCategoryId)
        : null;

    const stringParentCategory = data.parentCategory
        ? String(data.parentCategory)
        : null;

    return (
        <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-white" />
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
                <CategorySelect
                    value={data.parentCategory}
                    onChange={(value) => handleChange("parentCategory", value)}
                    label="Danh mục cha"
                    required
                    categories={categories}
                    excludeValue={stringExcludeId}
                    showInfoMessage={showInfoMessage}
                    errors={errors}
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