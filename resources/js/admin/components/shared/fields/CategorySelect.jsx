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
import { Check, ChevronsUpDown, Info, FolderTree } from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function CategorySelect({
    value,
    onChange,
    label = "Danh mục cha",
    placeholder = "Chọn danh mục",
    required = false,
    categories = [{ value: "root", label: "[Root]" }],
    excludeValue = null,
    showInfoMessage = true,
    errors = {},
}) {
    const filteredCategories = categories
        .map((cat) => ({
            ...cat,
            value: String(cat.value),
        }))
        .filter((cat) => cat.value !== String(excludeValue));

    const selectedCategory = filteredCategories.find(
        (cat) => cat.value === String(value),
    );

    const getError = (field) => {
        if (!errors[field]) return null;
        return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    };

    return (
        <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-1">
                <FolderTree className="h-3.5 w-3.5 text-blue-600" />
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        type="button"
                        className={cn(
                            "w-full justify-between border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all",
                            getError("attribute_catalogue_id") &&
                                "border-red-500 focus-visible:ring-red-500 hover:border-red-500",
                        )}
                    >
                        {selectedCategory ? (
                            <span className="flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-blue-600" />
                                {selectedCategory.label}
                            </span>
                        ) : (
                            <span className="text-muted-foreground flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-slate-400" />
                                {placeholder}
                            </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-blue-200 shadow-lg">
                    <Command className="rounded-lg">
                        <CommandInput
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                            placeholder="Tìm kiếm danh mục..."
                        />
                        <CommandList>
                            <CommandEmpty className="py-6 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <FolderTree className="h-8 w-8 text-slate-300" />
                                    <p className="text-sm text-slate-500">
                                        Không tìm thấy danh mục.
                                    </p>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredCategories.map((category) => (
                                    <CommandItem
                                        key={category.value}
                                        value={category.label}
                                        onSelect={() =>
                                            onChange(category.value)
                                        }
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                category.value === String(value)
                                                    ? "opacity-100 text-blue-600"
                                                    : "opacity-0",
                                            )}
                                        />
                                        <span className="flex items-center gap-2">
                                            <FolderTree className="h-3.5 w-3.5 text-slate-400" />
                                            {category.label}
                                        </span>
                                        {category.value === "root" && (
                                            <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                Gốc
                                            </Badge>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {errors.attribute_catalogue_id && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3" />
                    {errors.attribute_catalogue_id}
                </p>
            )}

            {showInfoMessage && (
                <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-md">
                    <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                        Chọn{" "}
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs mx-1">
                            [Root]
                        </Badge>{" "}
                        nếu không có danh mục cha
                    </span>
                </div>
            )}
        </div>
    );
}