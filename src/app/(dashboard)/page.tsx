import { getAnalytics } from "@/app/actions/campaigns";
import { getRecruiters } from "@/app/actions/recruiters";
import { RecruitersDataTable } from "@/components/recruiters/RecruitersDataTable";
import { SelectionProvider } from "@/components/recruiters/SelectionContext";
import { Send, MailOpen, Reply, Users, TrendingUp } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, recruiters] = await Promise.all([
    getAnalytics(),
    getRecruiters(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <div className="glass" style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: "var(--color-text-muted)",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Total Sent
            </p>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--color-primary-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
              }}
            >
              <Send size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
            {stats.totalSent}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              fontSize: 12,
              color: "var(--color-text-dim)",
            }}
          >
            <TrendingUp size={12} style={{ color: "var(--color-success)" }} />
            <span>All time emails delivered</span>
          </div>
        </div>

        <div className="glass" style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: "var(--color-text-muted)",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Open Rate
            </p>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--color-success-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-success)",
              }}
            >
              <MailOpen size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
            {stats.openRate}%
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              fontSize: 12,
              color: "var(--color-text-dim)",
            }}
          >
            <span>Unique opens by candidates</span>
          </div>
        </div>

        <div className="glass" style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: "var(--color-text-muted)",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Reply Rate
            </p>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(167, 139, 250, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a78bfa",
              }}
            >
              <Reply size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
            {stats.replyRate}%
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              fontSize: 12,
              color: "var(--color-text-dim)",
            }}
          >
            <span>Candidate responses received</span>
          </div>
        </div>

        <div className="glass" style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: "var(--color-text-muted)",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Pipeline
            </p>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--color-warning-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-warning)",
              }}
            >
              <Users size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
            {stats.totalRecruiters}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              fontSize: 12,
              color: "var(--color-text-dim)",
            }}
          >
            <span>Recruiters active in CRM</span>
          </div>
        </div>
      </div>

      {/* Recent Pipeline */}
      <div
        className="glass"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Pipeline</h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginTop: 2,
            }}
          >
            Your latest tracked recruiters and their current status
          </p>
        </div>
        <div style={{ padding: 24 }}>
          <SelectionProvider>
            <RecruitersDataTable
              recruiters={
                recruiters.slice(
                  0,
                  5,
                ) as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
              }
            />
          </SelectionProvider>
        </div>
      </div>
    </div>
  );
}
