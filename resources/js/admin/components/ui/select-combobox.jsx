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
import { Check, ChevronsUpDown, Search, XCircle } from "lucide-react";
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
    icon, // Optional icon prop
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
                <Label className="text-slate-700 flex items-center gap-1">
                    {icon && <span className="text-blue-600">{icon}</span>}
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
                            "w-full justify-between border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all",
                            error &&
                                "border-red-500 hover:border-red-500 hover:bg-red-50/50",
                            disabled &&
                                "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-slate-200",
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            {icon && !selected && (
                                <Search className="h-4 w-4 text-slate-400" />
                            )}
                            {selected ? (
                                <>
                                    {icon && (
                                        <span className="text-blue-600 shrink-0">
                                            {icon}
                                        </span>
                                    )}
                                    <span className="truncate block text-left font-normal text-slate-700">
                                        {truncateText(selected.label, 35)}
                                    </span>
                                    <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200 text-xs shrink-0">
                                        Đã chọn
                                    </Badge>
                                </>
                            ) : (
                                <span className="text-muted-foreground flex items-center gap-2">
                                    {icon && (
                                        <span className="text-slate-400">
                                            {icon}
                                        </span>
                                    )}
                                    {placeholder}
                                </span>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-blue-200 shadow-lg">
                    <Command className="rounded-lg">
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none"
                        />
                        <CommandList>
                            <CommandEmpty className="py-8 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                        <Search className="h-6 w-6 text-blue-600/50" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">
                                            Không tìm thấy dữ liệu
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Thử tìm kiếm với từ khóa khác
                                        </p>
                                    </div>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((item, index) => (
                                    <CommandItem
                                        key={item.value}
                                        value={item.label}
                                        onSelect={() =>
                                            onChange(String(item.value))
                                        }
                                        className={cn(
                                            "cursor-pointer py-3 px-2 transition-all",
                                            "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5",
                                            String(item.value) ===
                                                String(value) &&
                                                "bg-gradient-to-r from-blue-600/10 to-purple-600/10",
                                        )}
                                    >
                                        <div className="flex items-center w-full gap-3">
                                            <div
                                                className={cn(
                                                    "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-all",
                                                    String(item.value) ===
                                                        String(value)
                                                        ? "bg-blue-600 border-blue-600"
                                                        : "border-slate-300 group-hover:border-blue-400",
                                                )}
                                            >
                                                {String(item.value) ===
                                                    String(value) && (
                                                    <Check className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            <span className="flex-1 text-sm text-slate-700">
                                                {item.label}
                                            </span>
                                            {String(item.value) ===
                                                String(value) && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                    Đang chọn
                                                </Badge>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <XCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}