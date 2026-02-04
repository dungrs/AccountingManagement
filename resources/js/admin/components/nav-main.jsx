import { ChevronRight } from "lucide-react";
import { Link } from "@inertiajs/react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/admin/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
} from "@/admin/components/ui/sidebar";

export function NavMain({ items = [] }) {
    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => {
                    const hasChildren = item.items && item.items.length > 0;

                    // 👉 CASE 1: KHÔNG có menu con
                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.url}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    // 👉 CASE 2: CÓ menu con
                    return (
                        <Collapsible
                            key={item.title}
                            defaultOpen={item.isActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((sub) => (
                                            <SidebarMenuItem key={sub.title}>
                                                <SidebarMenuSubButton asChild>
                                                    <Link href={sub.url}>
                                                        {sub.title}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}