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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function SelectCombobox({
    label,
    value,
    onChange,
    options = [], // [{ value, label }]
    placeholder = "Chọn dữ liệu...",
    searchPlaceholder = "Tìm kiếm...",
    disabled = false,
    error,
    required = false,
}) {
    const selected = options.find((o) => String(o.value) === String(value));

    const truncateText = (text, maxLength = 30) => {
        if (!text) return "";
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    };

    return (
        <div className="space-y-2">
            {label && (
                <Label>
                    {label}
                    {required && <span className="text-red-500"> *</span>}
                </Label>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between",
                            error && "border-red-500",
                        )}
                    >
                        {selected ? (
                            <span className="truncate block text-left">
                                {truncateText(selected.label, 35)}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                        />
                        <CommandList>
                            <CommandEmpty>Không tìm thấy dữ liệu</CommandEmpty>
                            <CommandGroup>
                                {options.map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        value={item.label}
                                        onSelect={() =>
                                            onChange(String(item.value))
                                        }
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                String(item.value) ===
                                                    String(value)
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                            )}
                                        />
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}