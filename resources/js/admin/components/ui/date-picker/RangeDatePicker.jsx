"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";
import { formatDate } from "@/admin/utils/helpers";

const MONTHS = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
];

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const RangeDatePicker = ({
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
    inputClassName = "",
    popupClassName = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState(
        startDateProp ? new Date(startDateProp) : null,
    );
    const [endDate, setEndDate] = useState(
        endDateProp ? new Date(endDateProp) : null,
    );
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selecting, setSelecting] = useState("start"); // 'start' or 'end'
    const containerRef = useRef(null);

    // Đóng popup khi click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Cập nhật state khi props thay đổi
    useEffect(() => {
        setStartDate(startDateProp ? new Date(startDateProp) : null);
    }, [startDateProp]);

    useEffect(() => {
        setEndDate(endDateProp ? new Date(endDateProp) : null);
    }, [endDateProp]);

    // Format hiển thị khoảng thời gian
    const getDisplayValue = () => {
        if (!startDate && !endDate) return "";
        if (startDate && !endDate)
            return `Từ ${formatDate(startDate, "DD/MM/YYYY")}`;
        if (!startDate && endDate)
            return `Đến ${formatDate(endDate, "DD/MM/YYYY")}`;
        return `${formatDate(startDate, "DD/MM/YYYY")} - ${formatDate(
            endDate,
            "DD/MM/YYYY",
        )}`;
    };

    // Xử lý chọn ngày
    const handleDateSelect = (date) => {
        if (selecting === "start") {
            setStartDate(date);
            onStartDateChange(formatDate(date, "YYYY-MM-DD"));
            setSelecting("end");
        } else {
            // Nếu chọn ngày kết thúc nhỏ hơn ngày bắt đầu
            if (startDate && date < startDate) {
                setStartDate(date);
                setEndDate(startDate);
                onStartDateChange(formatDate(date, "YYYY-MM-DD"));
                onEndDateChange(formatDate(startDate, "YYYY-MM-DD"));
            } else {
                setEndDate(date);
                onEndDateChange(formatDate(date, "YYYY-MM-DD"));
            }
            setSelecting("start");
            // Không đóng popup tự động, để user có thể tiếp tục chọn
        }
    };

    // Xóa khoảng thời gian
    const handleClear = (e) => {
        e.stopPropagation();
        setStartDate(null);
        setEndDate(null);
        onStartDateChange("");
        onEndDateChange("");
        setSelecting("start");
    };

    // Reset selection
    const handleResetSelection = () => {
        setSelecting("start");
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1,
            ),
        );
    };

    const goToNextMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1,
            ),
        );
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    // Kiểm tra ngày có nằm trong khoảng đã chọn không
    const isInRange = (day) => {
        if (!startDate || !endDate) return false;
        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day,
        );
        return date >= startDate && date <= endDate;
    };

    // Kiểm tra ngày có phải là ngày bắt đầu không
    const isStartDate = (day) => {
        if (!startDate) return false;
        return (
            startDate.getDate() === day &&
            startDate.getMonth() === currentMonth.getMonth() &&
            startDate.getFullYear() === currentMonth.getFullYear()
        );
    };

    // Kiểm tra ngày có phải là ngày kết thúc không
    const isEndDate = (day) => {
        if (!endDate) return false;
        return (
            endDate.getDate() === day &&
            endDate.getMonth() === currentMonth.getMonth() &&
            endDate.getFullYear() === currentMonth.getFullYear()
        );
    };

    // Kiểm tra ngày có bị disable không
    const isDateDisabled = (day) => {
        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day,
        );

        if (minDate && date < new Date(minDate)) return true;
        if (maxDate && date > new Date(maxDate)) return true;

        return false;
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const disabled = isDateDisabled(day);
            const inRange = isInRange(day);
            const isStart = isStartDate(day);
            const isEnd = isEndDate(day);
            const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();

            days.push(
                <button
                    key={day}
                    onClick={() =>
                        !disabled &&
                        handleDateSelect(
                            new Date(
                                currentMonth.getFullYear(),
                                currentMonth.getMonth(),
                                day,
                            ),
                        )
                    }
                    disabled={disabled}
                    className={cn(
                        "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all relative",
                        "hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-blue-700",
                        disabled &&
                            "opacity-40 cursor-not-allowed hover:bg-transparent",
                        inRange &&
                            !isStart &&
                            !isEnd &&
                            "bg-blue-50 text-blue-700",
                        isStart &&
                            "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-md",
                        isEnd &&
                            "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-md",
                        isToday &&
                            !isStart &&
                            !isEnd &&
                            "border-2 border-blue-500 font-medium text-blue-600",
                    )}
                >
                    {day}
                </button>,
            );
        }

        return days;
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {/* Input */}
            <div
                className={cn(
                    "relative flex items-center cursor-pointer",
                    disabled && "opacity-60 cursor-not-allowed",
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <input
                    type="text"
                    value={getDisplayValue()}
                    placeholder={placeholder}
                    readOnly
                    disabled={disabled}
                    className={cn(
                        "w-full px-3 py-2 pr-10 border border-slate-300 rounded-md",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "bg-white",
                        disabled && "bg-slate-100 cursor-not-allowed",
                        inputClassName,
                    )}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {clearable && (startDate || endDate) && (
                        <button
                            onClick={handleClear}
                            className="p-0.5 hover:bg-slate-100 rounded-full"
                            type="button"
                        >
                            <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                        </button>
                    )}
                    <CalendarIcon
                        className={cn(
                            "h-4 w-4",
                            isOpen ? "text-blue-600" : "text-slate-400",
                        )}
                    />
                </div>
            </div>

            {/* Calendar Popup */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 p-4",
                        "w-80 animate-in fade-in-0 zoom-in-95",
                        popupClassName,
                    )}
                >
                    {/* Header - Selection Status */}
                    <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <p className="text-xs text-slate-600">
                            {selecting === "start"
                                ? "👉 Đang chọn ngày bắt đầu"
                                : "👉 Đang chọn ngày kết thúc"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                            {startDate && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    Từ: {formatDate(startDate, "DD/MM/YYYY")}
                                </span>
                            )}
                            {endDate && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                    Đến: {formatDate(endDate, "DD/MM/YYYY")}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            type="button"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="font-semibold text-slate-800">
                            {MONTHS[currentMonth.getMonth()]}{" "}
                            {currentMonth.getFullYear()}
                        </div>
                        <button
                            onClick={goToNextMonth}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            type="button"
                        >
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="h-8 w-8 flex items-center justify-center text-xs font-medium text-slate-500"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                    </div>

                    {/* Footer - Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                        <button
                            onClick={handleResetSelection}
                            className="flex-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                        >
                            Đặt lại
                        </button>
                        <button
                            onClick={() => {
                                if (startDate && endDate) {
                                    setIsOpen(false);
                                } else {
                                    toast?.error(
                                        "Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc",
                                    );
                                }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RangeDatePicker;