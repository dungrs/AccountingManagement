"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
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
import { Check, ChevronsUpDown, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { useEventBus } from "@/EventBus";
import AlbumUpload from "@/admin/components/upload/AlbumUpload";
import React from "react";

const ProductVariantManager = forwardRef(
    ({ attributeCatalogues = [], mainPrice = "", productData = null }, ref) => {
        const { emit } = useEventBus();

        const [productCode, setProductCode] = useState("");
        const [variantEnabled, setVariantEnabled] = useState(false);
        const [variantItems, setVariantItems] = useState([]);
        const [variantTable, setVariantTable] = useState([]);
        const [editingRow, setEditingRow] = useState(null);
        const [editingData, setEditingData] = useState({});
        const [isInitialized, setIsInitialized] = useState(false);

        // Load dữ liệu khi edit
        useEffect(() => {
            if (productData && !isInitialized) {
                console.log("ProductData received:", productData);
                setProductCode(productData.code || "");
                loadProductVariants();
                setIsInitialized(true);
            }
        }, [productData]);

        // Auto-generate SKU when product code changes
        useEffect(() => {
            if (productCode && variantTable.length > 0) {
                updateAllSKU();
            }
        }, [productCode]);

        const updateAllSKU = () => {
            setVariantTable((prev) =>
                prev.map((variant) => ({
                    ...variant,
                    sku: `${productCode}-${variant.variantKey}`,
                })),
            );
        };

        // Load variant data từ product khi edit
        const loadProductVariants = async () => {
            try {
                // Parse attribute từ product.attribute
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

                console.log("=== LOADING VARIANTS ===");
                console.log("Attribute Data:", attributeData);
                console.log("Variants Data:", variantsData);

                if (Object.keys(attributeData).length === 0) {
                    console.log("No attribute data found");
                    return;
                }

                setVariantEnabled(true);

                // Tạo variant items từ attribute data
                const items = Object.keys(attributeData).map(
                    (catalogueId, index) => ({
                        id: Date.now() + index,
                        catalogueId: catalogueId.toString(),
                        attributes: [],
                    }),
                );

                console.log("Created items:", items);
                setVariantItems(items);

                // Load attributes cho từng item song song
                const loadPromises = items.map(async (item) => {
                    const selectedAttributes = await loadAttributesForEdit(
                        item.id,
                        item.catalogueId,
                        attributeData[item.catalogueId],
                    );
                    return { itemId: item.id, attributes: selectedAttributes };
                });

                const loadedAttributes = await Promise.all(loadPromises);

                console.log("Loaded all attributes:", loadedAttributes);

                // Update tất cả items với attributes đã load
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

                // Đợi state update rồi tạo table
                setTimeout(() => {
                    console.log("=== PREPARING VARIANT TABLE ===");
                    // Rebuild items với attributes đã load
                    const itemsWithAttributes = items.map((item) => {
                        const loaded = loadedAttributes.find(
                            (la) => la.itemId === item.id,
                        );
                        return loaded
                            ? { ...item, attributes: loaded.attributes }
                            : item;
                    });

                    console.log("Items with attributes:", itemsWithAttributes);
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

                    console.log(`Catalogue ${catalogueId}:`, {
                        allAttributes: attributes,
                        selectedIds: normalizedIds,
                        selectedAttributes,
                    });

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
            console.log("Attribute changed:", { itemId, selectedAttributes });

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
            console.log("=== PREPARE PRODUCT VARIANT DATA ===");
            console.log("Input items:", items);
            console.log("Existing variants:", existingVariants);

            const validItems = items.filter(
                (item) => item.catalogueId && item.attributes.length > 0,
            );

            console.log("Valid items after filter:", validItems);

            if (validItems.length === 0) {
                console.log("No valid items, clearing table");
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

                console.log(
                    `Processing item with catalogue: ${optionText}`,
                    item,
                );

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

            console.log("Before cartesian product:");
            console.log("Attributes:", attributes);
            console.log("Variants:", variants);

            // Cartesian product
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

            console.log("After cartesian product:");
            console.log("Attributes:", attributes);
            console.log("Variants:", variants);
            console.log("Attribute titles:", attributeTitle);

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
            console.log("=== CREATE VARIANT TABLE ===");
            console.log("Attributes:", attributes);
            console.log("Variants:", variants);
            console.log("Existing variants from DB:", existingVariants);

            if (!attributes.length || !variants.length) {
                console.log("No attributes or variants, clearing table");
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

                console.log(`Creating variant ${index}:`, {
                    attributeItem,
                    variantItem,
                    variantKey,
                });

                // Tìm existing variant trong table hiện tại
                const existingVariant = variantTable.find(
                    (v) => v.variantKey === variantKey,
                );

                // Tìm variant từ database - SỬA LẠI PHẦN NÀY
                let dbVariant = null;
                if (existingVariants && Array.isArray(existingVariants)) {
                    // Cách 1: Tìm theo code (nếu code = variantKey)
                    dbVariant = existingVariants.find(
                        (v) => v.code === variantKey,
                    );

                    // Cách 2: Nếu không tìm thấy, thử tìm theo index
                    if (!dbVariant && existingVariants[index]) {
                        dbVariant = existingVariants[index];
                        console.log(
                            `Found DB variant by index ${index}:`,
                            dbVariant,
                        );
                    }

                    // Cách 3: Nếu vẫn không tìm thấy, thử parse attribute field (nếu có)
                    if (!dbVariant) {
                        dbVariant = existingVariants.find((v) => {
                            try {
                                if (!v.attribute) return false;

                                const vAttr =
                                    typeof v.attribute === "string"
                                        ? JSON.parse(v.attribute)
                                        : v.attribute || {};
                                const vKey = Object.values(vAttr).join("-");
                                const match = vKey === variantKey;

                                if (match) {
                                    console.log(
                                        `Found DB variant by attribute for ${variantKey}:`,
                                        v,
                                    );
                                }

                                return match;
                            } catch (e) {
                                console.error(
                                    "Error parsing variant attribute:",
                                    e,
                                );
                                return false;
                            }
                        });
                    }
                }

                const sourceVariant = existingVariant || dbVariant;

                console.log(`Source variant for ${variantKey}:`, sourceVariant);

                // Parse album
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
                    quantity:
                        sourceVariant?.quantity !== undefined
                            ? sourceVariant.quantity
                            : "",
                    price:
                        sourceVariant?.price !== undefined
                            ? sourceVariant.price
                            : mainPrice,
                    sku: sourceVariant?.sku || `${productCode}-${variantKey}`,
                    barcode: sourceVariant?.barcode || "",
                    fileName:
                        sourceVariant?.fileName ||
                        sourceVariant?.file_name ||
                        "",
                    fileUrl:
                        sourceVariant?.fileUrl || sourceVariant?.file_url || "",
                    album: albumArray,
                    // Lưu thêm ID để update sau này
                    id: sourceVariant?.id || null,
                };

                console.log(`Created variant ${index}:`, variant);

                return variant;
            });

            console.log("Final variant table:", newTable);
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
                quantity: [],
                sku: [],
                price: [],
                barcode: [],
                file_name: [],
                file_url: [],
                album: [],
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
                variantData.quantity.push(variant.quantity || "");
                variantData.sku.push(variant.sku || "");
                variantData.price.push(variant.price || "");
                variantData.barcode.push(variant.barcode || "");
                variantData.file_name.push(variant.fileName || "");
                variantData.file_url.push(variant.fileUrl || "");
                variantData.album.push(
                    Array.isArray(variant.album)
                        ? variant.album.join(",")
                        : variant.album || "",
                );

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
        }));

        return (
            <div className="space-y-6">
                {/* Product Code Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mã sản phẩm</CardTitle>
                        <CardDescription>
                            Nhập mã sản phẩm để tự động tạo SKU cho biến thể
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="VD: PROD-001"
                            value={productCode}
                            onChange={(e) =>
                                setProductCode(e.target.value.toUpperCase())
                            }
                        />
                    </CardContent>
                </Card>

                {/* Variant Manager Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="mb-2">Biến thể sản phẩm</CardTitle>
                                <CardDescription>
                                    Tạo và quản lý các phiên bản khác nhau của
                                    sản phẩm
                                </CardDescription>
                            </div>
                            <Switch
                                checked={variantEnabled}
                                onCheckedChange={handleToggleVariant}
                            />
                        </div>
                    </CardHeader>

                    {variantEnabled && (
                        <CardContent className="space-y-6">
                            {/* Attribute Selection */}
                            <div className="space-y-3">
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
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm phiên bản mới
                                    </Button>
                                )}
                            </div>

                            {/* Variant Table */}
                            {variantTable.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
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
                                                                key={item.id}
                                                            >
                                                                {cat?.name}
                                                            </TableHead>
                                                        );
                                                    })}
                                                <TableHead>Số lượng</TableHead>
                                                <TableHead>Giá tiền</TableHead>
                                                <TableHead>SKU</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {variantTable.map((variant) => (
                                                <React.Fragment
                                                    key={variant.variantKey}
                                                >
                                                    <TableRow
                                                        onClick={() =>
                                                            handleEditVariant(
                                                                variant,
                                                            )
                                                        }
                                                        className="cursor-pointer hover:bg-muted/50"
                                                    >
                                                        {variant.attributes.map(
                                                            (attr, i) => (
                                                                <TableCell
                                                                    key={`${variant.variantKey}-${i}`}
                                                                >
                                                                    {attr}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                        <TableCell>
                                                            {variant.quantity ||
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {variant.price}
                                                        </TableCell>
                                                        <TableCell>
                                                            {variant.sku}
                                                        </TableCell>
                                                    </TableRow>

                                                    {editingRow ===
                                                        variant.variantKey && (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={999}
                                                                className="p-0"
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
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
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
            console.error("Error loading attributes:", error);
            setAttributes([]);
            emit("toast:error", "Không thể tải danh sách thuộc tính!");
        } finally {
            setLoadingAttributes(false);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
                <Label className="text-sm mb-2 block">Nhóm thuộc tính</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            type="button"
                            className="w-full justify-between"
                        >
                            {item.catalogueId ? (
                                availableCatalogues.find(
                                    (cat) =>
                                        cat.id.toString() === item.catalogueId,
                                )?.name
                            ) : (
                                <span className="text-muted-foreground">
                                    Chọn nhóm
                                </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                            <CommandInput
                                className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                                placeholder="Tìm kiếm nhóm..."
                            />
                            <CommandList>
                                <CommandEmpty>
                                    Không tìm thấy nhóm thuộc tính.
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
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    cat.id.toString() ===
                                                        item.catalogueId
                                                        ? "opacity-100"
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
                <Label className="text-sm mb-2 block">Giá trị thuộc tính</Label>
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

            <div className="col-span-1 flex items-end">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.id)}
                    className="pb-2"
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
                                "w-full justify-between min-h-11 h-auto",
                                isDisabled && "cursor-not-allowed opacity-50",
                            )}
                        >
                            <div className="flex flex-wrap gap-1.5 flex-1 text-left">
                                {selected.length > 0 ? (
                                    selected.map((option) => (
                                        <span
                                            key={option.value}
                                            className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-md text-xs font-medium"
                                        >
                                            {option.label}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-destructive"
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
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                            placeholder="Tìm kiếm thuộc tính..."
                        />
                        <CommandList>
                            <CommandEmpty>
                                Không tìm thấy thuộc tính.
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
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />
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
function VariantEditForm({ data, onChange, onSave, onCancel }) {
    const [quantityEnabled, setQuantityEnabled] = useState(!!data.quantity);
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
        <div className="p-6 space-y-6 bg-muted/30">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <h3 className="font-semibold text-lg">Cập Nhật Biến Thể</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Chỉnh sửa thông tin chi tiết
                    </p>
                </div>
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

            {/* Stock Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                            Thông Tin Kho Hàng
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="qty-toggle" className="text-sm">
                                Quản lý kho
                            </Label>
                            <Switch
                                id="qty-toggle"
                                checked={quantityEnabled}
                                onCheckedChange={setQuantityEnabled}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm">Số lượng</Label>
                            <Input
                                type="number"
                                value={data.quantity}
                                onChange={(e) =>
                                    handleChange("quantity", e.target.value)
                                }
                                disabled={!quantityEnabled}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">SKU</Label>
                            <Input
                                value={data.sku}
                                onChange={(e) =>
                                    handleChange("sku", e.target.value)
                                }
                                placeholder="Mã SKU"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Giá tiền</Label>
                            <Input
                                type="number"
                                value={data.price}
                                onChange={(e) =>
                                    handleChange("price", e.target.value)
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Barcode</Label>
                            <Input
                                value={data.barcode}
                                onChange={(e) =>
                                    handleChange("barcode", e.target.value)
                                }
                                placeholder="Barcode"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* File Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                            Quản Lý File
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="file-toggle" className="text-sm">
                                Kích hoạt
                            </Label>
                            <Switch
                                id="file-toggle"
                                checked={fileEnabled}
                                onCheckedChange={setFileEnabled}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm">Tên file</Label>
                            <Input
                                value={data.fileName}
                                onChange={(e) =>
                                    handleChange("fileName", e.target.value)
                                }
                                disabled={!fileEnabled}
                                placeholder="document.pdf"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">URL file</Label>
                            <Input
                                value={data.fileUrl}
                                onChange={(e) =>
                                    handleChange("fileUrl", e.target.value)
                                }
                                disabled={!fileEnabled}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="button" onClick={onSave}>
                    Lưu Lại
                </Button>
            </div>
        </div>
    );
}

export default ProductVariantManager;