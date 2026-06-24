import { Suspense } from "react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { requireAuth } from "@/lib/session";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  Send,
  Mail,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityChart, PipelineChart } from "@/components/dashboard/DashboardCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_ORDER = ["NEW", "CONTACTED", "REPLIED", "INTERVIEW", "OFFER", "REJECTED"];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon?: React.ReactNode }
> = {
  NEW:       { label: "New",       color: "#a1a1aa" },
  CONTACTED: { label: "Contacted", color: "#60a5fa" },
  REPLIED:   { label: "Replied",   color: "#34d399" },
  INTERVIEW: { label: "Interview", color: "#f59e0b" },
  OFFER:     { label: "Offer",     color: "#a78bfa" },
  REJECTED:  { label: "Rejected",  color: "#f87171" },
};

const CAMPAIGN_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:     { label: "Draft",     color: "#a1a1aa", icon: <Clock size={12} /> },
  RUNNING:   { label: "Running",   color: "#60a5fa", icon: <Activity size={12} /> },
  COMPLETED: { label: "Completed", color: "#34d399", icon: <CheckCircle2 size={12} /> },
  FAILED:    { label: "Failed",    color: "#f87171", icon: <XCircle size={12} /> },
  PAUSED:    { label: "Paused",    color: "#f59e0b", icon: <Clock size={12} /> },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5 flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 flex flex-col gap-3">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </Card>
        <Card className="p-5 flex flex-col gap-3">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </Card>
      </div>
    </div>
  );
}

// ── Dashboard Content ─────────────────────────────────────────────────────────

async function DashboardContent() {
  const [session, stats] = await Promise.all([
    requireAuth(),
    getDashboardStats(),
  ]);

  const {
    totalRecruiters,
    newRecruitersThisMonth,
    totalEmailsSent,
    emailsSentThisMonth,
    emailsLast7Days,
    activeCampaigns,
    totalCampaigns,
    recruitersByStatus,
    topCampaigns,
    emailsByDay,
  } = stats;

  // Build status map and pipeline chart data
  const statusMap = Object.fromEntries(
    recruitersByStatus.map((s) => [s.status, s._count.id])
  );
  
  const pipelineData = STATUS_ORDER.map((status) => ({
    status,
    count: statusMap[status] ?? 0,
    color: STATUS_CONFIG[status]?.color ?? "#a1a1aa",
    label: STATUS_CONFIG[status]?.label ?? status,
  }));

  const firstName = session.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s an overview of your outreach pipeline and campaign performance.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recruiters
            </CardTitle>
            <Users size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecruiters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">+{newRecruitersThisMonth}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Emails Sent
            </CardTitle>
            <Mail size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">+{emailsSentThisMonth}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
            <Send size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {totalCampaigns} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outreach Trend
            </CardTitle>
            <TrendingUp size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailsLast7Days.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Emails sent in the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Main Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Email Activity</CardTitle>
            <CardDescription>Daily emails sent over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {emailsByDay?.length > 0 ? (
              <ActivityChart data={emailsByDay} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg mt-4">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pipeline</CardTitle>
                <CardDescription>Recruiter distribution</CardDescription>
              </div>
              <Link
                href="/recruiters"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <PipelineChart data={pipelineData} />
          </CardContent>
        </Card>

      </div>

      {/* ── Bottom Row: Campaigns ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Monitor your ongoing outreach</CardDescription>
            </div>
            <Link
              href="/campaigns"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {topCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
              <Send size={24} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No campaigns found</p>
              <Link href="/campaigns" className="text-sm text-primary font-medium mt-2 hover:underline">
                Create a campaign
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="col-span-5">CAMPAIGN NAME</div>
                <div className="col-span-3">STATUS</div>
                <div className="col-span-2">PROGRESS</div>
                <div className="col-span-2 text-right">CREATED</div>
              </div>
              <div className="divide-y">
                {topCampaigns.map((c) => {
                  const cfg = CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.DRAFT;
                  const progress = c.totalEmails > 0
                    ? Math.round((c.sentEmails / c.totalEmails) * 100)
                    : 0;
                  return (
                    <div key={c.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                      <div className="col-span-5 font-medium text-sm truncate">{c.name}</div>
                      <div className="col-span-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${progress}%`, backgroundColor: cfg.color }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
