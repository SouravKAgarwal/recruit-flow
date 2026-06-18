"use server";

import { requireAuth } from "@/lib/session";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "__NO_API_KEY__";
  }
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`AI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function generateEmailDraft(recruiterName: string, company: string, role: string) {
  await requireAuth();
  return callAI(
    "You are an expert cold email writer for job seekers. Write concise, personalized, professional cold emails. Output only the email body, no subject line.",
    `Write a cold email to ${recruiterName} at ${company} for the role of ${role}. Keep it under 150 words, friendly and professional.`
  );
}

export async function suggestSubjectLines(emailBody: string) {
  await requireAuth();
  return callAI(
    "You are an email subject line expert. Return exactly 3 subject line options, one per line, no numbering.",
    `Suggest 3 compelling subject lines for this cold email:\n\n${emailBody}`
  );
}

export async function improveEmailTone(emailBody: string) {
  await requireAuth();
  return callAI(
    "You are an email tone optimizer. Improve the tone to be warmer, more confident, and professional. Return only the improved email body.",
    emailBody
  );
}

export async function detectSpamScore(emailBody: string) {
  await requireAuth();
  return callAI(
    "You are an email deliverability expert. Rate this email's spam score from 1-10 (1=clean, 10=spammy) and list the top issues in 2-3 bullet points. Format: Score: X/10\n- issue 1\n- issue 2",
    emailBody
  );
}
