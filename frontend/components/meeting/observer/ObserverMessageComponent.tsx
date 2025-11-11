"use client";

import { RefObject } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import { MessageSquare } from "lucide-react";
import RightSidebarHeading from "components/meeting/RightSidebarHeading";
import { formatDisplayName } from "lib/utils";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";

type Observer = { name: string; email: string };
type Moderator = { name: string; email: string; role: string };
type GroupMessage = { senderEmail?: string; name?: string; content: string };
type DmMessage = {
  email: string;
  senderName?: string;
  role?: string;
  content: string;
  timestamp?: string | Date;
  toEmail?: string;
};

interface Props {
  observerCount: number;
  observerList: Observer[];
  moderatorList: Moderator[];
  myEmailLower: string;
  dmUnreadByEmail: Record<string, number>;
  setDmUnreadByEmail: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  selectedObserver: { email: string; name?: string } | null;
  setSelectedObserver: React.Dispatch<
    React.SetStateAction<{ email: string; name?: string } | null>
  >;
  showGroupChatObs: boolean;
  setShowGroupChatObs: React.Dispatch<React.SetStateAction<boolean>>;
  groupUnread: number;
  groupRef: RefObject<HTMLDivElement | null>;
  groupLoading: boolean;
  groupMessages: GroupMessage[];
  groupText: string;
  setGroupText: React.Dispatch<React.SetStateAction<string>>;
  sendGroup: () => void;
  dmRef: RefObject<HTMLDivElement | null>;
  loadingHistory: boolean;
  dmMessages: DmMessage[];
  dmText: string;
  setDmText: React.Dispatch<React.SetStateAction<string>>;
  sendDm: () => void;
}

