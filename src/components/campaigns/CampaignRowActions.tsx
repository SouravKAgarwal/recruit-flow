"use client";

import { useTransition } from "react";
import { deleteCampaign, triggerCampaign } from "@/app/actions/campaigns";
import { useToast } from "@/components/ui/Toast";
import { Trash2, Play, Loader2 } from "lucide-react";
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
  const [isLaunching, startLaunchTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleLaunch = () => {
    startLaunchTransition(async () => {
      toast("info", "Campaign starting...");
      try {
        await triggerCampaign(id);
        toast("success", "Campaign is now running in the background");
        router.refresh();
      } catch (err) {
        toast("error", "Error starting campaign", (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteCampaign(id);
        toast("success", "Campaign deleted");
      } catch (err) {
        toast("error", "Failed to delete campaign", (err instanceof Error ? err.message : String(err)));
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
          disabled={isLaunching}
        >
          {isLaunching ? (
            <div className="flex items-center gap-1">
              <Loader2 className="animate-spin" /> Launching
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Play className="mr-1" /> Launch
            </div>
          )}
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={isDeleting || isLaunching}
            />
          }
        >
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
              {isDeleting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="animate-spin" /> Deleting
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
