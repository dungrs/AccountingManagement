"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/admin/components/ui/alert-dialog";

import { AlertTriangle, Trash2, XCircle } from "lucide-react";

export default function ConfirmDeleteDialog({
    open,
    title = "Xác nhận xóa",
    description = "Hành động này không thể hoàn tác.",
    onCancel,
    onConfirm,
}) {
    return (
        <AlertDialog open={open} onOpenChange={onCancel}>
            <AlertDialogContent className="sm:max-w-[450px] p-0 gap-0 rounded-lg overflow-hidden border-0 shadow-2xl">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/80 text-base">
                            Vui lòng xác nhận trước khi thực hiện hành động này
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                {/* Content */}
                <div className="px-6 py-6 bg-white">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-700 text-base leading-relaxed">
                                {description}
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                <XCircle className="h-4 w-4 inline mr-1 text-red-500" />
                                Dữ liệu đã xóa sẽ không thể khôi phục.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <AlertDialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200 gap-3">
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-all"
                    >
                        Hủy bỏ
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 rounded-md shadow-lg shadow-red-600/20 transition-all"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xác nhận xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}