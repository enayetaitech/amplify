"use client";

import { useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";
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

  // Filter out observers from the participant list
  // Observers may have names starting with "Observer" or be identified by their identity pattern
  const filteredParticipants = participants.filter((p) => {
    const name = (p.name || "").trim();
    const identity = (p.identity || "").toLowerCase();
    // Filter out if name starts with "Observer" (case-insensitive)
    if (name.toLowerCase().startsWith("observer")) return false;
    // Filter out if identity contains "observer" pattern
    if (identity.includes("observer_") || identity.startsWith("observer"))
      return false;
    return true;
  });

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
            {filteredParticipants.length === 0 && (
              <div className="text-sm text-gray-500">No participants yet.</div>
            )}
            {filteredParticipants.map((p) => (
              <div key={p.identity} className="text-sm">
                {p.name}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="pchat">
          {(() => {
            const mapped: ChatWindowMessage[] = participantGroupMessages.map(
              (m, i) => ({
                id: i,
                senderEmail: m.senderEmail,
                senderName: m.name,
                content: m.content,
                timestamp: m.timestamp || new Date(),
              })
            );
            return (
              <ChatWindow
                title="Participant Group Chat"
                meEmail={""}
                messages={mapped}
                value={""}
                onChange={() => {}}
                onSend={() => {}}
                onClose={() => {}}
                height="30vh"
                readOnly
              />
            );
          })()}
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
