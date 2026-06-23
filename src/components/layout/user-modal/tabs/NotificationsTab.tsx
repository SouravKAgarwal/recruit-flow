import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Row, Toggle } from "../primitives";

export function NotificationsTab() {
  const { toast } = useToast();
  const [notif, setNotif] = useState({
    campaignComplete: true,
    emailFailed: true,
    newReply: true,
    weeklyDigest: false,
    productUpdates: false,
  });

  return (
    <div>
      <Row label="Campaign completed" hint="When all emails have been sent">
        <Toggle
          checked={notif.campaignComplete}
          onChange={(v) => setNotif((p) => ({ ...p, campaignComplete: v }))}
        />
      </Row>
      <Row label="Email failed" hint="When an email bounces or fails">
        <Toggle
          checked={notif.emailFailed}
          onChange={(v) => setNotif((p) => ({ ...p, emailFailed: v }))}
        />
      </Row>
      <Row label="New reply" hint="When a candidate replies">
        <Toggle
          checked={notif.newReply}
          onChange={(v) => setNotif((p) => ({ ...p, newReply: v }))}
        />
      </Row>
      <Row label="Weekly digest" hint="Summary of your recruiting activity">
        <Toggle
          checked={notif.weeklyDigest}
          onChange={(v) => setNotif((p) => ({ ...p, weeklyDigest: v }))}
        />
      </Row>
      <Row label="Product updates" hint="News and feature announcements">
        <Toggle
          checked={notif.productUpdates}
          onChange={() =>
            toast("info", "Coming soon", "This preference is coming soon.")
          }
        />
      </Row>
    </div>
  );
}