export default function ObserverMessageComponent({
  observerCount,
  observerList,
  moderatorList,
  myEmailLower,
  dmUnreadByEmail,
  setDmUnreadByEmail,
  selectedObserver,
  setSelectedObserver,
  showGroupChatObs,
  setShowGroupChatObs,
  groupUnread,
  groupRef,
  groupLoading,
  groupMessages,
  groupText,
  setGroupText,
  sendGroup,
  dmRef,
  loadingHistory,
  dmMessages,
  dmText,
  setDmText,
  sendDm,
}: Props) {
  void groupRef;
  void groupLoading;
  void dmRef;
  void loadingHistory;
  const totalDmUnread = Object.values(dmUnreadByEmail || {}).reduce(
    (s, v) => s + (v || 0),
    0
  );
  const totalObserverUnread = totalDmUnread + (groupUnread || 0);
  return (
    <>
      <RightSidebarHeading title="Backroom" observerCount={observerCount} />
      <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden">
        <Tabs
          defaultValue="list"
          onValueChange={(v) => {
            if (v === "list") {
              setShowGroupChatObs(false);
              setSelectedObserver(null);
            }
          }}
        >
          <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
            <TabsTrigger
              value="list"
              className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
            >
              Observer List
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer relative"
              onClick={() => {
                // Close any open chat window when switching to Observer Text tab
                setShowGroupChatObs(false);
                setSelectedObserver(null);
              }}
            >
              Observer Text
              {totalObserverUnread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-custom-orange-1 text-white">
                  {totalObserverUnread}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="space-y-2">
              {observerList.length === 0 && (
                <div className="text-sm text-gray-500">No observers yet.</div>
              )}
              {observerList.map((o) => {
                const label = o.name || o.email || "Observer";
                return (
                  <div
                    key={`${label}-${o.email}`}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1"
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
          </TabsContent>
          <TabsContent value="chat">
            <div className="grid grid-cols-12 gap-2 h-[32vh]">
              {!selectedObserver && !showGroupChatObs && (
                <div className="col-span-12 rounded bg-white ">
                  <div className="space-y-1 p-2">
                    {observerList.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No observers yet.
                      </div>
                    ) : (
                      <>
                        {moderatorList
                          .filter((m) => {
                            const nm = (m?.name || "").trim().toLowerCase();
                            if (nm === "moderator") return false;
                            if ((m?.email || "").toLowerCase() === myEmailLower)
                              return false;
                            const lbl = (m?.name || m?.email || "").trim();
                            return lbl.length > 0;
                          })
                          .map((m) => {
                            const label = m.name
                              ? formatDisplayName(m.name)
                              : m.email || "";
                            const mKey = (m.email || "").toLowerCase();
                            const mUnread = dmUnreadByEmail[mKey] || 0;
                            return (
                              <div
                                key={`${m.email}-${m.role}`}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => {
                                  setSelectedObserver({
                                    email: m.email,
                                    name: m.name,
                                  });
                                  setShowGroupChatObs(false);
                                  setDmUnreadByEmail((prev) => ({
                                    ...prev,
                                    [mKey]: 0,
                                  }));
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-medium truncate">
                                    {label}
                                  </span>
                                </div>
                                <div className="relative inline-flex items-center justify-center h-6 w-6">
                                  <MessageSquare className="h-4 w-4 text-gray-400" />
                                  {mUnread > 0 && (
                                    <span className="absolute -top-1 -right-1">
                                      <Badge className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center bg-custom-orange-1">
                                        {mUnread}
                                      </Badge>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        <div
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            setShowGroupChatObs(true);
                            setSelectedObserver(null);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">
                              Group Chat
                            </span>
                          </div>
                          <div className="relative inline-flex items-center justify-center h-6 w-6">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            {groupUnread > 0 && (
                              <span className="absolute -top-1 -right-1">
                                <Badge className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center bg-custom-orange-1">
                                  {groupUnread}
                                </Badge>
                              </span>
                            )}
                          </div>
                        </div>
                        {observerList
                          .filter((o) => {
                            const oEmailLower = (o?.email || "").toLowerCase();
                            if (oEmailLower === myEmailLower) return false;
                            // Exclude observers that are already in the moderator list
                            const isModerator = moderatorList.some(
                              (m) =>
                                (m?.email || "").toLowerCase() === oEmailLower
                            );
                            return !isModerator;
                          })
                          .map((o) => {
                            const label = o.name
                              ? formatDisplayName(o.name)
                              : o.email || "Observer";
                            const oKey = (o.email || "").toLowerCase();
                            return (
                              <div
                                key={`${o.email}`}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => {
                                  setSelectedObserver({
                                    email: o.email,
                                    name: o.name,
                                  });
                                  setShowGroupChatObs(false);
                                  setDmUnreadByEmail((prev) => ({
                                    ...prev,
                                    [oKey]: 0,
                                  }));
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-medium truncate">
                                    {label}
                                  </span>
                                </div>
                                <div className="relative inline-flex items-center justify-center h-6 w-6">
                                  <MessageSquare className="h-4 w-4 text-gray-400" />
                                  {(dmUnreadByEmail[
                                    (o.email || "").toLowerCase()
                                  ] || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1">
                                      <Badge
                                        variant="destructive"
                                        className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center"
                                      >
                                        {
                                          dmUnreadByEmail[
                                            (o.email || "").toLowerCase()
                                          ]
                                        }
                                      </Badge>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </>
                    )}
                  </div>
                </div>
              )}
              {showGroupChatObs && (
                <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                  {(() => {
                    const mapped: ChatWindowMessage[] = groupMessages.map(
                      (m, i) => ({
                        id: i,
                        senderEmail: (m as { senderEmail?: string })
                          .senderEmail,
                        senderName: (m as { name?: string }).name,
                        content: m.content,
                        timestamp: new Date(),
                      })
                    );
                    return (
                      <ChatWindow
                        title="Observer Group Chat"
                        meEmail={myEmailLower}
                        messages={mapped}
                        value={groupText}
                        onChange={setGroupText}
                        onSend={sendGroup}
                        onClose={() => setShowGroupChatObs(false)}
                        height="32vh"
                      />
                    );
                  })()}
                </div>
              )}
              {selectedObserver && !showGroupChatObs && (
                <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                  {(() => {
                    const mapped: ChatWindowMessage[] = dmMessages.map(
                      (m, i) => ({
                        id: i,
                        senderEmail: m.email,
                        senderName: m.senderName,
                        content: m.content,
                        timestamp: m.timestamp || new Date(),
                      })
                    );
                    const title = `Chat with ${
                      selectedObserver.name
                        ? formatDisplayName(selectedObserver.name)
                        : selectedObserver.email
                    }`;
                    return (
                      <ChatWindow
                        title={title}
                        meEmail={myEmailLower}
                        messages={mapped}
                        value={dmText}
                        onChange={setDmText}
                        onSend={sendDm}
                        onClose={() => setSelectedObserver(null)}
                        height="32vh"
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
