"use client";

import { useState, useActionState, useEffect } from "react";
import {
  createCampaign,
  type CampaignActionState,
} from "@/app/actions/campaigns";
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

  const { toast } = useToast();
  const router = useRouter();

  const [createState, createAction, isCreating] = useActionState<
    CampaignActionState,
    FormData
  >(createCampaign, undefined);

  useEffect(() => {
    if (createState?.success) {
      toast(
        "success",
        "Campaign created",
        "Configure and launch from the campaign table",
      );
      setTimeout(() => {
        setShowNew(false);
        router.refresh();
      }, 0);
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
        <Plus size={14} className="sm:mr-2" />{" "}
        <span className="hidden sm:inline">New Campaign</span>
      </Button>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Create New Campaign"
        maxWidth={480}
      >
        <form
          action={createAction}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            paddingTop: 8,
          }}
        >
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
              <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
                {createState.errors.name[0]}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label htmlFor="smtpAccountId">Sender Account (SMTP)</Label>
            <input type="hidden" name="smtpAccountId" value={smtpId} />
            <Select
              value={smtpId}
              onValueChange={(val) => setSmtpId(val as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {smtpAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} ({a.email})
                  </SelectItem>
                ))}
                {smtpAccounts.length === 0 && (
                  <SelectItem disabled value="none">
                    No SMTP accounts found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {createState?.errors?.smtpAccountId && (
              <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
                {createState.errors.smtpAccountId[0]}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label htmlFor="templateId">Email Template</Label>
            <input type="hidden" name="templateId" value={templateId} />
            <Select
              value={templateId}
              onValueChange={(val) => setTemplateId(val as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                {templates.length === 0 && (
                  <SelectItem disabled value="none">
                    No templates found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {createState?.errors?.templateId && (
              <span style={{ color: "var(--color-danger)", fontSize: 12 }}>
                {createState.errors.templateId[0]}
              </span>
            )}
          </div>

          <div className="flex w-full items-center gap-4">
            <Button type="submit" disabled={isCreating} className="w-1/2">
              {isCreating ? (
                <div className="flex items-center gap-1">
                  <Loader2 size={16} className="animate-spin mr-2" /> Creating…
                </div>
              ) : (
                "Create Campaign"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNew(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
