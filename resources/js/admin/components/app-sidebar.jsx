import * as React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/admin/components/ui/sidebar";

import { NavMain } from "@/admin/components/nav-main";
import { NavProjects } from "@/admin/components/nav-projects";
import { NavUser } from "@/admin/components/nav-user";
import { TeamSwitcher } from "@/admin/components/team-switcher";

export function AppSidebar({
    user,
    teams = [],
    navMain = [],
    projects = [],
    ...props
}) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                {teams.length > 0 && <TeamSwitcher teams={teams} />}
            </SidebarHeader>

            <SidebarContent>
                {navMain.length > 0 && <NavMain items={navMain} />}
                {projects.length > 0 && (
                    <NavProjects projects={projects} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}