"use client";

import { Button } from "@/admin/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/admin/components/ui/tooltip";
import { Badge } from "@/admin/components/ui/badge";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { cn } from "@/admin/lib/utils";

export default function DataTablePagination({
    selectedCount = 0,
    total = 0,
    currentPage = 1,
    lastPage = 1,
    pageSize = "10",
    setPageSize,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    pageSizeOptions = ["5", "10", "20", "50", "100"],
}) {
    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
            {/* Thông tin số dòng đã chọn */}
            <div className="flex items-center gap-2 text-sm order-2 sm:order-1">
                <span className="text-slate-500">Đã chọn</span>
                <Badge
                    variant="outline"
                    className={cn(
                        "font-medium px-3 py-0.5",
                        selectedCount > 0
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-50 text-slate-500 border-slate-200",
                    )}
                >
                    {selectedCount}
                </Badge>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-slate-700 font-medium">{total}</span>
                <span className="text-slate-500 ml-1">dòng</span>
            </div>

            {/* Phân trang */}
            <div className="flex items-center gap-4 order-1 sm:order-2">
                {/* Chọn số dòng mỗi trang */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 hidden sm:inline">
                        Hiển thị
                    </span>
                    <Select value={pageSize} onValueChange={setPageSize}>
                        <SelectTrigger className="h-8 w-[70px] border-slate-200 bg-white hover:bg-slate-50 focus:ring-blue-500">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="center" className="min-w-[70px]">
                            {pageSizeOptions.map((item) => (
                                <SelectItem
                                    key={item}
                                    value={item}
                                    className="cursor-pointer justify-center"
                                >
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-slate-500 hidden sm:inline">
                        dòng/trang
                    </span>
                </div>

                {/* Điều hướng trang */}
                <div className="flex items-center gap-1">
                    {/* Nút đến trang đầu */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50",
                                        currentPage === 1 &&
                                            "opacity-50 pointer-events-none",
                                    )}
                                    onClick={goToFirstPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Trang đầu
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Nút trang trước */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50",
                                        currentPage === 1 &&
                                            "opacity-50 pointer-events-none",
                                    )}
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Trang trước
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Hiển thị số trang */}
                    <div className="flex items-center gap-1 px-2">
                        <span className="text-sm font-medium text-blue-600 min-w-[24px] text-center">
                            {currentPage}
                        </span>
                        <span className="text-sm text-slate-400">/</span>
                        <span className="text-sm text-slate-600 min-w-[24px] text-center">
                            {lastPage}
                        </span>
                    </div>

                    {/* Nút trang sau */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50",
                                        currentPage === lastPage &&
                                            "opacity-50 pointer-events-none",
                                    )}
                                    onClick={goToNextPage}
                                    disabled={currentPage === lastPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Trang sau
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Nút đến trang cuối */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50",
                                        currentPage === lastPage &&
                                            "opacity-50 pointer-events-none",
                                    )}
                                    onClick={goToLastPage}
                                    disabled={currentPage === lastPage}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Trang cuối
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}