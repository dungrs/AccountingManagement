"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage, router } from "@inertiajs/react";

import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/admin/components/ui/popover";
import { Calendar } from "@/admin/components/ui/calendar";
import { Badge } from "@/admin/components/ui/badge";
import {
    Plus,
    Trash2,
    Save,
    Ban,
    Check,
    CalendarIcon,
    Pencil,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { useEventBus } from "@/EventBus";
import SelectCombobox from "@/admin/components/ui/select-combobox";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function PriceListForm() {
    const {
        price_list,
        product_variants,
        products: availableProducts,
        vat_taxes,
        flash,
        errors: serverErrors,
    } = usePage().props;

    const { emit } = useEventBus();
    const isEdit = !!price_list;

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        publish: true,
        price_list_items: [],
    });

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [openStartDate, setOpenStartDate] = useState(false);
    const [openEndDate, setOpenEndDate] = useState(false);

    // Danh sách các dòng đang thêm mới
    const [addingRows, setAddingRows] = useState([]);

    // Danh sách các index đang được edit
    const [editingIndexes, setEditingIndexes] = useState([]);

    // Lấy VAT tax object từ ID
    const getVatTaxById = (taxId) => {
        return vat_taxes?.find((tax) => tax.id === taxId);
    };

    // Lấy VAT rate từ tax ID
    const getVatRateFromTaxId = (taxId) => {
        const tax = getVatTaxById(taxId);
        return tax ? parseFloat(tax.rate) : 10;
    };

    // Tìm VAT tax mặc định (10%)
    const getDefaultVatTax = () => {
        return (
            vat_taxes?.find((tax) => parseFloat(tax.rate) === 10) ||
            vat_taxes?.[0]
        );
    };

    // Load data từ server khi edit
    useEffect(() => {
        if (price_list && !isInitialized) {
            setFormData({
                name: price_list.name || "",
                description: price_list.description || "",
                start_date: price_list.start_date || "",
                end_date: price_list.end_date || "",
                publish:
                    price_list.publish === 1 || price_list.publish === true,
                price_list_items:
                    price_list.product_variants?.map((pv) => ({
                        product_variant_id: pv.product_variant_id,
                        sale_price: pv.sale_price || "",
                        output_tax_id:
                            pv.output_tax_id || getDefaultVatTax()?.id,
                    })) || [],
            });

            // Set dates
            if (price_list.start_date) {
                setStartDate(new Date(price_list.start_date));
            }
            if (price_list.end_date) {
                setEndDate(new Date(price_list.end_date));
            }

            setIsInitialized(true);
        }
    }, [price_list, isInitialized, vat_taxes]);

    useEffect(() => {
        if (flash?.error) emit("toast:error", flash.error);
    }, [flash, emit]);

    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
        }
    }, [serverErrors]);

    // Sync dates with formData
    useEffect(() => {
        if (startDate) {
            setFormData((prev) => ({
                ...prev,
                start_date: format(startDate, "yyyy-MM-dd"),
            }));
        }
    }, [startDate]);

    useEffect(() => {
        if (endDate) {
            setFormData((prev) => ({
                ...prev,
                end_date: format(endDate, "yyyy-MM-dd"),
            }));
        }
    }, [endDate]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const formatCurrency = (value) => {
        if (!value) return "-";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const calculateVAT = (price, vatRate) => {
        const priceNum = parseFloat(price) || 0;
        const rateNum = parseFloat(vatRate) || 0;
        const vatAmount = (priceNum * rateNum) / 100;
        const priceAfterVat = priceNum + vatAmount;
        return { vatAmount, priceAfterVat };
    };

    // Lấy danh sách product_variant_id đã được sử dụng
    const getUsedVariantIds = () => {
        return formData.price_list_items.map((item) => item.product_variant_id);
    };

    // Lọc options cho SelectCombobox (loại bỏ các variant đã được thêm)
    const getAvailableProductVariantOptions = (currentVariantId = null) => {
        const usedIds = getUsedVariantIds();
        return (
            product_variants
                ?.filter(
                    (pv) =>
                        !usedIds.includes(pv.product_variant_id) ||
                        pv.product_variant_id === currentVariantId,
                )
                .map((pv) => ({
                    value: pv.product_variant_id,
                    label: pv.name,
                })) || []
        );
    };

    // Thêm một dòng mới vào danh sách đang thêm
    const handleAddProductRow = () => {
        const defaultTax = getDefaultVatTax();
        const newRow = {
            id: Date.now(),
            product_variant_id: "",
            sale_price: "",
            output_tax_id: defaultTax?.id || null,
        };
        setAddingRows([...addingRows, newRow]);
    };

    // Hủy một dòng đang thêm
    const handleCancelAddRow = (rowId) => {
        setAddingRows(addingRows.filter((row) => row.id !== rowId));
    };

    // Update data của một dòng đang thêm
    const handleUpdateAddingRow = (rowId, field, value) => {
        setAddingRows(
            addingRows.map((row) =>
                row.id === rowId ? { ...row, [field]: value } : row,
            ),
        );
    };

    // Lưu một dòng vào danh sách chính
    const handleSaveRow = (rowId) => {
        const row = addingRows.find((r) => r.id === rowId);
        if (!row || !row.product_variant_id || !row.sale_price) {
            emit("toast:error", "Vui lòng chọn sản phẩm và nhập giá!");
            return;
        }

        // Kiểm tra trùng
        const isDuplicate = formData.price_list_items.some(
            (item) =>
                item.product_variant_id === parseInt(row.product_variant_id),
        );

        if (isDuplicate) {
            emit("toast:error", "Sản phẩm này đã tồn tại trong bảng giá!");
            return;
        }

        const newItem = {
            product_variant_id: parseInt(row.product_variant_id),
            sale_price: parseFloat(row.sale_price),
            output_tax_id: row.output_tax_id,
        };

        setFormData((prev) => ({
            ...prev,
            price_list_items: [...prev.price_list_items, newItem],
        }));

        setAddingRows(addingRows.filter((r) => r.id !== rowId));
    };

    // Bật chế độ edit cho một item
    const handleEditItem = (index) => {
        setEditingIndexes([...editingIndexes, index]);
    };

    // Hủy edit một item
    const handleCancelEditItem = (index) => {
        setEditingIndexes(editingIndexes.filter((i) => i !== index));

        // Reset lại giá trị ban đầu nếu đang edit item từ server
        if (price_list?.product_variants?.[index]) {
            const originalItem = price_list.product_variants[index];
            setFormData((prev) => ({
                ...prev,
                price_list_items: prev.price_list_items.map((item, i) =>
                    i === index
                        ? {
                              product_variant_id:
                                  originalItem.product_variant_id,
                              sale_price: originalItem.sale_price,
                              output_tax_id: originalItem.output_tax_id,
                          }
                        : item,
                ),
            }));
        }
    };

    // Lưu item đang edit
    const handleSaveEditItem = (index) => {
        const item = formData.price_list_items[index];
        if (!item.product_variant_id || !item.sale_price) {
            emit("toast:error", "Vui lòng điền đầy đủ thông tin!");
            return;
        }

        setEditingIndexes(editingIndexes.filter((i) => i !== index));
        emit("toast:success", "Cập nhật thành công!");
    };

    // Update item trong formData
    const handleUpdateItem = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            price_list_items: prev.price_list_items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const handleDeleteProduct = (index) => {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            setFormData((prev) => ({
                ...prev,
                price_list_items: prev.price_list_items.filter(
                    (_, i) => i !== index,
                ),
            }));
            // Xóa khỏi danh sách editing nếu đang edit
            setEditingIndexes(editingIndexes.filter((i) => i !== index));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Kiểm tra nếu còn dòng đang edit
        if (editingIndexes.length > 0) {
            emit(
                "toast:error",
                "Vui lòng lưu hoặc hủy các thay đổi trước khi submit!",
            );
            return;
        }

        // Kiểm tra nếu còn dòng đang thêm
        if (addingRows.length > 0) {
            emit(
                "toast:error",
                "Vui lòng lưu hoặc hủy các sản phẩm đang thêm!",
            );
            return;
        }

        // Kiểm tra nếu chưa có sản phẩm nào
        if (formData.price_list_items.length === 0) {
            emit(
                "toast:error",
                "Vui lòng thêm ít nhất một sản phẩm vào bảng giá!",
            );
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const submitData = {
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date,
            publish: formData.publish ? 1 : 0,
            price_list_items: formData.price_list_items.map((item) => ({
                product_variant_id: item.product_variant_id,
                sale_price: item.sale_price,
                output_tax_id: item.output_tax_id,
            })),
        };

        const submitRoute = isEdit
            ? route("admin.price_list.update", price_list.id)
            : route("admin.price_list.store");

        const submitMethod = isEdit ? "put" : "post";

        router[submitMethod](submitRoute, submitData, {
            preserveScroll: true,
            preserveState: true,

            onSuccess: () => {
                setErrors({});
                emit(
                    "toast:success",
                    isEdit ? "Cập nhật thành công!" : "Tạo mới thành công!",
                );
            },

            onError: (errors) => {
                setErrors(errors);

                if (
                    errors.price_list_items ||
                    Object.keys(errors).some((key) =>
                        key.startsWith("price_list_items."),
                    )
                ) {
                    emit(
                        "toast:error",
                        "Vui lòng kiểm tra lại thông tin sản phẩm!",
                    );
                }

                if (Object.keys(errors).length > 0) {
                    emit("toast:error", "Vui lòng kiểm tra lại thông tin!");
                }
            },

            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Lấy thông tin variant từ ID
    const getVariantInfo = (variantId) => {
        return product_variants?.find(
            (pv) => pv.product_variant_id === variantId,
        );
    };

    return (
        <AdminLayout
            breadcrumb={[
                { label: "Dashboard", link: route("admin.dashboard.index") },
                { label: "Bảng giá", link: route("admin.price_list.index") },
                {
                    label: isEdit ? "Chỉnh sửa bảng giá" : "Thêm mới bảng giá",
                },
            ]}
        >
            <Head title={isEdit ? "Chỉnh sửa bảng giá" : "Thêm bảng giá"} />

            <div className="space-y-6">
                <form onSubmit={handleSubmit}>
                    {/* Thông tin chung */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chung</CardTitle>
                            <CardDescription>
                                Cập nhật thông tin cơ bản của bảng giá
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Tên bảng giá{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            handleChange("name", e.target.value)
                                        }
                                        placeholder="Nhập tên bảng giá"
                                        className={cn(
                                            errors.name && "border-red-500",
                                        )}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="publish">Trạng thái</Label>
                                    <Select
                                        value={formData.publish ? "1" : "0"}
                                        onValueChange={(value) =>
                                            handleChange(
                                                "publish",
                                                value === "1",
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">
                                                Đang áp dụng
                                            </SelectItem>
                                            <SelectItem value="0">
                                                Ngừng áp dụng
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>
                                        Ngày bắt đầu{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>

                                    <Popover
                                        open={openStartDate}
                                        onOpenChange={setOpenStartDate}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start font-normal",
                                                    !startDate &&
                                                        "text-muted-foreground",
                                                    errors.start_date &&
                                                        "border-red-500",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate
                                                    ? format(
                                                          startDate,
                                                          "dd/MM/yyyy",
                                                          { locale: vi },
                                                      )
                                                    : "Chọn ngày bắt đầu"}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="w-auto overflow-hidden p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                defaultMonth={
                                                    startDate || new Date()
                                                }
                                                captionLayout="dropdown"
                                                fromYear={2020}
                                                toYear={2030}
                                                onSelect={(date) => {
                                                    if (!date) return;
                                                    setStartDate(date);
                                                    setOpenStartDate(false);
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        start_date: null,
                                                    }));
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {errors.start_date && (
                                        <p className="text-xs text-red-500">
                                            {errors.start_date}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Ngày kết thúc</Label>

                                    <Popover
                                        open={openEndDate}
                                        onOpenChange={setOpenEndDate}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start font-normal",
                                                    !endDate &&
                                                        "text-muted-foreground",
                                                    errors.end_date &&
                                                        "border-red-500",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate
                                                    ? format(
                                                          endDate,
                                                          "dd/MM/yyyy",
                                                          { locale: vi },
                                                      )
                                                    : "Chọn ngày kết thúc"}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="w-auto overflow-hidden p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                defaultMonth={
                                                    endDate ||
                                                    startDate ||
                                                    new Date()
                                                }
                                                captionLayout="dropdown"
                                                fromYear={2020}
                                                toYear={2030}
                                                disabled={(date) =>
                                                    startDate
                                                        ? date < startDate
                                                        : false
                                                }
                                                onSelect={(date) => {
                                                    if (!date) return;
                                                    setEndDate(date);
                                                    setOpenEndDate(false);
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        end_date: null,
                                                    }));
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {errors.end_date && (
                                        <p className="text-xs text-red-500">
                                            {errors.end_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        handleChange(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nhập mô tả cho bảng giá"
                                    rows={3}
                                    className={cn(
                                        errors.description && "border-red-500",
                                    )}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danh sách sản phẩm */}
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="space-y-2">
                                <CardTitle>Danh sách sản phẩm</CardTitle>
                                <CardDescription>
                                    Quản lý giá cho từng sản phẩm
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40">
                                            <TableHead className="min-w-[300px]">
                                                Tên sản phẩm
                                            </TableHead>
                                            <TableHead className="w-[150px] text-left">
                                                Đơn giá
                                            </TableHead>
                                            <TableHead className="w-[180px]">
                                                Thuế GTGT
                                            </TableHead>
                                            <TableHead className="w-[150px] text-left">
                                                Tiền VAT
                                            </TableHead>
                                            <TableHead className="w-[150px] text-left">
                                                Giá sau VAT
                                            </TableHead>
                                            <TableHead className="w-[100px] text-center">
                                                Thao tác
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Các sản phẩm đã lưu */}
                                        {formData.price_list_items.map(
                                            (item, index) => {
                                                const variant = getVariantInfo(
                                                    item.product_variant_id,
                                                );
                                                const vatTax = getVatTaxById(
                                                    item.output_tax_id,
                                                );
                                                const vatRate = vatTax
                                                    ? parseFloat(vatTax.rate)
                                                    : 0;
                                                const {
                                                    vatAmount,
                                                    priceAfterVat,
                                                } = calculateVAT(
                                                    item.sale_price,
                                                    vatRate,
                                                );
                                                const isEditing =
                                                    editingIndexes.includes(
                                                        index,
                                                    );

                                                return (
                                                    <TableRow
                                                        key={index}
                                                        className={
                                                            isEditing
                                                                ? "bg-amber-50/50"
                                                                : ""
                                                        }
                                                    >
                                                        <TableCell>
                                                            {isEditing ? (
                                                                <SelectCombobox
                                                                    value={
                                                                        item.product_variant_id
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        handleUpdateItem(
                                                                            index,
                                                                            "product_variant_id",
                                                                            value,
                                                                        )
                                                                    }
                                                                    options={getAvailableProductVariantOptions(
                                                                        item.product_variant_id,
                                                                    )}
                                                                    placeholder="Chọn sản phẩm..."
                                                                    searchPlaceholder="Tìm kiếm sản phẩm..."
                                                                />
                                                            ) : (
                                                                variant?.name ||
                                                                "N/A"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        item.sale_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleUpdateItem(
                                                                            index,
                                                                            "sale_price",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="text-left"
                                                                />
                                                            ) : (
                                                                <span className="font-medium">
                                                                    {formatCurrency(
                                                                        item.sale_price,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {isEditing ? (
                                                                <Select
                                                                    value={String(
                                                                        item.output_tax_id,
                                                                    )}
                                                                    onValueChange={(
                                                                        value,
                                                                    ) => {
                                                                        handleUpdateItem(
                                                                            index,
                                                                            "output_tax_id",
                                                                            parseInt(
                                                                                value,
                                                                            ),
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {vat_taxes?.map(
                                                                            (
                                                                                tax,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        tax.id
                                                                                    }
                                                                                    value={String(
                                                                                        tax.id,
                                                                                    )}
                                                                                >
                                                                                    {
                                                                                        tax.name
                                                                                    }{" "}
                                                                                    (
                                                                                    {
                                                                                        tax.rate
                                                                                    }
                                                                                    %)
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {vatTax?.code ||
                                                                            "N/A"}
                                                                    </Badge>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {vatTax?.name ||
                                                                            "N/A"}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-left">
                                                            {formatCurrency(
                                                                vatAmount,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-left font-semibold text-green-600">
                                                            {formatCurrency(
                                                                priceAfterVat,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            handleSaveEditItem(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            handleCancelEditItem(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        <Ban className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            handleEditItem(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            handleDeleteProduct(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            },
                                        )}

                                        {/* Các dòng đang thêm mới */}
                                        {addingRows.map((row) => {
                                            const variant = getVariantInfo(
                                                parseInt(
                                                    row.product_variant_id,
                                                ),
                                            );
                                            const vatTax = getVatTaxById(
                                                row.output_tax_id,
                                            );
                                            const vatRate = vatTax
                                                ? parseFloat(vatTax.rate)
                                                : 0;
                                            const { vatAmount, priceAfterVat } =
                                                calculateVAT(
                                                    row.sale_price,
                                                    vatRate,
                                                );

                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    className="bg-blue-50/50"
                                                >
                                                    <TableCell>
                                                        <SelectCombobox
                                                            value={
                                                                row.product_variant_id
                                                            }
                                                            onChange={(value) =>
                                                                handleUpdateAddingRow(
                                                                    row.id,
                                                                    "product_variant_id",
                                                                    value,
                                                                )
                                                            }
                                                            options={getAvailableProductVariantOptions()}
                                                            placeholder="Chọn sản phẩm..."
                                                            searchPlaceholder="Tìm kiếm sản phẩm..."
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            placeholder="Đơn giá"
                                                            value={
                                                                row.sale_price
                                                            }
                                                            onChange={(e) =>
                                                                handleUpdateAddingRow(
                                                                    row.id,
                                                                    "sale_price",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="text-left"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={String(
                                                                row.output_tax_id,
                                                            )}
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                handleUpdateAddingRow(
                                                                    row.id,
                                                                    "output_tax_id",
                                                                    parseInt(
                                                                        value,
                                                                    ),
                                                                );
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {vat_taxes?.map(
                                                                    (tax) => (
                                                                        <SelectItem
                                                                            key={
                                                                                tax.id
                                                                            }
                                                                            value={String(
                                                                                tax.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                tax.name
                                                                            }{" "}
                                                                            (
                                                                            {
                                                                                tax.rate
                                                                            }
                                                                            %)
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-left text-muted-foreground">
                                                        {row.sale_price
                                                            ? formatCurrency(
                                                                  vatAmount,
                                                              )
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-left font-semibold text-green-600">
                                                        {row.sale_price
                                                            ? formatCurrency(
                                                                  priceAfterVat,
                                                              )
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleSaveRow(
                                                                        row.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !row.product_variant_id ||
                                                                    !row.sale_price
                                                                }
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleCancelAddRow(
                                                                        row.id,
                                                                    )
                                                                }
                                                                className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {formData.price_list_items.length ===
                                            0 &&
                                            addingRows.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="text-center text-muted-foreground py-8"
                                                    >
                                                        Chưa có sản phẩm nào.
                                                        Nhấn "Thêm sản phẩm" để
                                                        bắt đầu.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Nút thêm sản phẩm ở dưới */}
                            <div className="mt-4">
                                <Button
                                    type="button"
                                    onClick={handleAddProductRow}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm sản phẩm
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {/* Action Buttons */}
                <div className="fixed bottom-6 right-6 flex items-center gap-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        size="lg"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting
                            ? "Đang lưu..."
                            : isEdit
                              ? "Cập nhật"
                              : "Lưu lại"}
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
