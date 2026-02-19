"use client";

import { useMemo, useState } from "react";
import AdminLayout from "@/admin/layouts/AdminLayout";
import { Head, router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import { Fragment } from "react";

import { Checkbox } from "@/admin/components/ui/checkbox";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import axios from "axios";

import {
    Shield,
    Lock,
    Users,
    Settings,
    Key,
    Save,
    CheckCircle2,
    XCircle,
    Eye,
    PlusCircle,
    Pencil,
    Trash2,
    FileText,
    Home,
    Package,
    ShoppingCart,
    Truck,
    CreditCard,
    Wallet,
    PieChart,
    UserCog,
    Building2,
    Briefcase,
    Sparkles,
    ChevronRight,
} from "lucide-react";

import { cn } from "@/admin/lib/utils";

// Mapping icon cho các module
const moduleIcons = {
    admin: Shield,
    user: Users,
    product: Package,
    customer: Users,
    supplier: Truck,
    receipt: FileText,
    voucher: CreditCard,
    debt: Wallet,
    accounting: PieChart,
    system: Settings,
    permission: Key,
    dashboard: Home,
    order: ShoppingCart,
    // Thêm các module khác nếu cần
};

// Màu sắc cho các module
const moduleColors = {
    admin: "from-purple-500 to-purple-600",
    user: "from-blue-500 to-blue-600",
    product: "from-green-500 to-green-600",
    customer: "from-amber-500 to-amber-600",
    supplier: "from-cyan-500 to-cyan-600",
    receipt: "from-indigo-500 to-indigo-600",
    voucher: "from-pink-500 to-pink-600",
    debt: "from-rose-500 to-rose-600",
    accounting: "from-emerald-500 to-emerald-600",
    system: "from-slate-500 to-slate-600",
    permission: "from-violet-500 to-violet-600",
    dashboard: "from-blue-500 to-purple-500",
};

export default function Permission() {
    const { userCatalogues = [], permissions = [] } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState(() => {
        const initial = {};
        userCatalogues.forEach((catalogue) => {
            initial[catalogue.id] = new Set(
                catalogue.permissions?.map((p) => p.id) || [],
            );
        });
        return initial;
    });

    /* ===============================
     * GROUP PERMISSION BY MODULE
     * =============================== */
    const groupedPermissions = useMemo(() => {
        return permissions.reduce((acc, p) => {
            const [module] = p.canonical.split(".");
            acc[module] = acc[module] || [];
            acc[module].push(p);
            return acc;
        }, {});
    }, [permissions]);

    /* ===============================
     * MAPPING CRUD ACTIONS
     * =============================== */
    const actionMapping = {
        view: { icon: Eye, label: "Xem", color: "blue" },
        create: { icon: PlusCircle, label: "Thêm", color: "green" },
        update: { icon: Pencil, label: "Sửa", color: "amber" },
        delete: { icon: Trash2, label: "Xóa", color: "red" },
    };

    /* ===============================
     * TOGGLE HANDLERS
     * =============================== */

    const togglePermission = (catalogueId, permissionId) => {
        setSelectedPermissions((prev) => {
            const newState = { ...prev };
            const permSet = new Set(newState[catalogueId]);

            if (permSet.has(permissionId)) {
                permSet.delete(permissionId);
            } else {
                permSet.add(permissionId);
            }

            newState[catalogueId] = permSet;
            return newState;
        });
    };

    const toggleColumn = (catalogueId, checked) => {
        setSelectedPermissions((prev) => {
            const newState = { ...prev };
            if (checked) {
                newState[catalogueId] = new Set(permissions.map((p) => p.id));
            } else {
                newState[catalogueId] = new Set();
            }
            return newState;
        });
    };

    const toggleRow = (permissionId, checked) => {
        setSelectedPermissions((prev) => {
            const newState = { ...prev };
            userCatalogues.forEach((catalogue) => {
                const permSet = new Set(newState[catalogue.id] || []);
                if (checked) {
                    permSet.add(permissionId);
                } else {
                    permSet.delete(permissionId);
                }
                newState[catalogue.id] = permSet;
            });
            return newState;
        });
    };

    const toggleCrud = (module, action, checked) => {
        const canonicalAction = actionMapping[action];
        const targetPerms = permissions.filter((p) => {
            const parts = p.canonical.split(".");
            return parts[0] === module && parts.includes(canonicalAction);
        });

        setSelectedPermissions((prev) => {
            const newState = { ...prev };
            userCatalogues.forEach((catalogue) => {
                const permSet = new Set(newState[catalogue.id] || []);
                targetPerms.forEach((perm) => {
                    if (checked) {
                        permSet.add(perm.id);
                    } else {
                        permSet.delete(perm.id);
                    }
                });
                newState[catalogue.id] = permSet;
            });
            return newState;
        });
    };

    const toggleModule = (module, checked) => {
        const modulePerms = groupedPermissions[module] || [];

        setSelectedPermissions((prev) => {
            const newState = { ...prev };
            userCatalogues.forEach((catalogue) => {
                const permSet = new Set(newState[catalogue.id] || []);
                modulePerms.forEach((perm) => {
                    if (checked) {
                        permSet.add(perm.id);
                    } else {
                        permSet.delete(perm.id);
                    }
                });
                newState[catalogue.id] = permSet;
            });
            return newState;
        });
    };

    /* ===============================
     * CHECK STATES
     * =============================== */

    const isColumnChecked = (catalogueId) => {
        return selectedPermissions[catalogueId]?.size === permissions.length;
    };

    const isRowChecked = (permissionId) => {
        return userCatalogues.every((catalogue) =>
            selectedPermissions[catalogue.id]?.has(permissionId),
        );
    };

    const isModuleChecked = (module) => {
        const modulePerms = groupedPermissions[module] || [];
        return userCatalogues.every((catalogue) =>
            modulePerms.every((perm) =>
                selectedPermissions[catalogue.id]?.has(perm.id),
            ),
        );
    };

    const isModuleCheckedByCatalogue = (catalogueId, module) => {
        const modulePerms = groupedPermissions[module] || [];

        return modulePerms.every((perm) =>
            selectedPermissions[catalogueId]?.has(perm.id),
        );
    };

    const toggleModuleByCatalogue = (catalogueId, module, checked) => {
        const modulePerms = groupedPermissions[module] || [];

        setSelectedPermissions((prev) => {
            const newState = { ...prev };
            const permSet = new Set(newState[catalogueId] || []);

            modulePerms.forEach((perm) => {
                if (checked) {
                    permSet.add(perm.id);
                } else {
                    permSet.delete(perm.id);
                }
            });

            newState[catalogueId] = permSet;
            return newState;
        });
    };

    /* ===============================
     * SUBMIT HANDLER
     * =============================== */

    const handleSubmit = () => {
        setLoading(true);

        const payload = {};
        Object.keys(selectedPermissions).forEach((catalogueId) => {
            payload[catalogueId] = Array.from(selectedPermissions[catalogueId]);
        });

        axios
            .post(route("admin.user.catalogue.updatePermission"), {
                permissions: payload,
            })
            .then((response) => {
                const data = response?.data || {};
                if (data.status === "success") {
                    toast.success(data.message ?? "Cập nhật thành công");
                } else {
                    toast.error(data.message ?? "Cập nhật thất bại");
                }
            })
            .catch((error) => {
                if (error.response?.data?.errors?.permissions) {
                    toast.error("Dữ liệu quyền không hợp lệ");
                } else {
                    toast.error("Có lỗi xảy ra, vui lòng thử lại");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    /* ===============================
     * STATISTICS
     * =============================== */

    const getStats = (catalogueId) => {
        const selected = selectedPermissions[catalogueId]?.size || 0;
        const total = permissions.length;
        return { selected, total };
    };

    /* ===============================
     * RENDER
     * =============================== */

    return (
        <AdminLayout
            breadcrumb={[
                {
                    label: "Dashboard",
                    link: route("admin.dashboard.index"),
                },
                {
                    label: "Phân Quyền",
                },
            ]}
        >
            <Head title="Cập nhật quyền" />

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tổng nhóm
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {userCatalogues.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tổng quyền
                                </p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {permissions.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Key className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Module
                                </p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {Object.keys(groupedPermissions).length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Settings className="h-6 w-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <Card className="rounded-md shadow-lg border-slate-200 overflow-hidden">
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <CardHeader className="p-0">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                    Phân quyền hệ thống
                                    <Badge className="bg-white/20 text-white border-0 ml-2">
                                        Quản lý truy cập
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-white/80">
                                    Quản lý quyền truy cập cho từng nhóm người
                                    dùng
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </div>

                <div className="max-h-[650px] overflow-auto border-t scrollbar-premium">
                    <Table>
                        {/* HEADER */}
                        <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
                            <TableRow className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                                <TableHead className="sticky left-0 bg-white z-10 min-w-[300px] font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-blue-600" />
                                        Danh sách quyền
                                    </div>
                                </TableHead>

                                {userCatalogues.map((catalogue) => {
                                    const stats = getStats(catalogue.id);
                                    return (
                                        <TableHead
                                            key={catalogue.id}
                                            className="text-center min-w-[140px]"
                                        >
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-purple-600" />
                                                    <span className="font-semibold text-slate-700">
                                                        {catalogue.name}
                                                    </span>
                                                </div>
                                                <Badge
                                                    className={cn(
                                                        "text-xs font-medium",
                                                        stats.selected ===
                                                            stats.total
                                                            ? "bg-green-100 text-green-700 border-green-200"
                                                            : stats.selected ===
                                                                0
                                                              ? "bg-slate-100 text-slate-700 border-slate-200"
                                                              : "bg-blue-100 text-blue-700 border-blue-200",
                                                    )}
                                                >
                                                    {stats.selected}/
                                                    {stats.total}
                                                </Badge>
                                                <Checkbox
                                                    checked={isColumnChecked(
                                                        catalogue.id,
                                                    )}
                                                    onCheckedChange={(v) =>
                                                        toggleColumn(
                                                            catalogue.id,
                                                            v,
                                                        )
                                                    }
                                                    className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>

                        {/* BODY */}
                        <TableBody>
                            {Object.entries(groupedPermissions).map(
                                ([module, perms], moduleIndex) => {
                                    const IconComponent =
                                        moduleIcons[module] || Shield;
                                    const colorClass =
                                        moduleColors[module] ||
                                        "from-blue-500 to-purple-500";

                                    return (
                                        <Fragment key={module}>
                                            {/* MODULE HEADER */}
                                            <TableRow className="bg-gradient-to-r from-slate-50 to-white">
                                                <TableCell className="sticky left-0 bg-gradient-to-r from-slate-50 to-white z-10">
                                                    <div className="flex items-center gap-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={isModuleChecked(
                                                                    module,
                                                                )}
                                                                onCheckedChange={(
                                                                    v,
                                                                ) =>
                                                                    toggleModule(
                                                                        module,
                                                                        v,
                                                                    )
                                                                }
                                                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                            <div
                                                                className={cn(
                                                                    "h-8 w-8 rounded-lg bg-gradient-to-r flex items-center justify-center text-white",
                                                                    colorClass,
                                                                )}
                                                            >
                                                                <IconComponent className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-800 uppercase">
                                                                    {module.replace(
                                                                        /_/g,
                                                                        " ",
                                                                    )}
                                                                </span>
                                                                <p className="text-xs text-slate-500">
                                                                    {
                                                                        perms.length
                                                                    }{" "}
                                                                    quyền
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-1">
                                                            {Object.entries(
                                                                actionMapping,
                                                            ).map(
                                                                ([
                                                                    action,
                                                                    {
                                                                        icon: ActionIcon,
                                                                        label,
                                                                        color,
                                                                    },
                                                                ]) => (
                                                                    <Button
                                                                        key={
                                                                            action
                                                                        }
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            toggleCrud(
                                                                                module,
                                                                                action,
                                                                                true,
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            "h-7 px-2 text-xs gap-1",
                                                                            `hover:bg-${color}-50 hover:text-${color}-600`,
                                                                        )}
                                                                        title={`Chọn tất cả quyền ${label}`}
                                                                    >
                                                                        <ActionIcon
                                                                            className={cn(
                                                                                "h-3.5 w-3.5",
                                                                                `text-${color}-500`,
                                                                            )}
                                                                        />
                                                                        {label}
                                                                    </Button>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {userCatalogues.map(
                                                    (catalogue) => (
                                                        <TableCell
                                                            key={catalogue.id}
                                                            className="bg-gradient-to-r from-slate-50 to-white text-center"
                                                        >
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    checked={isModuleCheckedByCatalogue(
                                                                        catalogue.id,
                                                                        module,
                                                                    )}
                                                                    onCheckedChange={(
                                                                        v,
                                                                    ) =>
                                                                        toggleModuleByCatalogue(
                                                                            catalogue.id,
                                                                            module,
                                                                            v,
                                                                        )
                                                                    }
                                                                    className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                    ),
                                                )}
                                            </TableRow>

                                            {/* PERMISSIONS */}
                                            {perms.map(
                                                (permission, permIndex) => (
                                                    <TableRow
                                                        key={permission.id}
                                                        className={cn(
                                                            "hover:bg-gradient-to-r hover:from-blue-600/5 hover:to-purple-600/5 transition-all duration-200",
                                                            permIndex % 2 === 0
                                                                ? "bg-white"
                                                                : "bg-slate-50/30",
                                                        )}
                                                    >
                                                        <TableCell className="sticky left-0 bg-inherit z-10">
                                                            <div className="flex items-center gap-3 pl-12">
                                                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                                <Checkbox
                                                                    checked={isRowChecked(
                                                                        permission.id,
                                                                    )}
                                                                    onCheckedChange={(
                                                                        v,
                                                                    ) =>
                                                                        toggleRow(
                                                                            permission.id,
                                                                            v,
                                                                        )
                                                                    }
                                                                    className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        {
                                                                            permission.name
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        {
                                                                            permission.canonical
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {userCatalogues.map(
                                                            (catalogue) => {
                                                                const isChecked =
                                                                    selectedPermissions[
                                                                        catalogue
                                                                            .id
                                                                    ]?.has(
                                                                        permission.id,
                                                                    );

                                                                return (
                                                                    <TableCell
                                                                        key={`${catalogue.id}-${permission.id}`}
                                                                        className="text-center"
                                                                    >
                                                                        <div className="flex justify-center">
                                                                            <Checkbox
                                                                                checked={
                                                                                    isChecked
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        catalogue.id,
                                                                                        permission.id,
                                                                                    )
                                                                                }
                                                                                className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                            />
                                                                        </div>
                                                                    </TableCell>
                                                                );
                                                            },
                                                        )}
                                                    </TableRow>
                                                ),
                                            )}
                                        </Fragment>
                                    );
                                },
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end items-center gap-4 mt-6">
                <div className="flex items-center gap-3">
                    <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {permissions.length} quyền
                    </Badge>
                    <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                        <Users className="h-3.5 w-3.5 mr-1" />
                        {userCatalogues.length} nhóm
                    </Badge>
                </div>
                <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-gradient-premium px-8"
                >
                    {loading ? (
                        <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Lưu phân quyền
                        </>
                    )}
                </Button>
            </div>
        </AdminLayout>
    );
}