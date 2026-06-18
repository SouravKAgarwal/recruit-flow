"use client";

import { useTransition } from "react";
import { deleteCampaign, triggerCampaign } from "@/app/actions/campaigns";
import { useToast } from "@/components/ui/Toast";
import { Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CampaignRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleLaunch = async () => {
    toast("info", "Campaign starting...");
    try {
      await triggerCampaign(id);
      toast("success", "Campaign is now running in the background");
      router.refresh();
    } catch (err: any) {
      toast("error", "Error starting campaign", err.message);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCampaign(id);
        toast("success", "Campaign deleted");
      } catch (err: any) {
        toast("error", "Failed to delete campaign", err.message);
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      {status === "DRAFT" && (
        <Button
          onClick={handleLaunch}
          size="sm"
          className="h-7 px-3 text-[12px] rounded-md"
          disabled={isPending}
        >
          <Play size={12} fill="currentColor" className="mr-1" /> Launch
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="icon" className="h-7 w-7 rounded-md" disabled={isPending} />}>
          <Trash2 size={12} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              campaign. Your sent email history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
