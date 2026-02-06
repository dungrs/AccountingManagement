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

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

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
    pageSizeOptions = ["5", "10", "20", "50"],
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Selected rows */}
            <div className="text-sm text-muted-foreground">
                {selectedCount} of {total} row(s) selected.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                {/* Page size */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                        Rows per page
                    </span>

                    <Select value={pageSize} onValueChange={setPageSize}>
                        <SelectTrigger className="w-[80px] rounded-md">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            {pageSizeOptions.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page info */}
                <div className="text-sm font-medium">
                    Page {currentPage} of {lastPage}
                </div>

                {/* Pagination buttons */}
                <TooltipProvider>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-md"
                                    onClick={goToFirstPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to first page</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-md"
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to previous page</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-md"
                                    onClick={goToNextPage}
                                    disabled={currentPage === lastPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to next page</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-md"
                                    onClick={goToLastPage}
                                    disabled={currentPage === lastPage}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to last page</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
        </div>
    );
}