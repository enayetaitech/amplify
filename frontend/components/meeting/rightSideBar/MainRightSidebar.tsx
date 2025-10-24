import { MoveRightIcon } from "lucide-react";
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
  projectId,
  socket,
  me,
}: {
  setIsRightOpen: (isRightOpen: boolean) => void;
  isStreaming: boolean;
  observerCount: number;
  observerList: { name: string; email: string }[];
  sessionId: string;
  projectId: string;
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
    <>
      {/* mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-30 md:hidden"
        onClick={() => setIsRightOpen(false)}
      />
      <aside className="fixed inset-y-0 right-0 z-40 w-[320px] max-w-[85vw] bg-white shadow overflow-y-auto overflow-x-hidden p-3 rounded-none md:relative md:z-auto md:w-auto md:inset-auto md:right-auto md:col-span-3 md:h-full md:rounded-l-2xl md:p-2">
        <button
          type="button"
          onClick={() => setIsRightOpen(false)}
          className="absolute -left-0 top-3 z-50 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
          aria-label="Collapse right panel"
        >
          <MoveRightIcon className="h-4 w-4" />
        </button>
        {isStreaming ? (
          <Backroom
            isStreaming={isStreaming}
            observerCount={observerCount}
            observerList={observerList}
            socket={socket}
            me={me}
          />
        ) : (
          <ObservationRoom />
        )}

        <DocumentHub projectId={projectId} />
      </aside>
    </>
  );
};

export default MainRightSidebar;
