"use client";

import { useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import PollResults from "../PollResults";
import { PollQuestion } from "@shared/interface/PollInterface";

type ParticipantItem = { identity: string; name: string };

type ParticipantGroupMessage = {
  senderEmail?: string;
  name?: string;
  content: string;
  timestamp?: Date;
};

interface ParticipantMessageInObserverLeftSidebarProps {
  participants: ParticipantItem[];
  participantGroupMessages: ParticipantGroupMessage[];
  participantGroupLoading: boolean;
  // optional shared results for observers
  sharedPoll?: { title?: string; questions?: PollQuestion[] } | null;
  resultsMapping?: Record<
    string,
    { total: number; counts: { value: unknown; count: number }[] }
  > | null;
  sharedRunId?: string | null;
}

export default function ParticipantMessageInObserverLeftSidebar({
  participants,
  participantGroupMessages,
  participantGroupLoading,
  sharedPoll,
  resultsMapping,
  sharedRunId,
}: ParticipantMessageInObserverLeftSidebarProps) {
  const participantGroupRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll participant group chat (also when results arrive)
  useEffect(() => {
    const el = participantGroupRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [
    participantGroupMessages.length,
    participantGroupLoading,
    resultsMapping,
  ]);
  return (
    <div className="bg-custom-gray-2 rounded-lg p-2 flex-1 min-h-0 overflow-y-auto">
      <h3 className="font-semibold mb-2">Participants</h3>
      <Tabs defaultValue="plist">
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="plist"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant List
          </TabsTrigger>
          <TabsTrigger
            value="pchat"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant Chat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plist">
          <div className="space-y-2">
            {participants.length === 0 && (
              <div className="text-sm text-gray-500">No participants yet.</div>
            )}
            {participants.map((p) => (
              <div key={p.identity} className="text-sm">
                {p.name}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="pchat">
          <div className="flex flex-col h-[30vh] min-h-0">
            <div className="flex items-center justify-between p-2 border-b bg-gray-50 rounded-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Participant Group Chat
                </span>
              </div>
              <div className="text-xs text-gray-500">Read-only</div>
            </div>
            <div
              ref={participantGroupRef}
              className="flex-1 overflow-y-auto p-2 bg-white"
            >
              {participantGroupLoading ? (
                <div className="text-sm text-gray-500">
                  Loading chat history...
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  {participantGroupMessages.length === 0 ? (
                    <div className="text-gray-500">
                      No participant messages yet.
                    </div>
                  ) : (
                    participantGroupMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className="mr-auto bg-gray-50 max-w-[90%] rounded px-2 py-1"
                      >
                        <div className="text-[11px] text-gray-500">
                          {m.name || m.senderEmail || "Participant"}
                        </div>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div>
        {/* Render shared results as a separate section at the bottom of the chat */}
        {resultsMapping && sharedPoll && (
          <div className="mt-3 pt-3 border-t border-gray-100 rounded-lg bg-white p-2">
            <h3 className="font-semibold mb-2">Poll Results</h3>
            <div className="mb-2 text-sm font-medium">
              {sharedPoll.title} {sharedRunId ? `(Run #${sharedRunId})` : null}
            </div>
            {(sharedPoll.questions || []).map((q: PollQuestion) => (
              <div key={q._id} className="mb-2">
                <div className="font-medium text-sm">{q.prompt}</div>
                <PollResults aggregate={resultsMapping[q._id]} question={q} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
