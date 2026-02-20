"use client";

import { cn } from "@/admin/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function SummaryCard({
    title,
    value,
    icon: Icon,
    trend = null,
    trendValue = null,
    color = "blue",
    className,
}) {
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        red: "from-red-500 to-red-600",
        yellow: "from-yellow-500 to-yellow-600",
        purple: "from-purple-500 to-purple-600",
        indigo: "from-indigo-500 to-indigo-600",
    };

    const lightColorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        yellow: "bg-yellow-50 text-yellow-600",
        purple: "bg-purple-50 text-purple-600",
        indigo: "bg-indigo-50 text-indigo-600",
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-lg",
                colorClasses[color],
                className,
            )}
        >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
            <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-white/10"></div>

            <div className="relative">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">{title}</p>
                    <div
                        className={cn(
                            "rounded-lg p-2",
                            lightColorClasses[color],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <p className="mt-4 text-3xl font-bold">{value}</p>

                {trend && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        {trend === "up" ? (
                            <ArrowUp className="h-4 w-4 text-green-300" />
                        ) : trend === "down" ? (
                            <ArrowDown className="h-4 w-4 text-red-300" />
                        ) : null}
                        <span
                            className={cn(
                                "font-medium",
                                trend === "up"
                                    ? "text-green-300"
                                    : trend === "down"
                                      ? "text-red-300"
                                      : "text-white/60",
                            )}
                        >
                            {trendValue}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}