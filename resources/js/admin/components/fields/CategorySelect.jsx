"use client";

import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
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
import { Check, ChevronsUpDown, Info } from "lucide-react";
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
}) {
    // Loại bỏ danh mục bị exclude
    const filteredCategories = categories
        .map((cat) => ({
            ...cat,
            value: String(cat.value),
        }))
        .filter((cat) => cat.value !== String(excludeValue));

    // Lấy label đang chọn
    const selectedCategory = filteredCategories.find(
        (cat) => cat.value === String(value),
    );

    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        type="button"
                    >
                        {selectedCategory ? (
                            selectedCategory.label
                        ) : (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
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
                                {filteredCategories.map((category) => (
                                    <CommandItem
                                        key={category.value}
                                        value={category.label}
                                        onSelect={() =>
                                            onChange(category.value)
                                        }
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                category.value === String(value)
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                            )}
                                        />
                                        {category.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {showInfoMessage && (
                <small className="text-xs text-gray-500 flex items-start gap-1">
                    <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Chọn [Root] nếu không có danh mục cha</span>
                </small>
            )}
        </div>
    );
}
