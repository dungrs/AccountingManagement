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
        view: "index",
        create: "create",
        update: "update",
        delete: "destroy",
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">
                                Phân quyền hệ thống
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Quản lý quyền truy cập cho từng nhóm người dùng
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <div className="max-h-[650px] overflow-auto border-t">
                    <Table>
                        {/* HEADER */}
                        <TableHeader className="sticky top-0 bg-background z-20">
                            <TableRow>
                                <TableHead className="sticky left-0 bg-background z-10 min-w-[300px] font-semibold">
                                    Danh sách quyền
                                </TableHead>

                                {userCatalogues.map((catalogue) => {
                                    const stats = getStats(catalogue.id);
                                    return (
                                        <TableHead
                                            key={catalogue.id}
                                            className="text-center min-w-[140px]"
                                        >
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                <span className="font-semibold">
                                                    {catalogue.name}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
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
                                ([module, perms]) => (
                                    <Fragment key={module}>
                                        {/* MODULE HEADER */}
                                        <TableRow className="bg-muted/50">
                                            <TableCell className="sticky left-0 bg-muted/50 z-10">
                                                <div className="flex items-center gap-4 py-2">
                                                    <div className="flex items-center gap-2">
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
                                                        />
                                                        <span className="font-semibold uppercase">
                                                            {module.replace(
                                                                /_/g,
                                                                " ",
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {Object.entries(
                                                            actionMapping,
                                                        ).map(([action]) => (
                                                            <Button
                                                                key={action}
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    toggleCrud(
                                                                        module,
                                                                        action,
                                                                        true,
                                                                    )
                                                                }
                                                            >
                                                                {action}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {userCatalogues.map((c) => (
                                                <TableCell
                                                    key={c.id}
                                                    className="bg-muted/50"
                                                />
                                            ))}
                                        </TableRow>

                                        {/* PERMISSIONS */}
                                        {perms.map((permission) => (
                                            <TableRow key={permission.id}>
                                                <TableCell className="sticky left-0 bg-background z-10">
                                                    <div className="flex items-center gap-3">
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
                                                        />
                                                        <span>
                                                            {permission.name}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {userCatalogues.map(
                                                    (catalogue) => {
                                                        const isChecked =
                                                            selectedPermissions[
                                                                catalogue.id
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
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        );
                                                    },
                                                )}
                                            </TableRow>
                                        ))}
                                    </Fragment>
                                ),
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end items-center gap-4 mt-6">
                <div className="text-sm text-muted-foreground">
                    Tổng quyền: <strong>{permissions.length}</strong>
                </div>
                <Button size="lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu phân quyền"}
                </Button>
            </div>
        </AdminLayout>
    );
}