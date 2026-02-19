import { Label } from "@/admin/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import { cn } from "@/admin/lib/utils";
import { Navigation } from "lucide-react";

export default function NavigationSelect({
    value,
    onChange,
    label = "Điều hướng",
    placeholder = "Chọn điều hướng",
    required = false,
    navigations = [
        { value: "2", label: "Chọn điều hướng", disabled: true },
        { value: "0", label: "Không cho phép lập chỉ mục" },
        { value: "1", label: "Cho phép lập chỉ mục" },
    ],
}) {
    return (
        <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-blue-600" />
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="dropdown-premium-content">
                    {navigations.map((nav) => (
                        <SelectItem
                            key={nav.value}
                            value={nav.value}
                            disabled={nav.disabled}
                            className={cn(
                                "cursor-pointer",
                                nav.disabled
                                    ? "opacity-50"
                                    : "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5",
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {nav.value === "1" && (
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                )}
                                {nav.value === "0" && (
                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                )}
                                {nav.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}