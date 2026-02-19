"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Badge } from "@/admin/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/admin/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/admin/components/ui/popover";
import { Switch } from "@/admin/components/ui/switch";
import {
    Check,
    ChevronsUpDown,
    Trash2,
    Plus,
    X,
    Package,
    Layers,
    Tag,
    Barcode,
    FileText,
    Image,
    Settings,
    Save,
    Edit,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { useEventBus } from "@/EventBus";
import AlbumUpload from "@/admin/components/shared/upload/AlbumUpload";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import React from "react";

const ProductVariantManager = forwardRef(
    (
        {
            attributeCatalogues = [],
            units = [],
            mainPrice = "",
            productData = null,
        },
        ref,
    ) => {
        const { emit } = useEventBus();

        const [productCode, setProductCode] = useState("");
        const [selectedUnit, setSelectedUnit] = useState("");
        const [variantEnabled, setVariantEnabled] = useState(false);
        const [variantItems, setVariantItems] = useState([]);
        const [variantTable, setVariantTable] = useState([]);
        const [editingRow, setEditingRow] = useState(null);
        const [editingData, setEditingData] = useState({});
        const [isInitialized, setIsInitialized] = useState(false);

        const unitOptions = Array.isArray(units)
            ? units.map((unit) => ({
                  value: unit.id,
                  label: unit.name,
              }))
            : [];

        useEffect(() => {
            console.log("Units received:", units);
            console.log("Unit options:", unitOptions);
        }, [units]);

        useEffect(() => {
            if (productData && !isInitialized) {
                console.log("ProductData received:", productData);
                setProductCode(productData.code || "");
                setSelectedUnit(productData.unit_id || "");
                loadProductVariants();
                setIsInitialized(true);
            }
        }, [productData]);

        useEffect(() => {
            if (productCode && variantTable.length > 0) {
                updateAllSKU();
            }
        }, [productCode]);

        // Effect để cập nhật unit_id cho tất cả biến thể khi selectedUnit thay đổi
        useEffect(() => {
            if (selectedUnit && variantTable.length > 0) {
                setVariantTable((prev) =>
                    prev.map((variant) => ({
                        ...variant,
                        unit_id: selectedUnit,
                    })),
                );
            }
        }, [selectedUnit]);

        const updateAllSKU = () => {
            setVariantTable((prev) =>
                prev.map((variant) => ({
                    ...variant,
                    sku: `${productCode}-${variant.variantKey}`,
                })),
            );
        };

        const loadProductVariants = async () => {
            try {
                let attributeData = {};
                if (productData?.attribute) {
                    if (typeof productData.attribute === "string") {
                        try {
                            attributeData = JSON.parse(productData.attribute);
                        } catch {
                            attributeData = {};
                        }
                    } else if (typeof productData.attribute === "object") {
                        attributeData = productData.attribute;
                    }
                }

                const variantsData = Array.isArray(
                    productData?.product_variants,
                )
                    ? productData.product_variants
                    : [];

                if (Object.keys(attributeData).length === 0) {
                    return;
                }

                setVariantEnabled(true);

                const items = Object.keys(attributeData).map(
                    (catalogueId, index) => ({
                        id: Date.now() + index,
                        catalogueId: catalogueId.toString(),
                        attributes: [],
                    }),
                );

                setVariantItems(items);

                const loadPromises = items.map(async (item) => {
                    const selectedAttributes = await loadAttributesForEdit(
                        item.id,
                        item.catalogueId,
                        attributeData[item.catalogueId],
                    );
                    return { itemId: item.id, attributes: selectedAttributes };
                });

                const loadedAttributes = await Promise.all(loadPromises);

                setVariantItems((prev) =>
                    prev.map((item) => {
                        const loaded = loadedAttributes.find(
                            (la) => la.itemId === item.id,
                        );
                        return loaded
                            ? { ...item, attributes: loaded.attributes }
                            : item;
                    }),
                );

                setTimeout(() => {
                    const itemsWithAttributes = items.map((item) => {
                        const loaded = loadedAttributes.find(
                            (la) => la.itemId === item.id,
                        );
                        return loaded
                            ? { ...item, attributes: loaded.attributes }
                            : item;
                    });

                    prepareProductVariantData(
                        itemsWithAttributes,
                        variantsData,
                    );
                }, 1000);
            } catch (error) {
                console.error("Error loading product variants:", error);
                emit("toast:error", "Không thể tải dữ liệu biến thể!");
            }
        };

        const loadAttributesForEdit = async (
            itemId,
            catalogueId,
            selectedAttributeIds,
        ) => {
            try {
                const response = await fetch(
                    `/attribute/getAttribute?attribute_catalogue_id=${catalogueId}`,
                );
                const data = await response.json();

                if (data.data && Array.isArray(data.data)) {
                    const attributes = data.data.map((attr) => ({
                        value: attr.id.toString(),
                        label: attr.name,
                    }));

                    let normalizedIds = [];
                    if (Array.isArray(selectedAttributeIds)) {
                        normalizedIds = selectedAttributeIds.map((id) =>
                            parseInt(id),
                        );
                    }

                    const selectedAttributes = attributes.filter((attr) =>
                        normalizedIds.includes(parseInt(attr.value)),
                    );

                    return selectedAttributes;
                }

                return [];
            } catch (error) {
                console.error("Error loading attributes:", error);
                return [];
            }
        };

        const handleToggleVariant = () => {
            if (!productCode) {
                emit("toast:error", "Vui lòng nhập mã sản phẩm trước!");
                return;
            }

            if (!variantEnabled) {
                setVariantEnabled(true);
                if (variantItems.length === 0) {
                    addVariantItem();
                }
            } else {
                setVariantEnabled(false);
                setVariantItems([]);
                setVariantTable([]);
            }
        };

        const addVariantItem = () => {
            setVariantItems([
                ...variantItems,
                {
                    id: Date.now(),
                    catalogueId: "",
                    attributes: [],
                },
            ]);
        };

        const removeVariantItem = (itemId) => {
            const newItems = variantItems.filter((item) => item.id !== itemId);
            setVariantItems(newItems);
            setTimeout(() => {
                prepareProductVariantData(newItems);
            }, 100);
        };

        const getSelectedCatalogueIds = () => {
            return variantItems.map((item) => item.catalogueId).filter(Boolean);
        };

        const getAvailableCatalogues = (currentItemId) => {
            const selectedIds = getSelectedCatalogueIds();
            const currentItem = variantItems.find(
                (item) => item.id === currentItemId,
            );
            const currentCatalogueId = currentItem?.catalogueId;

            return attributeCatalogues.filter(
                (cat) =>
                    !selectedIds.includes(cat.id.toString()) ||
                    cat.id.toString() === currentCatalogueId,
            );
        };

        const handleCatalogueChange = (itemId, catalogueId) => {
            setVariantItems(
                variantItems.map((item) =>
                    item.id === itemId
                        ? { ...item, catalogueId, attributes: [] }
                        : item,
                ),
            );
        };

        const handleAttributeChange = (itemId, selectedAttributes) => {
            const newItems = variantItems.map((item) =>
                item.id === itemId
                    ? { ...item, attributes: selectedAttributes }
                    : item,
            );

            setVariantItems(newItems);

            setTimeout(() => {
                prepareProductVariantData(newItems);
            }, 100);
        };

        const prepareProductVariantData = (
            items = variantItems,
            existingVariants = null,
        ) => {
            const validItems = items.filter(
                (item) => item.catalogueId && item.attributes.length > 0,
            );

            if (validItems.length === 0) {
                setVariantTable([]);
                return;
            }

            let attributes = [];
            let variants = [];
            let attributeTitle = [];

            validItems.forEach((item) => {
                let attr = [];
                let attrVariant = [];

                const catalogue = attributeCatalogues.find(
                    (cat) => cat.id.toString() === item.catalogueId,
                );
                const optionText = catalogue?.name || "";

                item.attributes.forEach((attribute) => {
                    let itemObj = {};
                    let itemVariantObj = {};

                    itemObj[optionText] = attribute.label;
                    itemVariantObj[item.catalogueId] = attribute.value;

                    attr.push(itemObj);
                    attrVariant.push(itemVariantObj);
                });

                attributes.push(attr);
                attributeTitle.push(optionText);
                variants.push(attrVariant);
            });

            if (attributes.length > 0) {
                attributes = attributes.reduce((a, b) =>
                    a.flatMap((d) => b.map((e) => ({ ...d, ...e }))),
                );
            }

            if (variants.length > 0) {
                variants = variants.reduce((a, b) =>
                    a.flatMap((d) => b.map((e) => ({ ...d, ...e }))),
                );
            }

            createVariantTable(
                attributes,
                variants,
                attributeTitle,
                existingVariants,
            );
        };

        const createVariantTable = (
            attributes,
            variants,
            attributeTitle,
            existingVariants = null,
        ) => {
            if (!attributes.length || !variants.length) {
                setVariantTable([]);
                return;
            }

            const newTable = attributes.map((attributeItem, index) => {
                const variantItem = variants[index];
                const attributeValues = Object.values(attributeItem);
                const variantValues = Object.values(variantItem);
                const attributeString = attributeValues.join(", ");
                const attributeIdString = variantValues.join(", ");
                const variantKey = attributeIdString.replace(/, /g, "-");

                const existingVariant = variantTable.find(
                    (v) => v.variantKey === variantKey,
                );

                let dbVariant = null;
                if (existingVariants && Array.isArray(existingVariants)) {
                    dbVariant = existingVariants.find(
                        (v) => v.code === variantKey,
                    );

                    if (!dbVariant && existingVariants[index]) {
                        dbVariant = existingVariants[index];
                    }

                    if (!dbVariant) {
                        dbVariant = existingVariants.find((v) => {
                            try {
                                if (!v.attribute) return false;

                                const vAttr =
                                    typeof v.attribute === "string"
                                        ? JSON.parse(v.attribute)
                                        : v.attribute || {};
                                const vKey = Object.values(vAttr).join("-");
                                return vKey === variantKey;
                            } catch (e) {
                                return false;
                            }
                        });
                    }
                }

                const sourceVariant = existingVariant || dbVariant;

                let albumArray = [];
                if (sourceVariant?.album) {
                    if (Array.isArray(sourceVariant.album)) {
                        albumArray = sourceVariant.album;
                    } else if (typeof sourceVariant.album === "string") {
                        albumArray = sourceVariant.album
                            .split(",")
                            .filter(Boolean);
                    }
                }

                const variant = {
                    variantKey,
                    attributes: attributeValues,
                    attributeIds: variantValues,
                    attributeString,
                    attributeIdString,
                    image:
                        sourceVariant?.image ||
                        (albumArray.length > 0
                            ? albumArray[0]
                            : "/backend/images/no-image.jpg"),
                    sku: sourceVariant?.sku || `${productCode}-${variantKey}`,
                    barcode: sourceVariant?.barcode || "",
                    fileName:
                        sourceVariant?.fileName ||
                        sourceVariant?.file_name ||
                        "",
                    fileUrl:
                        sourceVariant?.fileUrl || sourceVariant?.file_url || "",
                    album: albumArray,
                    // Ưu tiên: 1. Từ DB, 2. Từ selectedUnit, 3. Giữ nguyên giá trị cũ
                    unit_id: sourceVariant?.unit_id || selectedUnit || "",
                    id: sourceVariant?.id || null,
                };

                return variant;
            });

            setVariantTable(newTable);
        };

        const handleEditVariant = (variant) => {
            if (editingRow === variant.variantKey) {
                setEditingRow(null);
                setEditingData({});
            } else {
                setEditingRow(variant.variantKey);
                setEditingData({ ...variant });
            }
        };

        const handleCancelEdit = () => {
            setEditingRow(null);
            setEditingData({});
        };

        const handleSaveEdit = () => {
            setVariantTable(
                variantTable.map((v) =>
                    v.variantKey === editingRow ? { ...editingData } : v,
                ),
            );
            setEditingRow(null);
            setEditingData({});
            emit("toast:success", "Cập nhật biến thể thành công!");
        };

        const getVariantDataForSubmit = () => {
            if (!variantEnabled || variantTable.length === 0) {
                return {
                    variant: null,
                    productVariant: null,
                    attribute: null,
                };
            }

            const variantData = {
                sku: [],
                barcode: [],
                file_name: [],
                file_url: [],
                album: [],
                unit_id: [],
            };

            const productVariantData = {
                name: [],
                id: [],
            };

            const attributeData = {};
            variantItems.forEach((item) => {
                if (item.catalogueId && item.attributes.length > 0) {
                    attributeData[item.catalogueId] = item.attributes.map(
                        (attr) => parseInt(attr.value),
                    );
                }
            });

            variantTable.forEach((variant) => {
                variantData.sku.push(variant.sku || "");
                variantData.barcode.push(variant.barcode || "");
                variantData.file_name.push(variant.fileName || "");
                variantData.file_url.push(variant.fileUrl || "");
                variantData.album.push(
                    Array.isArray(variant.album)
                        ? variant.album.join(",")
                        : variant.album || "",
                );
                variantData.unit_id.push(variant.unit_id || selectedUnit || "");

                productVariantData.name.push(variant.attributeString);
                productVariantData.id.push(variant.attributeIdString);
            });

            return {
                variant: variantData,
                productVariant: productVariantData,
                attribute: attributeData,
            };
        };

        useImperativeHandle(ref, () => ({
            getVariantData: getVariantDataForSubmit,
            getProductCode: () => productCode,
            getSelectedUnit: () => selectedUnit,
        }));

        return (
            <div className="space-y-6">
                {/* Product Info Card */}
                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                <Package className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-slate-800">
                                    Thông tin sản phẩm
                                </CardTitle>
                                <CardDescription>
                                    Nhập mã sản phẩm và chọn đơn vị tính
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-1">
                                    <Tag className="h-3.5 w-3.5 text-blue-600" />
                                    Mã sản phẩm
                                </Label>
                                <Input
                                    id="product-code"
                                    placeholder="VD: PROD-001"
                                    value={productCode}
                                    onChange={(e) =>
                                        setProductCode(
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <SelectCombobox
                                    label="Đơn vị tính"
                                    value={selectedUnit}
                                    onChange={setSelectedUnit}
                                    options={unitOptions}
                                    placeholder="Chọn đơn vị tính"
                                    searchPlaceholder="Tìm kiếm đơn vị..."
                                    icon={
                                        <Package className="h-4 w-4 text-purple-600" />
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Variant Manager Card */}
                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                    <Layers className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Biến thể sản phẩm
                                    </CardTitle>
                                    <CardDescription>
                                        Tạo và quản lý các phiên bản khác nhau
                                        của sản phẩm
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge
                                    className={cn(
                                        variantEnabled
                                            ? "bg-green-100 text-green-700 border-green-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200",
                                    )}
                                >
                                    {variantEnabled ? "Đã bật" : "Đã tắt"}
                                </Badge>
                                <Switch
                                    checked={variantEnabled}
                                    onCheckedChange={handleToggleVariant}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    {variantEnabled && (
                        <CardContent className="p-6 space-y-6">
                            {/* Attribute Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-blue-600" />
                                        Cấu hình biến thể
                                    </h4>
                                    <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                        {variantItems.length} nhóm thuộc tính
                                    </Badge>
                                </div>

                                {variantItems.map((item) => (
                                    <VariantItemRow
                                        key={item.id}
                                        item={item}
                                        availableCatalogues={getAvailableCatalogues(
                                            item.id,
                                        )}
                                        attributeCatalogues={
                                            attributeCatalogues
                                        }
                                        onCatalogueChange={
                                            handleCatalogueChange
                                        }
                                        onAttributeChange={
                                            handleAttributeChange
                                        }
                                        onRemove={removeVariantItem}
                                    />
                                ))}

                                {variantItems.length !==
                                    attributeCatalogues.length && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addVariantItem}
                                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm nhóm thuộc tính mới
                                    </Button>
                                )}
                            </div>

                            {/* Variant Table */}
                            {variantTable.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-purple-600" />
                                            Danh sách biến thể
                                        </h4>
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                            {variantTable.length} biến thể
                                        </Badge>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                                    {variantItems
                                                        .filter(
                                                            (i) =>
                                                                i.catalogueId &&
                                                                i.attributes
                                                                    .length > 0,
                                                        )
                                                        .map((item) => {
                                                            const cat =
                                                                attributeCatalogues.find(
                                                                    (c) =>
                                                                        c.id.toString() ===
                                                                        item.catalogueId,
                                                                );
                                                            return (
                                                                <TableHead
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="font-semibold text-slate-700"
                                                                >
                                                                    {cat?.name}
                                                                </TableHead>
                                                            );
                                                        })}
                                                    <TableHead className="font-semibold text-slate-700">
                                                        SKU
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700">
                                                        Đơn vị tính
                                                    </TableHead>
                                                    <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {variantTable.map((variant) => {
                                                    const unitName =
                                                        unitOptions.find(
                                                            (u) =>
                                                                String(
                                                                    u.value,
                                                                ) ===
                                                                String(
                                                                    variant.unit_id,
                                                                ),
                                                        )?.label ||
                                                        (variant.unit_id
                                                            ? "Đang tải..."
                                                            : "Chưa chọn");

                                                    return (
                                                        <React.Fragment
                                                            key={
                                                                variant.variantKey
                                                            }
                                                        >
                                                            <TableRow
                                                                onClick={() =>
                                                                    handleEditVariant(
                                                                        variant,
                                                                    )
                                                                }
                                                                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all"
                                                            >
                                                                {variant.attributes.map(
                                                                    (
                                                                        attr,
                                                                        i,
                                                                    ) => (
                                                                        <TableCell
                                                                            key={`${variant.variantKey}-${i}`}
                                                                            className="font-medium"
                                                                        >
                                                                            {
                                                                                attr
                                                                            }
                                                                        </TableCell>
                                                                    ),
                                                                )}
                                                                <TableCell>
                                                                    <code className="bg-slate-100 px-2 py-1 rounded text-xs text-blue-600">
                                                                        {
                                                                            variant.sku
                                                                        }
                                                                    </code>
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    {unitName}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleEditVariant(
                                                                                variant,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>

                                                            {editingRow ===
                                                                variant.variantKey && (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={
                                                                            999
                                                                        }
                                                                        className="p-0 bg-gradient-to-r from-blue-50 to-purple-50"
                                                                    >
                                                                        <VariantEditForm
                                                                            data={
                                                                                editingData
                                                                            }
                                                                            onChange={
                                                                                setEditingData
                                                                            }
                                                                            onSave={
                                                                                handleSaveEdit
                                                                            }
                                                                            onCancel={
                                                                                handleCancelEdit
                                                                            }
                                                                            units={
                                                                                unitOptions
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>
        );
    },
);

ProductVariantManager.displayName = "ProductVariantManager";

// ========== COMPONENT: VariantItemRow ==========
function VariantItemRow({
    item,
    availableCatalogues,
    attributeCatalogues,
    onCatalogueChange,
    onAttributeChange,
    onRemove,
}) {
    const { emit } = useEventBus();
    const [attributes, setAttributes] = useState([]);
    const [loadingAttributes, setLoadingAttributes] = useState(false);

    useEffect(() => {
        if (item.catalogueId) {
            loadAttributes(item.catalogueId);
        } else {
            setAttributes([]);
        }
    }, [item.catalogueId]);

    const loadAttributes = async (catalogueId) => {
        setLoadingAttributes(true);
        try {
            const response = await fetch(
                `/attribute/getAttribute?attribute_catalogue_id=${catalogueId}`,
            );
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                const attributeOptions = data.data.map((attr) => ({
                    value: attr.id.toString(),
                    label: attr.name,
                }));
                setAttributes(attributeOptions);
            } else {
                setAttributes([]);
                const catalogue = availableCatalogues.find(
                    (cat) => cat.id.toString() === catalogueId,
                );
                const catalogueName = catalogue?.name || "nhóm này";
                emit(
                    "toast:error",
                    `Không có thuộc tính nào trong ${catalogueName}!`,
                );
            }
        } catch (error) {
            setAttributes([]);
            emit("toast:error", "Không thể tải danh sách thuộc tính!");
        } finally {
            setLoadingAttributes(false);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-3 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
            <div className="col-span-4">
                <Label className="text-sm mb-2 block text-slate-700 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-blue-600" />
                    Nhóm thuộc tính
                </Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            type="button"
                            className="w-full justify-between border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                        >
                            {item.catalogueId ? (
                                <span className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    {
                                        availableCatalogues.find(
                                            (cat) =>
                                                cat.id.toString() ===
                                                item.catalogueId,
                                        )?.name
                                    }
                                </span>
                            ) : (
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Package className="h-4 w-4 text-slate-400" />
                                    Chọn nhóm
                                </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-blue-200">
                        <Command>
                            <CommandInput
                                className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                                placeholder="Tìm kiếm..."
                            />
                            <CommandList>
                                <CommandEmpty className="py-6 text-center">
                                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-500">
                                        Không tìm thấy nhóm thuộc tính.
                                    </p>
                                </CommandEmpty>
                                <CommandGroup>
                                    {availableCatalogues.map((cat) => (
                                        <CommandItem
                                            key={cat.id}
                                            value={cat.name}
                                            onSelect={() =>
                                                onCatalogueChange(
                                                    item.id,
                                                    cat.id.toString(),
                                                )
                                            }
                                            className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    cat.id.toString() ===
                                                        item.catalogueId
                                                        ? "opacity-100 text-blue-600"
                                                        : "opacity-0",
                                                )}
                                            />
                                            {cat.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="col-span-7">
                <Label className="text-sm mb-2 block text-slate-700 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-purple-600" />
                    Giá trị thuộc tính
                </Label>
                <AttributeMultiSelect
                    options={attributes}
                    selected={item.attributes}
                    onChange={(values) => onAttributeChange(item.id, values)}
                    disabled={!item.catalogueId || loadingAttributes}
                    placeholder={
                        loadingAttributes
                            ? "Đang tải..."
                            : !item.catalogueId
                              ? "Chọn nhóm thuộc tính trước"
                              : attributes.length === 0
                                ? "Nhóm này không có thuộc tính"
                                : "Chọn giá trị"
                    }
                />
            </div>

            <div className="col-span-1 flex items-end justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// ========== COMPONENT: AttributeMultiSelect ==========
function AttributeMultiSelect({
    options,
    selected,
    onChange,
    disabled,
    placeholder,
}) {
    const [open, setOpen] = useState(false);

    const toggleOption = (option) => {
        const isSelected = selected.some((s) => s.value === option.value);
        if (isSelected) {
            onChange(selected.filter((s) => s.value !== option.value));
        } else {
            onChange([...selected, option]);
        }
    };

    const removeOption = (option, e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(selected.filter((s) => s.value !== option.value));
    };

    const isDisabled = disabled || options.length === 0;

    return (
        <div className="space-y-2">
            <Popover open={open && !isDisabled} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div>
                        <Button
                            variant="outline"
                            type="button"
                            disabled={isDisabled}
                            className={cn(
                                "w-full justify-between min-h-11 h-auto border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all",
                                isDisabled && "cursor-not-allowed opacity-50",
                            )}
                        >
                            <div className="flex flex-wrap gap-1.5 flex-1 text-left">
                                {selected.length > 0 ? (
                                    selected.map((option) => (
                                        <span
                                            key={option.value}
                                            className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-purple-100 px-2.5 py-1 rounded-md text-xs font-medium text-purple-700"
                                        >
                                            {option.label}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-red-600"
                                                onClick={(e) =>
                                                    removeOption(option, e)
                                                }
                                            />
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-sm">
                                        {placeholder}
                                    </span>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-purple-200">
                    <Command>
                        <CommandInput
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                            placeholder="Tìm kiếm thuộc tính..."
                        />
                        <CommandList>
                            <CommandEmpty className="py-6 text-center">
                                <Layers className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">
                                    Không tìm thấy thuộc tính.
                                </p>
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => {
                                    const isSelected = selected.some(
                                        (s) => s.value === option.value,
                                    );
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() =>
                                                toggleOption(option)
                                            }
                                            className={cn(
                                                "cursor-pointer",
                                                isSelected &&
                                                    "bg-gradient-to-r from-blue-600/5 to-purple-600/5",
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 h-4 w-4 rounded border flex items-center justify-center",
                                                    isSelected
                                                        ? "bg-purple-600 border-purple-600"
                                                        : "border-slate-300",
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            {option.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ========== COMPONENT: VariantEditForm ==========
function VariantEditForm({ data, onChange, onSave, onCancel, units = [] }) {
    const [fileEnabled, setFileEnabled] = useState(
        !!(data.fileName || data.fileUrl),
    );

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleAlbumChange = (images) => {
        onChange({ ...data, album: images });
        if (images.length > 0) {
            onChange({ ...data, image: images[0], album: images });
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gradient-to-r from-blue-50 to-purple-50">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800">
                            Cập Nhật Biến Thể
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Chỉnh sửa thông tin chi tiết
                        </p>
                    </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {data.sku}
                </Badge>
            </div>

            {/* Album Upload */}
            <AlbumUpload
                images={
                    Array.isArray(data.album)
                        ? data.album
                        : data.album
                          ? [data.album]
                          : []
                }
                onChange={handleAlbumChange}
                title="Hình Ảnh Biến Thể"
                description="Tải lên và quản lý hình ảnh cho biến thể này"
            />

            {/* Product Info */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Thông Tin Cơ Bản
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">
                                SKU
                            </Label>
                            <div className="relative">
                                <Tag className="absolute left-2 top-2.5 h-4 w-4 text-blue-600" />
                                <Input
                                    value={data.sku}
                                    onChange={(e) =>
                                        handleChange("sku", e.target.value)
                                    }
                                    placeholder="Mã SKU"
                                    className="pl-8 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">
                                Barcode
                            </Label>
                            <div className="relative">
                                <Barcode className="absolute left-2 top-2.5 h-4 w-4 text-purple-600" />
                                <Input
                                    value={data.barcode}
                                    onChange={(e) =>
                                        handleChange("barcode", e.target.value)
                                    }
                                    placeholder="Barcode"
                                    className="pl-8 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        <div>
                            <SelectCombobox
                                label="Đơn vị tính"
                                value={data.unit_id}
                                onChange={(value) =>
                                    handleChange("unit_id", value)
                                }
                                options={units}
                                placeholder="Chọn đơn vị"
                                icon={
                                    <Package className="h-4 w-4 text-blue-600" />
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Digital Product File Management */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            File Sản Phẩm Số
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label
                                htmlFor="file-toggle"
                                className="text-sm text-slate-600"
                            >
                                Kích hoạt
                            </Label>
                            <Switch
                                id="file-toggle"
                                checked={fileEnabled}
                                onCheckedChange={setFileEnabled}
                                className="data-[state=checked]:bg-purple-600"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">
                                Tên file
                            </Label>
                            <div className="relative">
                                <FileText className="absolute left-2 top-2.5 h-4 w-4 text-blue-600" />
                                <Input
                                    value={data.fileName}
                                    onChange={(e) =>
                                        handleChange("fileName", e.target.value)
                                    }
                                    disabled={!fileEnabled}
                                    placeholder="document.pdf"
                                    className="pl-8 border-slate-200 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">
                                URL file
                            </Label>
                            <div className="relative">
                                <FileText className="absolute left-2 top-2.5 h-4 w-4 text-purple-600" />
                                <Input
                                    value={data.fileUrl}
                                    onChange={(e) =>
                                        handleChange("fileUrl", e.target.value)
                                    }
                                    disabled={!fileEnabled}
                                    placeholder="https://..."
                                    className="pl-8 border-slate-200 focus:border-purple-500 focus:ring-purple-500 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-blue-200">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                >
                    Hủy
                </Button>
                <Button
                    type="button"
                    onClick={onSave}
                    className="btn-gradient-premium"
                >
                    <Save className="mr-2 h-4 w-4" />
                    Lưu Lại
                </Button>
            </div>
        </div>
    );
}

export default ProductVariantManager;