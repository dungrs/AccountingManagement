"use client";

import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
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
import { Check, ChevronsUpDown, X, FolderTree, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/admin/lib/utils";

export default function MultiCategorySelect({
    value = [],
    onChange,
    label = "Chọn danh mục",
    placeholder = "Chọn danh mục",
    required = false,
    categories = [],
    parentCategoryId = null,
}) {
    const [open, setOpen] = useState(false);

    const selectedValues = Array.isArray(value) ? value.map(String) : [];

    const availableCategories = categories
        .map((cat) => ({
            ...cat,
            value: String(cat.value),
        }))
        .filter(
            (cat) =>
                !parentCategoryId || cat.value !== String(parentCategoryId),
        );

    const handleSelect = (categoryValue) => {
        const newValues = selectedValues.includes(categoryValue)
            ? selectedValues.filter((v) => v !== categoryValue)
            : [...selectedValues, categoryValue];

        onChange(newValues);
    };

    const handleRemove = (categoryValue, e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(selectedValues.filter((v) => v !== categoryValue));
    };

    const selectedCategories = selectedValues
        .map((val) => availableCategories.find((c) => c.value === val))
        .filter(Boolean);

    return (
        <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-purple-600" />
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-auto min-h-[40px] border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                        type="button"
                    >
                        <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
                            {selectedCategories.length === 0 ? (
                                <span className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-slate-400" />
                                    {placeholder}
                                </span>
                            ) : (
                                selectedCategories.map((category) => (
                                    <Badge
                                        key={category.value}
                                        variant="secondary"
                                        className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 border-purple-200 py-1"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <FolderTree className="h-3 w-3" />
                                            <span>{category.label}</span>

                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) =>
                                                    handleRemove(
                                                        category.value,
                                                        e,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" ||
                                                        e.key === " "
                                                    ) {
                                                        handleRemove(
                                                            category.value,
                                                            e,
                                                        );
                                                    }
                                                }}
                                                className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </span>
                                        </span>
                                    </Badge>
                                ))
                            )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-purple-200 shadow-lg">
                    <Command className="rounded-lg">
                        <CommandInput
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                            placeholder="Tìm kiếm danh mục..."
                        />
                        <CommandList>
                            <CommandEmpty className="py-6 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Layers className="h-8 w-8 text-slate-300" />
                                    <p className="text-sm text-slate-500">
                                        Không tìm thấy danh mục.
                                    </p>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {availableCategories.map((category) => {
                                    const isSelected = selectedValues.includes(
                                        category.value,
                                    );
                                    return (
                                        <CommandItem
                                            key={category.value}
                                            value={category.value}
                                            onSelect={handleSelect}
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
                                            <span className="flex items-center gap-2 flex-1">
                                                <FolderTree className="h-3.5 w-3.5 text-slate-400" />
                                                {category.label}
                                            </span>
                                            {isSelected && (
                                                <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                                    Đã chọn
                                                </Badge>
                                            )}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-gradient-to-r from-purple-50 to-blue-50 p-2 rounded-md">
                <Layers className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>
                    Click để chọn/bỏ chọn, bấm{" "}
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs mx-1">
                        X
                    </Badge>{" "}
                    để xóa
                </span>
            </div>
        </div>
    );
}