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
import { requireAuth } from "@/lib/session";
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
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="ml-auto size-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

async function DynamicNavUser() {
  const session = await requireAuth();

  const user = {
    name: session.name,
    email: session.email,
    avatar: session.image,
  };

  return <NavUser user={user} />;
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & {}) {
  const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboard />,
    },
    {
      title: "Recruiters",
      url: "/recruiters",
      icon: <Users />,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: <FileText />,
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: <Send />,
    },
    {
      title: "Resumes",
      url: "/resumes",
      icon: <FileText />,
    },
    {
      title: "Email History",
      url: "/history",
      icon: <Mail />,
    },
    {
      title: "CRM Pipeline",
      url: "/crm",
      icon: <KanbanSquare />,
    },
    {
      title: "SMTP Settings",
      url: "/smtp",
      icon: <Settings />,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="RecruitsFlow"
              render={<Link href="/" />}
            >
              <Hexagon className="size-5!" />
              <span className="font-semibold text-base">RecruitsFlow</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<NavUserSkeleton />}>
          <DynamicNavUser />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
