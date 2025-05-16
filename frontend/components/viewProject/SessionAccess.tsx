// components/viewProject/SessionAccess.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import type { IProject } from "@shared/interface/ProjectInterface";
import ShareDialog from "./ShareDialog";

interface SessionAccessProps {
  project: IProject;
}

const SessionAccess: React.FC<SessionAccessProps> = ({ project }) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const participantLink = `${origin}/join/participant/${project._id ?? ""}`;
  const observerLink   = `${origin}/join/observer/${project._id ?? ""}`;
  const passcode       = project.projectPasscode ?? "";

  return (
    <Card className="w-full mt-10 border-0 shadow-all-sides">
      <div className="flex justify-between items-center">
        <CardHeader className="flex-1">
          <CardTitle className="text-custom-teal">Session Access</CardTitle>
        </CardHeader>

        <CardContent className="flex items-center gap-4">
          {/* OBSERVER */}
          <ShareDialog
            triggerLabel="Observer Link"
            badgeLabel="Observer Link"
            description={`You have been invited to the observer for ${project.name}.`}
            fields={[
              { label: "Meeting Link:", value: observerLink },
              { label: "Passcode:",      value: passcode },
            ]}
            copyPayload={`Link: ${observerLink}\nPasscode: ${passcode}`}
            footerText="Once you click the link and enter your passcode, you will be prompted to create an account or login to your existing account. After completing this process once, you may then access your meeting via the link or your account login."
          />

          {/* PARTICIPANT */}
          <ShareDialog
            triggerLabel="Participant Link"
            badgeLabel="Participant Link"
            description="You have been invited to participate in an upcoming research session. Please check the confirmation details from your recruiter for the time and date of your session."
            fields={[
              { label: "Project:",      value: project.name },
              { label: "Session Link:", value: participantLink },
            ]}
            copyPayload={participantLink}
          />
        </CardContent>
      </div>
    </Card>
  );
};

export default SessionAccess;
