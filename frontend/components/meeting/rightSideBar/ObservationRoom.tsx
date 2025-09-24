import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import { MessageSquare } from "lucide-react";

type WaitingObserver = { name?: string; email?: string };

const ObservationRoom = () => {
  const [tab, setTab] = useState("list");
  const [observers, setObservers] =
    useState<WaitingObserver[]>([]);

  // // Sync local state if parent supplies a list
  // React.useEffect(() => {
  //   setObservers(waitingObservers || []);
  // }, [waitingObservers]);

  // Wire to meeting socket to receive live observer list updates
  React.useEffect(() => {
    type MinimalSocket = {
      on: (
        event: string,
        cb: (payload: { observers?: WaitingObserver[] }) => void
      ) => void;
      off: (
        event: string,
        cb: (payload: { observers?: WaitingObserver[] }) => void
      ) => void;
      emit: (
        event: string,
        payload: object,
        ack?: (resp: { observers?: WaitingObserver[] }) => void
      ) => void;
    };

    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;
    if (!s) return;

    const onObserverList = (payload: { observers?: WaitingObserver[] }) => {
      setObservers(Array.isArray(payload?.observers) ? payload.observers : []);
    };

    s.on("observer:list", onObserverList);

    // Request initial observers snapshot
    try {
      s.emit(
        "observer:list:get",
        {},
        (resp?: { observers?: WaitingObserver[] }) => {
          console.log("observer list", resp?.observers);
          setObservers(Array.isArray(resp?.observers) ? resp!.observers! : []);
        }
      );
    } catch {}

    return () => {
      s.off("observer:list", onObserverList);
    };
  }, []);

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold pl-2">Observation Room</h3>
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
            {observers.length}
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
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
            >
              0
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="space-y-2">
            {observers.length === 0 ? (
              <div className="text-sm text-gray-500">No observers yet.</div>
            ) : (
              observers.map((o, idx) => {
                const label = o.name || o.email || "Observer";
                return (
                  <div
                    key={`${label}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {label}
                      </div>
                    </div>
                    
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid grid-cols-12 gap-2 h-[26vh]">
            <div className="col-span-12 rounded bg-white overflow-y-auto">
              <div className="space-y-1 p-2">
                <div className="flex items-center justify-between p-2 rounded">
                  <div className="flex items-center gap-2 min-w-0 ">
                    <span className="text-sm font-medium truncate">
                      Group Chat
                    </span>
                  </div>
                  <div className="relative inline-flex items-center justify-center h-6 w-6">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="absolute -top-1 -right-1">
                      <Badge
                        variant="destructive"
                        className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center"
                      >
                        0
                      </Badge>
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  No conversations yet.
                </div>
              </div>
            </div>

            {/* Message view skeleton */}
            {/*
            <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between p-0.5 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm ">Chat with Observer</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-0.5">
                <div className="space-y-1 text-sm">
                  <div className="text-gray-500">No messages yet.</div>
                </div>
              </div>
              <div className="p-2 flex items-center gap-2 border-t">
                <Input placeholder="Type a message..." />
                <Button size="sm" className="h-8 w-8 p-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ObservationRoom;
