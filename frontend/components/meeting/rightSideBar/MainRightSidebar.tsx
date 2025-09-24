import { ChevronRight } from "lucide-react";
import React, { useState } from "react";
import type { Socket } from "socket.io-client";
import DocumentHub from "./DocumentHub";
import ObservationRoom from "./ObservationRoom";
import Backroom from "./Backroom";

const MainRightSidebar = ({
  setIsRightOpen,
  isStreaming,
  observerCount,
  observerList,
  sessionId,
  socket,
  me,
}: {
  setIsRightOpen: (isRightOpen: boolean) => void;
  isStreaming: boolean;
  observerCount: number;
  observerList: { name: string; email: string }[];
  sessionId: string;
  socket: Socket | null;
  me: {
    email: string;
    name: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
  };
}) => {
  const [backroomDefaultTarget, setBackroomDefaultTarget] = useState<
    string | undefined
  >(undefined);
  // prevent unused var linter errors
  // referencing these ensures they are treated as used until needed
  void sessionId;
  void backroomDefaultTarget;
  void setBackroomDefaultTarget;
  return (
    <aside className="relative col-span-3 h-full rounded-l-2xl p-3 overflow-y-auto bg-white shadow">
      <button
        type="button"
        onClick={() => setIsRightOpen(false)}
        className="absolute -left-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
        aria-label="Collapse right panel"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isStreaming && <ObservationRoom />}
      <Backroom
        isStreaming={isStreaming}
        observerCount={observerCount}
        observerList={observerList}
        socket={socket}
        me={me}
      />

      {/* Document Hub */}
      <DocumentHub />
    </aside>
  );
};

export default MainRightSidebar;
