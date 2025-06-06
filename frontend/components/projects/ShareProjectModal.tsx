// frontend/components/projects/ShareProjectModal.tsx
"use client";

import React from "react";
import ShareDialog from "components/viewProject/ShareDialog";
import { IProject } from "@shared/interface/ProjectInterface";

interface ShareProjectModalProps {
  open: boolean;
  shareType: "observer" | "participant" | null;
  project: IProject | null;
  onClose: () => void;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  open,
  shareType,
  project,
  onClose,
}) => {
  if (!open || !shareType || !project) return null;

  const isObserver = shareType === "observer";
  const baseOrigin = window.location.origin;

  return (
    <ShareDialog
      open={true}
      onOpenChange={onClose}
      triggerLabel=""
      badgeLabel={isObserver ? "Observer Link" : "Participant Link"}
      description={
        isObserver
          ? `You have been invited to the observer for ${project.name}.`
          : "You have been invited to participate in an upcoming research session. Please check the confirmation details from your recruiter for the time and date of your session."
      }
      fields={
        isObserver
          ? [
              {
                label: "Meeting Link:",
                value: `${baseOrigin}/join/observer/${project._id}`,
              },
              {
                label: "Passcode:",
                value: project.projectPasscode ?? "",
              },
            ]
          : [
              { label: "Project:", value: project.name },
              {
                label: "Session Link:",
                value: `${baseOrigin}/join/participant/${project._id}`,
              },
            ]
      }
      copyPayload={
        isObserver
          ? `Link: ${baseOrigin}/join/observer/${project._id}\nPasscode: ${
              project.projectPasscode ?? ""
            }`
          : `${baseOrigin}/join/participant/${project._id}`
      }
      footerText={
        isObserver
          ? "Once you click the link and enter your passcode, you will be prompted to create an account or login to your existing account. After completing this process once, you may then access your meeting via the link or your account login."
          : undefined
      }
    />
  );
};

export default ShareProjectModal;
