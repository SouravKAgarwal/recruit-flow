import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "./db";
import realPrisma from "./prisma";

export interface SmtpConfig {
  server: string;
  port: number;
  email: string;
  password: string;
}

function parseTemplate(templateText: string) {
  const lines = templateText.split("\n");
  let subject = "";
  const bodyLines: string[] = [];
  let inBody = false;

  for (const line of lines) {
    if (line.trim().startsWith("Subject:")) {
      subject = line.replace("Subject:", "").trim();
    } else if (subject && !inBody) {
      inBody = true;
      // Skip the blank line right after Subject if there is one
      if (line.trim() !== "") {
        bodyLines.push(line);
      }
    } else {
      bodyLines.push(line);
    }
  }

  return {
    subject,
    body: bodyLines.join("\n").trim(),
  };
}

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

export async function runCampaign(jobId: string, smtp: SmtpConfig) {
  let transporter: nodemailer.Transporter | null = null;
  let updatedFilename = "";

  try {
    // 1. Fetch Job from DB
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      console.error(`Job ${jobId} not found in DB`);
      return;
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "SENDING" },
    });

    await prisma.log.create({
      data: {
        jobId,
        level: "INFO",
        message: `Campaign sending started. Initializing SMTP transport...`,
      },
    });

    // 2. Parse Template
    const { subject: subjectTemplate, body: bodyTemplate } = parseTemplate(
      job.templateText,
    );
    if (!subjectTemplate) {
      throw new Error(
        "No 'Subject:' prefix found in template. Please specify a subject line like: Subject: Your Subject Here",
      );
    }

    // 3. Initialize SMTP Transport
    transporter = nodemailer.createTransport({
      host: smtp.server,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.email,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify transporter connection
    await transporter.verify();

    // 4. Load Recipients File
    const recipientsPath = path.join(
      process.cwd(),
      "uploads",
      "recipients",
      job.recipientsFilename,
    );
    const fileBuffer = await fs.readFile(recipientsPath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any /* eslint-disable-line @typescript-eslint/no-explicit-any */[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    await prisma.job.update({
      where: { id: jobId },
      data: { total: rawData.length },
    });

    await prisma.log.create({
      data: {
        jobId,
        level: "INFO",
        message: `Loaded ${rawData.length} recipients. Processing emails...`,
      },
    });

    // Prepare attachment paths if any
    const attachments: any /* eslint-disable-line @typescript-eslint/no-explicit-any */[] = [];
    if (job.resumeFilename) {
      const resumePath = path.join(
        process.cwd(),
        "uploads",
        "resumes",
        job.resumeFilename,
      );
      try {
        await fs.access(resumePath);
        attachments.push({
          filename:
            job.resumeFilename.split("-").slice(1).join("-") || "Resume.pdf", // Remove timestamp prefix for the attachment name
          path: resumePath,
        });
      } catch (err) {
        await prisma.log.create({
          data: {
            jobId,
            level: "WARNING",
            message: `Resume attachment file not found at ${resumePath}. Sending emails without attachment.`,
          },
        });
      }
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // 5. Send Loop
    for (let idx = 0; idx < rawData.length; idx++) {
      // Check cancellation state at start of loop iteration
      const currentJobState = await prisma.job.findUnique({
        where: { id: jobId },
      });
      if (currentJobState?.status === "CANCELLED") {
        await prisma.log.create({
          data: {
            jobId,
            level: "WARNING",
            message: `Campaign sending cancelled by user at row ${idx + 1}.`,
          },
        });
        break;
      }

      const row = rawData[idx];
      const toEmail = row["email"]?.trim();
      const sentFlag = String(row["sent"] || "")
        .trim()
        .toLowerCase();

      // Skip if already sent
      if (sentFlag === "yes" || sentFlag === "true") {
        skipped++;
        await prisma.log.create({
          data: {
            jobId,
            level: "INFO",
            message: `⏭️ Row ${idx + 1}: Skipped ${toEmail || "N/A"} (already sent)`,
          },
        });
        await prisma.job.update({
          where: { id: jobId },
          data: { skipped },
        });
        continue;
      }

      if (!toEmail) {
        failed++;
        await prisma.log.create({
          data: {
            jobId,
            level: "ERROR",
            message: `❌ Row ${idx + 1}: Missing email address`,
          },
        });
        await prisma.job.update({
          where: { id: jobId },
          data: { failed },
        });
        continue;
      }

      // Update current status
      await prisma.job.update({
        where: { id: jobId },
        data: { currentEmail: toEmail },
      });

      // Prepare replacement variables
      const vars: Record<string, string> = {
        company_name: row["company_name"] || "",
        recruiter_name: row["recruiter_name"] || "",
        role: row["role"] || "",
        sender_name: row["sender_name"] || "",
        sender_phone: row["sender_phone"] || "",
        sender_email: row["sender_email"] || smtp.email,
      };

      const subject = replaceVariables(subjectTemplate, vars);
      const body = replaceVariables(bodyTemplate, vars);

      try {
        await transporter.sendMail({
          from: smtp.email,
          to: toEmail,
          subject: subject,
          text: body, // plain text
          attachments: attachments,
        });

        // Success
        sent++;
        row["sent"] = "Yes"; // Mark row as sent

        await prisma.log.create({
          data: {
            jobId,
            level: "SUCCESS",
            message: `✅ Row ${idx + 1}: Sent successfully to ${row["recruiter_name"] || "Recruiter"} (${toEmail})`,
          },
        });

        await prisma.job.update({
          where: { id: jobId },
          data: { sent },
        });
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        // Failed
        failed++;
        await prisma.log.create({
          data: {
            jobId,
            level: "ERROR",
            message: `❌ Row ${idx + 1}: Failed to send to ${toEmail}: ${err.message || "SMTP error"}`,
          },
        });

        await prisma.job.update({
          where: { id: jobId },
          data: { failed },
        });
      }

      // Sleep 1.5 seconds between emails to control rate limits
      await sleep(1500);
    }

    // 6. Write updated spreadsheet file
    const ext = path.extname(job.recipientsFilename);
    updatedFilename = `${jobId}_updated${ext}`;
    const updatedPath = path.join(
      process.cwd(),
      "uploads",
      "recipients",
      updatedFilename,
    );

    // Convert back to sheet and write (use fs.writeFile to avoid Windows path issues)
    const newWorksheet = XLSX.utils.json_to_sheet(rawData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
    const outBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "xlsx" });
    await fs.writeFile(updatedPath, outBuffer);

    // 7. Update Job completion state
    const jobState = await prisma.job.findUnique({ where: { id: jobId } });
    const finalStatus =
      jobState?.status === "CANCELLED" ? "CANCELLED" : "COMPLETED";

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        currentEmail: "",
      },
    });

    await prisma.log.create({
      data: {
        jobId,
        level: "INFO",
        message: `Campaign finished with status: ${finalStatus}. Total: ${rawData.length}, Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}.`,
      },
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error(`Error executing job ${jobId}:`, error);
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "FAILED", currentEmail: "" },
      });
      await prisma.log.create({
        data: {
          jobId,
          level: "ERROR",
          message: `Fatal campaign crash: ${error.message || "Unknown error"}`,
        },
      });
    } catch (dbErr) {
      console.error("Failed to log job crash to db:", dbErr);
    }
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
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
      console.error(`Campaign ${campaignId} is missing SMTP account or template`);
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

    const attachments: any /* eslint-disable-line @typescript-eslint/no-explicit-any */[] = [];
    let attachedResumeId: string | null = null;
    
    if (activeResume) {
      const resumePath = path.join(process.cwd(), "uploads", "resumes", activeResume.filename);
      try {
        await fs.access(resumePath);
        attachments.push({
          filename: activeResume.originalName || "Resume.pdf",
          path: resumePath,
        });
        attachedResumeId = activeResume.id;
      } catch (err) {
        console.error(`Resume file not found at ${resumePath}`);
      }
    }

    let sent = 0;
    let failed = 0;

    for (const recruiter of recruiters) {
      // Check cancellation state
      const currentState = await realPrisma.campaign.findUnique({
        where: { id: campaignId },
      });
      if (currentState?.status === "CANCELLED" || currentState?.status === "PAUSED") {
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

      // We support both {{name}} and {name} formats by supplying both
      const vars: Record<string, string> = {
        "{name}": recruiter.name,
        "{company}": recruiter.company,
        "{role}": recruiter.role,
        "{custom}": "",
        "name": recruiter.name,
        "company": recruiter.company,
        "role": recruiter.role,
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
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
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
            errorMessage: err.message || "SMTP error",
          },
        });
      }

      await sleep(campaign.delayMs || 1500);
    }

    const finalState = await realPrisma.campaign.findUnique({ where: { id: campaignId } });
    if (finalState?.status === "RUNNING") {
      await realPrisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
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
