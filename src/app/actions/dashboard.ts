"use server";

import { requireAuth } from "@/lib/session";
import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getDashboardStats() {
  const { userId } = await requireAuth();
  return getCachedDashboardStats(userId);
}

async function getCachedDashboardStats(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("dashboard", userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalRecruiters,
    newRecruitersThisMonth,
    totalEmailsSent,
    emailsSentThisMonth,
    emailsLast7Days,
    activeCampaigns,
    totalCampaigns,
    recruitersByStatus,
    recentActivity,
    topCampaigns,
    recentLogsForChart,
  ] = await Promise.all([
    prisma.recruiter.count({ where: { userId } }),
    prisma.recruiter.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.emailLog.count({ where: { userId } }),
    prisma.emailLog.count({ where: { userId, sentAt: { gte: startOfMonth } } }),
    prisma.emailLog.count({ where: { userId, sentAt: { gte: last7Days } } }),
    prisma.campaign.count({ where: { userId, status: "RUNNING" } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.recruiter.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.emailLog.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: 8,
      include: { recruiter: true, template: true },
    }),
    prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        status: true,
        sentEmails: true,
        totalEmails: true,
        failedEmails: true,
        createdAt: true,
      },
    }),
    prisma.emailLog.findMany({
      where: { userId, sentAt: { gte: fourteenDaysAgo } },
      select: { sentAt: true },
    }),
  ]);

  // Build the 14-day time series map
  const emailsByDayMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    emailsByDayMap[dateStr] = 0;
  }

  // Populate map with actual log counts
  for (const log of recentLogsForChart) {
    const dateStr = log.sentAt.toISOString().split("T")[0];
    if (emailsByDayMap[dateStr] !== undefined) {
      emailsByDayMap[dateStr]++;
    }
  }

  const emailsByDay = Object.entries(emailsByDayMap).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    totalRecruiters,
    newRecruitersThisMonth,
    totalEmailsSent,
    emailsSentThisMonth,
    emailsLast7Days,
    activeCampaigns,
    totalCampaigns,
    recruitersByStatus,
    recentActivity,
    topCampaigns,
    emailsByDay,
  };
}
