import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ToastProvider } from "@/components/ui/Toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }

  const user = {
    name: session.name,
    email: session.email,
    avatar: "/avatars/default.png", // Fallback avatar
  };

  return (
    <ToastProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 14)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8 w-full max-w-350 mx-auto">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette />
    </ToastProvider>
  );
}
