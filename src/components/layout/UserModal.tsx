"use client";

import React, { useTransition, useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUser } from "@/app/actions/auth";
import { uploadImageAction } from "@/app/actions/upload";
import { useToast } from "@/components/ui/Toast";
import { Loader2, ShieldCheck, UserCircle, Camera } from "lucide-react";
import { authClient } from "@/lib/auth-client";

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
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      // Upload to our secure backend
      const res = await uploadImageAction(formData);

      if (res.url) {
        setAvatarPreview(res.url);
        // Force Better Auth to update its session cache
        await authClient.updateUser({ image: res.url });
        
        toast("success", "Uploaded", "Image uploaded successfully.");
        // Refresh to immediately update the global session/navbar avatar
        window.location.reload();
      } else {
        throw new Error(res.error || "Failed to upload image");
      }
    } catch (err: any) {
      toast("error", "Upload Failed", err.message);
      setAvatarPreview(user.avatar || ""); // Revert preview on failure
    } finally {
      setIsUploading(false);
      // Reset input value to allow re-selection of the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
        // Force Better Auth to update its session cache with the new name
        const name = formData.get("name") as string;
        if (name) {
          await authClient.updateUser({ name });
        }
        
        toast("success", "Success", "Profile updated successfully!");
        onClose();
        window.location.reload();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Account Settings">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
        
        {/* Profile Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b pb-2 text-sm font-semibold text-[var(--color-text)]">
            <UserCircle size={16} className="text-primary" />
            Profile Details
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar Upload */}
            <div className="flex flex-col gap-2 items-center sm:items-start shrink-0">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Picture</Label>
              <div 
                className={`relative inline-block cursor-pointer group ${isUploading ? 'pointer-events-none opacity-80' : ''}`} 
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="size-20 border-2 border-border transition-opacity group-hover:opacity-80 shadow-sm">
                  <AvatarImage src={avatarPreview} alt={user.name} className="object-cover" />
                  <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-sm border-2 border-background">
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <input type="hidden" name="avatar" value={avatarPreview} />
              <p className="text-[11px] text-muted-foreground text-center sm:text-left">Click to change picture</p>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <Input id="name" name="name" defaultValue={user.name} required className="bg-background" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required className="bg-background" />
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 border-b pb-2 text-sm font-semibold text-[var(--color-text)]">
            <ShieldCheck size={16} className="text-primary" />
            Security & Authentication
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</Label>
            <Input id="password" name="password" type="password" placeholder="Leave blank to keep current password" className="bg-background" />
            <p className="text-[11px] text-muted-foreground">Must be at least 8 characters long.</p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button type="button" className="btn btn-ghost px-4 h-9" onClick={onClose} disabled={isPending || isUploading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary px-5 h-9" disabled={isPending || isUploading}>
            {(isPending || isUploading) && <Loader2 size={14} className="animate-spin mr-2" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
