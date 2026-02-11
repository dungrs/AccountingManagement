import { Label } from "@/admin/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";

export default function StatusSelect({ 
    value, 
    onChange, 
    label = "Tình trạng",
    placeholder = "Chọn tình trạng",
    required = false,
    options = [
        { value: "", label: "Chọn tình trạng" },
        { value: "0", label: "Không xuất bản" },
        { value: "1", label: "Xuất bản" }
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
                    {options.map((option) => (
                        <SelectItem 
                            key={option.value} 
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}