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

export default function ConfirmDeleteDialog({
    open,
    title = "Xác nhận xóa",
    description = "Hành động này không thể hoàn tác.",
    onCancel,
    onConfirm,
}) {
    return (
        <AlertDialog open={open} onOpenChange={onCancel}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={onConfirm}
                    >
                        Xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}