export type Tab =
  | "general"
  | "notifications"
  | "appearance"
  | "data"
  | "security"
  | "sessions"
  | "account";

export interface Session {
  id?: string;
  token?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  expiresAt?: Date | string;
}

export type ConnectedAccount = {
  providerId: string;
  accountId: string;
  connectedAt: Date;
};

export type UserStats = {
  createdAt: Date | null;
  emailVerified: boolean;
  emailsSentThisMonth: number;
  totalRecruiters: number;
  totalCampaigns: number;
  totalTemplates: number;
};
