"use client";

import React, { useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser } from "@/app/actions/auth";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

export function UserModal({ 
  open, 
  onClose, 
  user 
}: { 
  open: boolean; 
  onClose: () => void;
  user: { name: string; email: string; avatar?: string } 
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateUser(undefined, formData);
      if (res?.error) {
        toast("error", "Error", res.error);
      } else if (res?.errors) {
        const firstError = Object.values(res.errors)[0]?.[0];
        if (firstError) toast("error", "Error", firstError);
      } else {
        toast("success", "Success", "Profile updated successfully!");
        onClose();
        // optionally refresh the page to update header session
        window.location.reload();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Update Profile">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={user.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input id="avatar" name="avatar" type="url" defaultValue={user.avatar || ""} placeholder="https://example.com/avatar.png" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New Password</Label>
          <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
