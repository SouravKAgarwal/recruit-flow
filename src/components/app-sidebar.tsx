"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  Send,
  KanbanSquare,
  Settings,
  Hexagon,
} from "lucide-react";
import Link from "next/link";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: any; /* eslint-disable-line @typescript-eslint/no-explicit-any */
}) {
  const pathname = usePathname();

  const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboard />,
      isActive: pathname === "/",
    },
    {
      title: "Recruiters",
      url: "/recruiters",
      icon: <Users />,
      isActive: pathname.startsWith("/recruiters"),
    },
    {
      title: "Templates",
      url: "/templates",
      icon: <FileText />,
      isActive: pathname.startsWith("/templates"),
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: <Send />,
      isActive: pathname.startsWith("/campaigns"),
    },
    {
      title: "Resumes",
      url: "/resumes",
      icon: <FileText />,
      isActive: pathname.startsWith("/resumes"),
    },
    {
      title: "Email History",
      url: "/history",
      icon: <Mail />,
      isActive: pathname.startsWith("/history"),
    },
    {
      title: "CRM Pipeline",
      url: "/crm",
      icon: <KanbanSquare />,
      isActive: pathname.startsWith("/crm"),
    },
    {
      title: "SMTP Settings",
      url: "/smtp",
      icon: <Settings />,
      isActive: pathname.startsWith("/smtp"),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <Hexagon
                className="size-5!"
                style={{ color: "var(--color-primary)" }}
              />
              <span className="text-base font-semibold">RecruitFlow AI</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
