import { Label } from "@/admin/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";

export default function NavigationSelect({ 
    value, 
    onChange, 
    label = "Điều hướng",
    placeholder = "Chọn điều hướng",
    required = false,
    navigations = [
        { value: "2", label: "Chọn điều hướng", disabled: true },
        { value: "0", label: "Không cho phép lập chỉ mục" },
        { value: "1", label: "Cho phép lập chỉ mục" }
    ]
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {navigations.map((nav) => (
                        <SelectItem 
                            key={nav.value} 
                            value={nav.value}
                            disabled={nav.disabled}
                        >
                            {nav.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}