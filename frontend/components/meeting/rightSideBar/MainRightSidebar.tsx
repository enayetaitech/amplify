import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
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
  const [tab, setTab] = useState("list");
  const [backroomDefaultTarget, setBackroomDefaultTarget] = useState<
    string | undefined
  >(undefined);
  // prevent unused var linter errors
  // referencing these ensures they are treated as used until needed
  void Backroom;
  void sessionId;
  void socket;
  void me;
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
      {/* Backroom tabs - styled like left sidebar Participants panel */}
      <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold pl-2">Backroom</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-black text-white text-xs px-3 py-1"
            aria-label="Observer count"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            <span>Viewers</span>
            <span className="ml-1 rounded bg-white/20 px-1">
              {isStreaming ? observerCount : 0}
            </span>
          </button>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v)}>
          <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
            <TabsTrigger
              value="list"
              className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
            >
              Observer List
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
            >
              Observer Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {!isStreaming ? (
              <div className="text-sm text-gray-500">Not Streaming</div>
            ) : (
              <div className="space-y-2">
                {observerList.length === 0 && (
                  <div className="text-sm text-gray-500">No observers yet.</div>
                )}
                {observerList.map((o) => {
                  const label = o.name || o.email || "Observer";
                  return (
                    <div
                      key={`${label}-${o.email}`}
                      className="flex items-center justify-between gap-2  rounded px-2 py-1"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <div className="space-y-2">
              {observerList.length === 0 && (
                <div className="text-sm text-gray-500">No observers yet.</div>
              )}
              {observerList.map((o) => {
                const label = o.name || o.email || "Observer";
                return (
                  <div
                    key={`chat-${label}-${o.email}`}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast("Yet to implement")}
                      aria-label={`Chat with ${label}`}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <MessageSquare className="h-4 w-4 text-custom-dark-blue-1" />
                    </button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Hub */}
      <DocumentHub />
    </aside>
  );
};

export default MainRightSidebar;
