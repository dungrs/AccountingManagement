"use client";

import { Input } from "@/admin/components/ui/input";
import { Search } from "lucide-react";

export default function DataTableFilter({
    keyword,
    setKeyword,
    placeholder = "Tìm kiếm...",
    children,
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-9 rounded-md"
                />
            </div>

            {/* Extra Filters */}
            {children && (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    {children}
                </div>
            )}
        </div>
    );
}