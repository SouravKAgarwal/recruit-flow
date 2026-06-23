import React, { useState, useRef, useTransition } from "react";
import { Loader2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/Toast";
import { authClient } from "@/lib/auth-client";
import { uploadImageAction } from "@/app/actions/upload";
import { updateUser } from "@/app/actions/auth";
import { Row } from "../primitives";

export function GeneralTab({
  user,
  onClose,
}: {
  user: { name: string; email: string; avatar?: string };
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.url) {
        setAvatarPreview(res.url);
        await authClient.updateUser({ image: res.url });
        toast("success", "Uploaded", "Avatar updated.");
        window.location.reload();
      } else throw new Error(res.error || "Upload failed");
    } catch (err: any) {
      toast("error", "Upload Failed", err.message);
      setAvatarPreview(user.avatar || "");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateUser(undefined, fd);
      if (res?.error) {
        toast("error", "Error", res.error);
      } else if (res?.errors) {
        const f = Object.values(res.errors)[0]?.[0];
        if (f) toast("error", "Error", f);
      } else {
        const newName = fd.get("name") as string;
        if (newName) await authClient.updateUser({ name: newName });
        toast("success", "Saved", "Profile updated.");
        onClose();
        window.location.reload();
      }
    });
  };

  return (
    <form id="general-form" onSubmit={handleSubmit}>
      <Row label="Profile picture">
        <div
          className="relative group cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{ opacity: isUploading ? 0.7 : 1 }}
        >
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage
              src={avatarPreview}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-foreground text-sm">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploading ? (
              <Loader2 size={12} className="animate-spin text-white" />
            ) : (
              <Camera size={12} className="text-white" />
            )}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </Row>
      <Row label="Full name">
        <input
          name="name"
          defaultValue={user.name || ""}
          required
          className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-52 font-[inherit]"
        />
      </Row>
      <Row label="Email address" hint="Cannot be changed">
        <input
          name="email"
          value={user.email || ""}
          readOnly
          className="text-sm text-muted-foreground text-right bg-transparent border-none outline-none w-52 font-[inherit] opacity-70"
        />
      </Row>
      <div className="px-7 py-3 flex justify-end">
        <button
          type="submit"
          form="general-form"
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 cursor-pointer transition-opacity border border-border bg-muted text-foreground disabled:opacity-70"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
