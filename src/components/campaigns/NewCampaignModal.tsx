"use client";

import { useState, useActionState, useEffect } from "react";
import { createCampaign, type CampaignActionState } from "@/app/actions/campaigns";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewCampaignModal({
  smtpAccounts,
  templates,
}: {
  smtpAccounts: { id: string; label: string; email: string }[];
  templates: { id: string; name: string }[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [smtpId, setSmtpId] = useState(smtpAccounts[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [campaignName, setCampaignName] = useState("My Campaign");
  const [delayMs, setDelayMs] = useState(1500);

  const { toast } = useToast();
  const router = useRouter();

  const [createState, createAction, isCreating] = useActionState<CampaignActionState, FormData>(createCampaign, undefined);

  useEffect(() => {
    if (createState?.success) {
      toast("success", "Campaign created", "Configure and launch from the campaign table");
      setShowNew(false);
      router.refresh();
    } else if (createState?.error) {
      toast("error", "Error creating campaign", createState.error);
    }
  }, [createState, toast, router]);

  return (
    <>
      <Button
        onClick={() => setShowNew(true)}
        size="sm"
        className="h-8 px-2 sm:px-4 rounded-md font-semibold"
        title="New Campaign"
      >
        <Plus size={14} className="sm:mr-2" /> <span className="hidden sm:inline">New Campaign</span>
      </Button>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Create New Campaign" maxWidth={480}>
        <form action={createAction} style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              name="name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Q3 Outreach"
              aria-invalid={!!createState?.errors?.name}
            />
            {createState?.errors?.name && (
              <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{createState.errors.name[0]}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label htmlFor="smtpAccountId">Sender Account (SMTP)</Label>
            <input type="hidden" name="smtpAccountId" value={smtpId} />
            <Select value={smtpId} onValueChange={(val) => setSmtpId(val as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account">
                  {(val: any) => {
                    const found = smtpAccounts.find(a => a.id === val);
                    return found ? `${found.label} (${found.email})` : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {smtpAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} ({a.email})
                  </SelectItem>
                ))}
                {smtpAccounts.length === 0 && <SelectItem disabled value="none">No SMTP accounts found</SelectItem>}
              </SelectContent>
            </Select>
            {createState?.errors?.smtpAccountId && (
              <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{createState.errors.smtpAccountId[0]}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label htmlFor="templateId">Email Template</Label>
            <input type="hidden" name="templateId" value={templateId} />
            <Select value={templateId} onValueChange={(val) => setTemplateId(val as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template">
                  {(val: any) => {
                    const found = templates.find(t => t.id === val);
                    return found ? found.name : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                {templates.length === 0 && <SelectItem disabled value="none">No templates found</SelectItem>}
              </SelectContent>
            </Select>
            {createState?.errors?.templateId && (
              <span style={{ color: "var(--color-danger)", fontSize: 12 }}>{createState.errors.templateId[0]}</span>
            )}
          </div>

          <div
            style={{
              background: "var(--color-muted)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Label htmlFor="delayMs">Sending Delay</Label>
              <span style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: 13 }}>{delayMs / 1000}s</span>
            </div>
            <input
              id="delayMs"
              name="delayMs"
              type="range"
              min={500}
              max={10000}
              step={500}
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-primary)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--color-text-dim)",
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              <span>0.5s (Faster)</span>
              <span>10s (Safer)</span>
            </div>
            {createState?.errors?.delayMs && (
              <span style={{ color: "var(--color-danger)", fontSize: 12, display: "block", marginTop: 4 }}>{createState.errors.delayMs[0]}</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8, borderTop: "1px solid var(--color-border)", paddingTop: 20 }}>
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating…</> : "Create Campaign"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowNew(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
