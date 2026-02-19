import { Label } from "@/admin/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import { cn } from "@/admin/lib/utils";
import { Activity } from "lucide-react";

export default function StatusSelect({
    value,
    onChange,
    label = "Tình trạng",
    placeholder = "Chọn tình trạng",
    required = false,
    options = [
        { value: "", label: "Chọn tình trạng" },
        { value: "0", label: "Không xuất bản" },
        { value: "1", label: "Xuất bản" },
    ],
}) {
    return (
        <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-purple-600" />
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="dropdown-premium-content">
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={cn(
                                "cursor-pointer",
                                option.disabled
                                    ? "opacity-50"
                                    : "hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5",
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {option.value === "1" && (
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                )}
                                {option.value === "0" && (
                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                )}
                                {option.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}