// components/viewProject/ShareDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "components/ui/dialog";
import CustomButton from "components/shared/CustomButton";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface ShareDialogProps {
  triggerLabel: string;
  badgeLabel: string;
  description: string;
  fields: Array<{ label: string; value: string }>;
  copyPayload: string;
  footerText?: string;               // ← new
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  triggerLabel,
  badgeLabel,
  description,
  fields,
  copyPayload,
  footerText,                        // ← new
}) => {
  const copyLink = () => {
    if (!navigator.clipboard) {
      return toast.error("Clipboard unsupported");
    }
    navigator.clipboard.writeText(copyPayload).then(
      () => toast.success("Invite copied"),
      () => toast.error("Copy failed")
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <CustomButton
          icon={<Copy />}
          className="bg-custom-teal hover:bg-custom-dark-blue-1"
        >
          {triggerLabel}
        </CustomButton>
      </DialogTrigger>

      <DialogContent className="rounded-2xl w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-custom-black">
            Share Project Access
          </DialogTitle>
          <p className="mt-2 text-sm font-medium text-custom-gray-1 text-center bg-custom-gray-3 px-5 py-2">
            {badgeLabel.toUpperCase()}
          </p>
          <DialogDescription className="text-custom-black text-sm mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-sm text-custom-black">
          {fields.map(({ label, value }) => (
            <p key={label}>
              <strong>{label}</strong>{" "}
              <span className="break-all">{value}</span>
            </p>
          ))}

          {footerText && (
            <p className="mt-2 text-xs text-custom-black">
              {footerText}
            </p>
          )}
        </div>

        <DialogFooter className="mt-6">
          <CustomButton
            className="w-full bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
            onClick={copyLink}
          >
            Copy Project Invite
          </CustomButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
