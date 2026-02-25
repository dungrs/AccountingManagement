"use client";

import * as React from "react";
import { format, addMonths, subMonths, setMonth, setYear } from "date-fns";
import { vi } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

import { Button } from "@/admin/components/ui/button";
import { Calendar } from "@/admin/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/admin/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";

export const DatePicker = ({
    value,
    onChange,
    placeholder = "Chọn ngày",
    disabled = false,
    clearable = true,
    minDate,
    maxDate,
    className = "",
}) => {
    const [date, setDate] = React.useState(value ? new Date(value) : null);
    const [month, setMonth] = React.useState(date || new Date());

    // Cập nhật date khi value thay đổi
    React.useEffect(() => {
        if (value) {
            setDate(new Date(value));
        } else {
            setDate(null);
        }
    }, [value]);

    // Xử lý khi chọn ngày
    const handleSelect = (selectedDate) => {
        setDate(selectedDate);
        if (selectedDate) {
            onChange(format(selectedDate, "yyyy-MM-dd"));
        } else {
            onChange("");
        }
    };

    // Xóa ngày đã chọn
    const handleClear = (e) => {
        e.stopPropagation();
        setDate(null);
        onChange("");
    };

    return (
        <div className={cn("relative", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                            format(date, "dd/MM/yyyy", { locale: vi })
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                {clearable && date && (
                    <button
                        onClick={handleClear}
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full z-10"
                        type="button"
                    >
                        <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                )}
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        month={month}
                        onMonthChange={setMonth}
                        initialFocus
                        locale={vi}
                        disabled={(date) => {
                            if (minDate && date < new Date(minDate))
                                return true;
                            if (maxDate && date > new Date(maxDate))
                                return true;
                            return false;
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

export const RangeDatePicker = ({
    startDate: startDateProp,
    endDate: endDateProp,
    onStartDateChange,
    onEndDateChange,
    placeholder = "Chọn khoảng thời gian",
    disabled = false,
    clearable = true,
    minDate,
    maxDate,
    className = "",
}) => {
    const [date, setDate] = React.useState({
        from: startDateProp ? new Date(startDateProp) : null,
        to: endDateProp ? new Date(endDateProp) : null,
    });

    // State cho việc điều hướng tháng
    const [month1, setMonth1] = React.useState(date?.from || new Date());
    const [month2, setMonth2] = React.useState(
        date?.from ? addMonths(date.from, 1) : addMonths(new Date(), 1),
    );

    // Cập nhật state khi props thay đổi
    React.useEffect(() => {
        setDate({
            from: startDateProp ? new Date(startDateProp) : null,
            to: endDateProp ? new Date(endDateProp) : null,
        });
    }, [startDateProp, endDateProp]);

    // Xử lý khi chọn khoảng thời gian
    const handleSelect = (range) => {
        setDate(range);

        if (range?.from) {
            onStartDateChange(format(range.from, "yyyy-MM-dd"));
            // Cập nhật tháng hiển thị nếu chọn ngày xa
            if (
                range.from.getMonth() !== month1.getMonth() ||
                range.from.getFullYear() !== month1.getFullYear()
            ) {
                setMonth1(range.from);
                setMonth2(addMonths(range.from, 1));
            }
        } else {
            onStartDateChange("");
        }

        if (range?.to) {
            onEndDateChange(format(range.to, "yyyy-MM-dd"));
        } else {
            onEndDateChange("");
        }
    };

    // Xóa khoảng thời gian
    const handleClear = (e) => {
        e.stopPropagation();
        setDate({ from: null, to: null });
        onStartDateChange("");
        onEndDateChange("");
    };

    // Điều hướng tháng
    const goToPreviousMonths = () => {
        setMonth1(subMonths(month1, 1));
        setMonth2(subMonths(month2, 1));
    };

    const goToNextMonths = () => {
        setMonth1(addMonths(month1, 1));
        setMonth2(addMonths(month2, 1));
    };

    // Format hiển thị
    const getDisplayValue = () => {
        if (!date.from && !date.to) return placeholder;
        if (date.from && !date.to) {
            return `Từ ${format(date.from, "dd/MM/yyyy", { locale: vi })}`;
        }
        if (!date.from && date.to) {
            return `Đến ${format(date.to, "dd/MM/yyyy", { locale: vi })}`;
        }
        return `${format(date.from, "dd/MM/yyyy", { locale: vi })} - ${format(
            date.to,
            "dd/MM/yyyy",
            { locale: vi },
        )}`;
    };

    return (
        <div className={cn("relative", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date.from && !date.to && "text-muted-foreground",
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">{getDisplayValue()}</span>
                    </Button>
                </PopoverTrigger>
                {clearable && (date.from || date.to) && (
                    <button
                        onClick={handleClear}
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full z-10"
                        type="button"
                    >
                        <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                )}
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                        {/* Điều hướng nhanh */}
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    handleSelect({ from: today, to: today });
                                }}
                            >
                                Hôm nay
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const start = new Date();
                                        const end = new Date();
                                        end.setDate(end.getDate() + 7);
                                        handleSelect({ from: start, to: end });
                                    }}
                                >
                                    7 ngày
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const start = new Date();
                                        const end = new Date();
                                        end.setMonth(end.getMonth() + 1);
                                        handleSelect({ from: start, to: end });
                                    }}
                                >
                                    30 ngày
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const start = new Date();
                                        start.setMonth(0, 1);
                                        const end = new Date();
                                        end.setMonth(11, 31);
                                        handleSelect({ from: start, to: end });
                                    }}
                                >
                                    Năm nay
                                </Button>
                            </div>
                        </div>

                        {/* Điều hướng tháng */}
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToPreviousMonths}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={month1.getMonth().toString()}
                                        onValueChange={(value) => {
                                            const newMonth = setMonth(
                                                month1,
                                                parseInt(value),
                                            );
                                            setMonth1(newMonth);
                                            setMonth2(addMonths(newMonth, 1));
                                        }}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Tháng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: 12 },
                                                (_, i) => (
                                                    <SelectItem
                                                        key={i}
                                                        value={i.toString()}
                                                    >
                                                        Tháng {i + 1}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={month1.getFullYear().toString()}
                                        onValueChange={(value) => {
                                            const newMonth = setYear(
                                                month1,
                                                parseInt(value),
                                            );
                                            setMonth1(newMonth);
                                            setMonth2(addMonths(newMonth, 1));
                                        }}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Năm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: 10 },
                                                (_, i) => {
                                                    const year =
                                                        new Date().getFullYear() -
                                                        5 +
                                                        i;
                                                    return (
                                                        <SelectItem
                                                            key={year}
                                                            value={year.toString()}
                                                        >
                                                            {year}
                                                        </SelectItem>
                                                    );
                                                },
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={month2.getMonth().toString()}
                                        onValueChange={(value) => {
                                            const newMonth = setMonth(
                                                month2,
                                                parseInt(value),
                                            );
                                            setMonth2(newMonth);
                                        }}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Tháng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: 12 },
                                                (_, i) => (
                                                    <SelectItem
                                                        key={i}
                                                        value={i.toString()}
                                                    >
                                                        Tháng {i + 1}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={month2.getFullYear().toString()}
                                        onValueChange={(value) => {
                                            const newMonth = setYear(
                                                month2,
                                                parseInt(value),
                                            );
                                            setMonth2(newMonth);
                                        }}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Năm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: 10 },
                                                (_, i) => {
                                                    const year =
                                                        new Date().getFullYear() -
                                                        5 +
                                                        i;
                                                    return (
                                                        <SelectItem
                                                            key={year}
                                                            value={year.toString()}
                                                        >
                                                            {year}
                                                        </SelectItem>
                                                    );
                                                },
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToNextMonths}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Hiển thị 2 lịch */}
                        <div className="flex gap-4">
                            <Calendar
                                mode="range"
                                selected={date}
                                onSelect={handleSelect}
                                month={month1}
                                onMonthChange={setMonth1}
                                numberOfMonths={1}
                                initialFocus
                                locale={vi}
                                disabled={(date) => {
                                    if (minDate && date < new Date(minDate))
                                        return true;
                                    if (maxDate && date > new Date(maxDate))
                                        return true;
                                    return false;
                                }}
                            />
                            <Calendar
                                mode="range"
                                selected={date}
                                onSelect={handleSelect}
                                month={month2}
                                onMonthChange={setMonth2}
                                numberOfMonths={1}
                                locale={vi}
                                disabled={(date) => {
                                    if (minDate && date < new Date(minDate))
                                        return true;
                                    if (maxDate && date > new Date(maxDate))
                                        return true;
                                    return false;
                                }}
                            />
                        </div>

                        {/* Nút xác nhận */}
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDate({ from: null, to: null });
                                    onStartDateChange("");
                                    onEndDateChange("");
                                }}
                            >
                                Xóa
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (date?.from && date?.to) {
                                        // Đóng popover
                                        document.body.click();
                                    }
                                }}
                                disabled={!date?.from || !date?.to}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                            >
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DatePicker;