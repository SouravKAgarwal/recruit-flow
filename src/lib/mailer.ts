import nodemailer from "nodemailer";
import path from "path";
import { promises as fs } from "fs";
import realPrisma from "./prisma";

function replaceVariables(text: string, variables: Record<string, string>) {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replaceAll(
      placeholder,
      value !== undefined && value !== null ? String(value) : "",
    );
  }
  return result;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runModernCampaign(campaignId: string) {
  let transporter: nodemailer.Transporter | null = null;
  try {
    const campaign = await realPrisma.campaign.findUnique({
      where: { id: campaignId },
      include: { smtpAccount: true, template: true },
    });

    if (!campaign) {
      console.error(`Campaign ${campaignId} not found`);
      return;
    }

    if (!campaign.smtpAccount || !campaign.template) {
      console.error(
        `Campaign ${campaignId} is missing SMTP account or template`,
      );
      await realPrisma.campaign.update({
        where: { id: campaignId },
        data: { status: "FAILED" },
      });
      return;
    }

    await realPrisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const smtp = campaign.smtpAccount;
    const template = campaign.template;

    // Initialize SMTP Transport
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.username,
        pass: smtp.encryptedPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    // Fetch recruiters
    const recruiters = await realPrisma.recruiter.findMany({
      where: { userId: campaign.userId, status: "NEW" },
    });

    await realPrisma.campaign.update({
      where: { id: campaignId },
      data: { totalEmails: recruiters.length },
    });

    // Fetch active resume
    const activeResume = await realPrisma.resume.findFirst({
      where: { userId: campaign.userId, isActive: true },
    });

    const attachments = [];
    let attachedResumeId: string | null = null;

    if (activeResume) {
      const resumePath = path.join(
        process.cwd(),
        "uploads",
        "resumes",
        activeResume.filename,
      );
      try {
        await fs.access(resumePath);
        attachments.push({
          filename: activeResume.originalName || "Resume.pdf",
          path: resumePath,
        });
        attachedResumeId = activeResume.id;
      } catch {
        console.error(`Resume file not found at ${resumePath}`);
      }
    }

    let sent = 0;
    let failed = 0;

    for (const recruiter of recruiters) {
      const currentState = await realPrisma.campaign.findUnique({
        where: { id: campaignId },
      });
      if (
        currentState?.status === "CANCELLED" ||
        currentState?.status === "PAUSED"
      ) {
        break;
      }

      if (!recruiter.email) {
        failed++;
        await realPrisma.campaign.update({
          where: { id: campaignId },
          data: { failedEmails: failed },
        });
        continue;
      }

      const vars: Record<string, string> = {
        "{name}": recruiter.name,
        "{company}": recruiter.company,
        "{role}": recruiter.role,
        "{custom}": "",
        name: recruiter.name,
        company: recruiter.company,
        role: recruiter.role,
      };

      const subject = replaceVariables(template.subject, vars);
      const body = replaceVariables(template.body, vars);

      try {
        await transporter.sendMail({
          from: `"${smtp.senderName}" <${smtp.email}>`,
          to: recruiter.email,
          subject: subject,
          text: body,
          attachments: attachments,
        });

        sent++;
        await realPrisma.campaign.update({
          where: { id: campaignId },
          data: { sentEmails: sent },
        });

        await realPrisma.recruiter.update({
          where: { id: recruiter.id },
          data: { status: "CONTACTED", lastContactedAt: new Date() },
        });

        await realPrisma.emailLog.create({
          data: {
            userId: campaign.userId,
            recruiterId: recruiter.id,
            campaignId: campaign.id,
            smtpAccountId: smtp.id,
            templateId: template.id,
            resumeId: attachedResumeId,
            toEmail: recruiter.email,
            subject: subject,
            status: "SENT",
          },
        });

        await realPrisma.smtpAccount.update({
          where: { id: smtp.id },
          data: { emailsSent: { increment: 1 }, lastUsedAt: new Date() },
        });
      } catch (err) {
        failed++;
        await realPrisma.campaign.update({
          where: { id: campaignId },
          data: { failedEmails: failed },
        });

        await realPrisma.emailLog.create({
          data: {
            userId: campaign.userId,
            recruiterId: recruiter.id,
            campaignId: campaign.id,
            smtpAccountId: smtp.id,
            templateId: template.id,
            resumeId: attachedResumeId,
            toEmail: recruiter.email,
            subject: subject,
            status: "FAILED",
            errorMessage: err instanceof Error ? err.message : String(err),
          },
        });
      }

      await sleep(campaign.delayMs || 1500);
    }

    const finalState = await realPrisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (finalState?.status === "RUNNING") {
      await realPrisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }
  } catch (error) {
    console.error(`Error executing campaign ${campaignId}:`, error);
    try {
      await realPrisma.campaign.update({
        where: { id: campaignId },
        data: { status: "FAILED" },
      });
    } catch (dbErr) {
      console.error("Failed to mark campaign as failed:", dbErr);
    }
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
}
