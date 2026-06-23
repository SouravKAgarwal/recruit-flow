import React, { useState } from "react";
import { Users, Mail, BarChart2, FileText } from "lucide-react";
import { Row, SectionHeader, Toggle, NavBtn } from "../primitives";

export function DataTab() {
  const [dataPrefs, setDataPrefs] = useState({
    analyticsOptIn: true,
    autoDeleteLogs: false,
  });

  return (
    <div>
      <SectionHeader>Privacy</SectionHeader>
      <Row
        label="Analytics opt-in"
        hint="Share anonymous usage data to help us improve"
      >
        <Toggle
          checked={dataPrefs.analyticsOptIn}
          onChange={(v) => setDataPrefs((p) => ({ ...p, analyticsOptIn: v }))}
        />
      </Row>
      <Row
        label="Auto-delete old logs"
        hint="Purge email logs older than 90 days"
      >
        <Toggle
          checked={dataPrefs.autoDeleteLogs}
          onChange={(v) => setDataPrefs((p) => ({ ...p, autoDeleteLogs: v }))}
        />
      </Row>
      <SectionHeader>Export</SectionHeader>
      <NavBtn
        label="Export recruiters (CSV)"
        icon={<Users size={15} />}
        href="/recruiters?export=csv"
      />
      <NavBtn
        label="Export email history (CSV)"
        icon={<Mail size={15} />}
        href="/history?export=csv"
      />
      <NavBtn
        label="Export campaigns (CSV)"
        icon={<BarChart2 size={15} />}
        href="/campaigns?export=csv"
      />
      <SectionHeader>Quick links</SectionHeader>
      <NavBtn label="Manage SMTP accounts" icon={<Mail size={15} />} href="/smtp" />
      <NavBtn label="Manage resume files" icon={<FileText size={15} />} href="/resumes" />
      <NavBtn label="Manage email templates" icon={<FileText size={15} />} href="/templates" />
    </div>
  );
}
