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
import { Check, ChevronsUpDown, X } from "lucide-react";
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

    // ✅ Luôn làm việc với string[]
    const selectedValues = Array.isArray(value) ? value.map(String) : [];

    // ✅ Loại bỏ danh mục cha
    const availableCategories = categories
        .map((cat) => ({
            ...cat,
            value: String(cat.value),
        }))
        .filter(
            (cat) =>
                !parentCategoryId || cat.value !== String(parentCategoryId),
        );

    // ✅ Toggle chọn/bỏ chọn
    const handleSelect = (categoryValue) => {
        const newValues = selectedValues.includes(categoryValue)
            ? selectedValues.filter((v) => v !== categoryValue)
            : [...selectedValues, categoryValue];

        onChange(newValues);
    };

    // ✅ Remove badge
    const handleRemove = (categoryValue, e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(selectedValues.filter((v) => v !== categoryValue));
    };

    // ✅ Lấy category đã chọn
    const selectedCategories = selectedValues
        .map((val) => availableCategories.find((c) => c.value === val))
        .filter(Boolean);

    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-auto min-h-[40px]"
                        type="button"
                    >
                        <div className="flex flex-wrap gap-1 flex-1 mr-2">
                            {selectedCategories.length === 0 ? (
                                <span className="text-muted-foreground">
                                    {placeholder}
                                </span>
                            ) : (
                                selectedCategories.map((category) => (
                                    <Badge
                                        key={category.value}
                                        variant="secondary"
                                        className="flex items-center gap-1 text-xs"
                                    >
                                        {category.label}
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleRemove(category.value, e)
                                            }
                                            className="hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                            placeholder="Tìm kiếm danh mục..."
                        />
                        <CommandList>
                            <CommandEmpty>
                                Không tìm thấy danh mục.
                            </CommandEmpty>
                            <CommandGroup>
                                {availableCategories.map((category) => {
                                    const isSelected = selectedValues.includes(
                                        category.value,
                                    );
                                    return (
                                        <CommandItem
                                            key={category.value}
                                            value={category.value} // ✅ VALUE CHUẨN
                                            onSelect={handleSelect} // ✅ TRẢ VỀ VALUE
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />
                                            {category.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <small className="text-xs text-gray-500">
                Click để chọn/bỏ chọn, bấm X để xóa
            </small>
        </div>
    );
}
