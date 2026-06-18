"use client";

import { useMemo } from "react";
import { Paperclip, Star } from "lucide-react";

interface GmailPreviewProps {
  subject: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  hasAttachment?: boolean;
}

function interpolate(text: string) {
  return text
    .replace(/\{\{name\}\}/g, "Sarah Chen")
    .replace(/\{\{company\}\}/g, "Google")
    .replace(/\{\{role\}\}/g, "SDE Recruiter")
    .replace(/\{\{resume_link\}\}/g, "[Resume Link]")
    .replace(/\{\{custom\}\}/g, "[Custom]");
}

export function GmailPreview({
  subject,
  body,
  senderName = "You",
  senderEmail = "you@example.com",
  hasAttachment = true,
}: GmailPreviewProps) {
  const renderedSubject = useMemo(
    () => interpolate(subject) || "(no subject)",
    [subject],
  );
  const renderedBody = useMemo(() => interpolate(body), [body]);
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="gmail-chrome bg-white rounded-xl border border-border/60 flex-1 flex flex-col transition-all duration-300 overflow-hidden">
      {/* Gmail top bar */}
      <div className="bg-[#f6f8fc] px-4 py-2.5 border-b border-[#e0e0e0] flex items-center gap-3 shrink-0">
        <div className="flex gap-1.5">
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
            <div
              key={c}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex-1 bg-[#e8eaed] rounded-md px-3 py-1 text-[11px] text-[#5f6368] font-medium flex items-center">
          mail.google.com
        </div>
      </div>

      {/* Email header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#e0e0e0] bg-white shrink-0">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-normal text-[#202124] break-words">
            {renderedSubject}
          </h3>
          <Star size={16} className="text-[#bdbdbd] shrink-0 ml-3" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13.5px] font-semibold text-[#202124]">
                {senderName}
              </span>
              <span className="text-[11px] text-[#5f6368]">
                &lt;{senderEmail}&gt;
              </span>
            </div>
            <div className="text-[11.5px] text-[#5f6368] mt-0.5">
              to Sarah Chen · {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 bg-white flex-1 overflow-y-auto min-h-0">
        <div className="text-[14px] leading-relaxed text-[#202124] whitespace-pre-wrap break-words font-sans">
          {renderedBody || (
            <span className="text-[#bdbdbd] italic">
              Your email body will appear here…
            </span>
          )}
        </div>
      </div>

      {/* Attachment */}
      {hasAttachment && (
        <div className="px-5 pb-4 bg-white shrink-0">
          <div className="inline-flex items-center gap-3 px-3 py-2 border border-[#e0e0e0] rounded-lg text-[#202124] hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-[#ea4335] flex items-center justify-center shrink-0">
              <span className="text-white text-[9px] font-bold tracking-wider">
                PDF
              </span>
            </div>
            <div className="pr-4">
              <p className="text-xs font-semibold leading-tight">Resume.pdf</p>
              <p className="text-[#5f6368] text-[10px] leading-tight">128 KB</p>
            </div>
            <Paperclip size={14} className="text-[#5f6368] ml-auto" />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-[#f6f8fc] border-t border-[#e0e0e0] px-5 py-2.5 flex gap-4 shrink-0">
        {["Reply", "Reply all", "Forward"].map((a) => (
          <span
            key={a}
            className="text-[#5f6368] text-xs font-medium cursor-not-allowed hover:text-[#202124] transition-colors"
          >
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}
