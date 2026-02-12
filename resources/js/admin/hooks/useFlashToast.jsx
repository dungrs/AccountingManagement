import { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import toast from "react-hot-toast";

export default function useFlashToast() {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);
}