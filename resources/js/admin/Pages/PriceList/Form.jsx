"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, usePage, router } from "@inertiajs/react";

import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
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
import {
    Plus,
    Trash2,
    Save,
    Ban,
    Check,
    CalendarIcon,
    Pencil,
    Info,
    Tag,
    Package,
    DollarSign,
    Percent,
    FileText,
    ListChecks,
    Loader2,
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
            ? route("admin.price.list.update", price_list.id)
            : route("admin.price.list.store");

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
                { label: "Bảng giá", link: route("admin.price.list.index") },
                {
                    label: isEdit ? "Chỉnh sửa bảng giá" : "Thêm mới bảng giá",
                },
            ]}
        >
            <Head title={isEdit ? "Chỉnh sửa bảng giá" : "Thêm bảng giá"} />

            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Tag className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isEdit ? "Chỉnh sửa bảng giá" : "Thêm bảng giá mới"}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Quản lý thông tin bảng giá và giá bán cho từng sản phẩm
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <form onSubmit={handleSubmit}>
                    {/* Thông tin chung */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Thông tin chung
                                    </CardTitle>
                                    <CardDescription>
                                        Cập nhật thông tin cơ bản của bảng giá
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm text-slate-700">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p>
                                    Các trường có dấu{" "}
                                    <Badge
                                        variant="outline"
                                        className="bg-red-100 text-red-600 border-red-200 mx-1 px-1.5"
                                    >
                                        *
                                    </Badge>{" "}
                                    là bắt buộc nhập
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-slate-700 flex items-center gap-1"
                                    >
                                        <Tag className="h-3.5 w-3.5 text-blue-600" />
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
                                            "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                            errors.name &&
                                                "border-red-500 focus:border-red-500",
                                        )}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="publish"
                                        className="text-slate-700 flex items-center gap-1"
                                    >
                                        <ListChecks className="h-3.5 w-3.5 text-purple-600" />
                                        Trạng thái
                                    </Label>
                                    <Select
                                        value={formData.publish ? "1" : "0"}
                                        onValueChange={(value) =>
                                            handleChange(
                                                "publish",
                                                value === "1",
                                            )
                                        }
                                    >
                                        <SelectTrigger className="border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dropdown-premium-content">
                                            <SelectItem
                                                value="1"
                                                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                    Đang áp dụng
                                                </span>
                                            </SelectItem>
                                            <SelectItem
                                                value="0"
                                                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                    Ngừng áp dụng
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 flex items-center gap-1">
                                        <CalendarIcon className="h-3.5 w-3.5 text-green-600" />
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
                                                    "w-full justify-start font-normal border-slate-200 hover:border-green-500 hover:bg-green-50/50 transition-all",
                                                    !startDate &&
                                                        "text-muted-foreground",
                                                    errors.start_date &&
                                                        "border-red-500 hover:border-red-500",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-green-500" />
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
                                            className="w-auto overflow-hidden p-0 border-green-200"
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
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            {errors.start_date}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 flex items-center gap-1">
                                        <CalendarIcon className="h-3.5 w-3.5 text-orange-600" />
                                        Ngày kết thúc
                                    </Label>

                                    <Popover
                                        open={openEndDate}
                                        onOpenChange={setOpenEndDate}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start font-normal border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all",
                                                    !endDate &&
                                                        "text-muted-foreground",
                                                    errors.end_date &&
                                                        "border-red-500 hover:border-red-500",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
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
                                            className="w-auto overflow-hidden p-0 border-orange-200"
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
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            {errors.end_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="description"
                                    className="text-slate-700 flex items-center gap-1"
                                >
                                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                                    Mô tả
                                </Label>
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
                                        "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                                        errors.description &&
                                            "border-red-500 focus:border-red-500",
                                    )}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danh sách sản phẩm */}
                    <Card className="mt-6 border-slate-200 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-600/5 to-blue-600/5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-800">
                                        Danh sách sản phẩm
                                    </CardTitle>
                                    <CardDescription>
                                        Quản lý giá cho từng sản phẩm
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                        <TableRow>
                                            <TableHead className="min-w-[300px] font-semibold text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    Tên sản phẩm
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                    Đơn giá
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[180px] font-semibold text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Percent className="h-4 w-4 text-orange-600" />
                                                    Thuế GTGT
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">
                                                Tiền VAT
                                            </TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">
                                                Giá sau VAT
                                            </TableHead>
                                            <TableHead className="w-[100px] text-center font-semibold text-slate-700">
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
                                                        className={cn(
                                                            "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5",
                                                            isEditing
                                                                ? "bg-amber-50/50"
                                                                : "",
                                                        )}
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
                                                                    icon={
                                                                        <Package className="h-4 w-4 text-blue-600" />
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10 flex items-center justify-center">
                                                                        <Package className="h-4 w-4 text-blue-600" />
                                                                    </div>
                                                                    <span className="font-medium text-slate-800">
                                                                        {variant?.name ||
                                                                            "N/A"}
                                                                    </span>
                                                                </div>
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
                                                                    className="text-left border-slate-200 focus:border-green-500 focus:ring-green-500"
                                                                />
                                                            ) : (
                                                                <span className="font-medium text-green-600">
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
                                                                    <SelectTrigger className="border-slate-200 focus:border-orange-500 focus:ring-orange-500">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="dropdown-premium-content">
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
                                                                                    className="cursor-pointer hover:bg-gradient-to-r hover:from-orange-600/5 hover:to-yellow-600/5"
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
                                                                        className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                                                                    >
                                                                        {vatTax?.code ||
                                                                            "N/A"}
                                                                    </Badge>
                                                                    <span className="text-sm text-slate-600">
                                                                        {vatTax?.name ||
                                                                            "N/A"}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-left font-medium text-orange-600">
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
                                                                        className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
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
                                                    className="bg-gradient-to-r from-blue-50/30 to-purple-50/30"
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
                                                            icon={
                                                                <Package className="h-4 w-4 text-blue-600" />
                                                            }
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
                                                            className="text-left border-slate-200 focus:border-green-500 focus:ring-green-500"
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
                                                            <SelectTrigger className="border-slate-200 focus:border-orange-500 focus:ring-orange-500">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="dropdown-premium-content">
                                                                {vat_taxes?.map(
                                                                    (tax) => (
                                                                        <SelectItem
                                                                            key={
                                                                                tax.id
                                                                            }
                                                                            value={String(
                                                                                tax.id,
                                                                            )}
                                                                            className="cursor-pointer hover:bg-gradient-to-r hover:from-orange-600/5 hover:to-yellow-600/5"
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
                                                    <TableCell className="text-left font-medium text-orange-600">
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
                                                                className={cn(
                                                                    "h-8 w-8",
                                                                    !row.product_variant_id ||
                                                                        !row.sale_price
                                                                        ? "opacity-50 cursor-not-allowed text-slate-400"
                                                                        : "text-green-600 hover:text-green-700 hover:bg-green-50",
                                                                )}
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
                                                                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
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
                                                        className="text-center py-12"
                                                    >
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                                                                <Package className="h-8 w-8 text-blue-600/50" />
                                                            </div>
                                                            <p className="text-slate-600 font-medium text-lg">
                                                                Chưa có sản phẩm
                                                                nào
                                                            </p>
                                                            <p className="text-sm text-slate-400 mt-1">
                                                                Nhấn "Thêm sản
                                                                phẩm" để bắt đầu
                                                            </p>
                                                        </div>
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
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm sản phẩm
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {/* Action Buttons */}
                <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        size="lg"
                        className="btn-gradient-premium shadow-xl hover:shadow-2xl px-8"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEdit ? "Cập nhật" : "Lưu lại"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}