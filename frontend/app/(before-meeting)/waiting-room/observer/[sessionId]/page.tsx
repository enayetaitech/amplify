"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import Logo from "components/shared/LogoComponent";
import { Button } from "components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "components/ui/sheet";
import {
  MessageSquare,
  PanelRightOpen,
  PanelRightClose,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Socket } from "socket.io-client";

export default function ObserverWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [observerList, setObserverList] = useState<
    { name: string; email: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [meEmail, setMeEmail] = useState<string>("");

  console.log(observerList, meEmail);

  useEffect(() => {
    // Effect: establish socket connection for this observer session
    // - Connects to the socket server with role=Observer and saved user info
    // - Listens for "observer:stream:started" to navigate to the streaming page
    // - Listens for participant admission announcements and shows toasts
    // - Cleans up listeners and disconnects the socket on unmount or sessionId change
    if (!sessionId) return;

    const saved =
      typeof window !== "undefined" &&
      window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId,
        role: "Observer",
        name: saved?.name || "",
        email: saved?.email || "",
      },
    });

    const onStarted = () => {
      toast.success(
        "Streaming started. You are being taken to the streaming page."
      );
      router.replace(`/meeting/${sessionId}?role=Observer`);
    };

    s.on("observer:stream:started", onStarted);
    setSocket(s);

    // Show toasts when participants are admitted
    const onOneAdmitted = (p: { name?: string; email?: string }) => {
      const label = p?.name || p?.email || "Participant";
      toast.success(`${label} was admitted to the meeting`);
    };
    const onManyAdmitted = (p: { count?: number }) => {
      const c = Number(p?.count || 0);
      if (c > 0) toast.success(`${c} participants were admitted`);
    };
    s.on("announce:participant:admitted", onOneAdmitted);
    s.on("announce:participants:admitted", onManyAdmitted);

    return () => {
      s.off("observer:stream:started", onStarted);
      s.off("announce:participant:admitted", onOneAdmitted);
      s.off("announce:participants:admitted", onManyAdmitted);
      s.disconnect();
    };
  }, [router, sessionId]);

  // Effect: load current observer identity from localStorage
  // - Reads `liveSessionUser` from localStorage to set `meEmail`
  // - Used to avoid showing the current observer in the observer list
  // - Runs once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};
      setMeEmail(saved?.email || "");
    } catch {
      // ignore
    }
  }, []);

  // Effect: subscribe to observer list updates via socket
  // - Registers a handler for the "observer:list" event to update `observerList`
  // - Requests the current list via "observer:list:get" and sets the result
  // - Cleans up the event listener when the socket instance changes or on unmount
  useEffect(() => {
    if (!socket) return;
    const onList = (p: { observers?: { name: string; email: string }[] }) => {
      const list = Array.isArray(p?.observers) ? p.observers : [];
      setObserverList(list);
    };
    socket.on("observer:list", onList);
    socket.emit(
      "observer:list:get",
      {},
      (resp?: { observers?: { name: string; email: string }[] }) => {
        const list = Array.isArray(resp?.observers) ? resp!.observers! : [];
        setObserverList(list);
      }
    );
    return () => {
      socket.off("observer:list", onList);
    };
  }, [socket]);

  return (
    <div className="min-h-screen dashboard_sidebar_bg">
      {/* Header */}

      <div className="flex">
        {/* Main */}
        <main className="flex-1 px-4 lg:px-8 pb-10 w-full">
          {/* Desktop toggle when sidebar hidden */}

          <div className="flex items-center justify-between px-4 lg:px-8 py-2 ">
            <div className="items-center gap-3 hidden lg:flex">
              <Video />
              <span className="text-sm">Observation Room</span>
              <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
                Observer View
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Logo />
            </div>
          </div>
          {!isChatOpen && (
            <div className="hidden lg:flex items-center gap-2 mb-3 justify-end ">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(true)}
              >
                <PanelRightOpen className="h-4 w-4 mr-2" /> Open Chat
              </Button>
            </div>
          )}
          <div className=" rounded-xl bg-white p-4 lg:p-6">
            <div className="h-[60vh] lg:h-[70vh] flex items-center justify-center">
              <p className="text-center text-slate-700">
                Please wait, the meeting host will let you in soon.
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar (desktop right) */}
        {isChatOpen && (
          <aside className="hidden lg:flex w-[320px] shrink-0 h-[100vh]  sticky top-0">
            <div className="bg-white w-full flex flex-col rounded-l-2xl h-full ">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold tracking-wide">
                  Observation Room Chat
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close chat"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                {/* New tabs: Observer List & Observer Chat */}
                <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden flex flex-col">
                  <div className="flex-1 flex min-h-0 flex-col">
                    <div className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2 flex items-center p-2">
                      <button
                        type="button"
                        data-tab="list"
                        className={`rounded-full text-sm px-4 cursor-pointer shadow-sm ${
                          activeTab === "list"
                            ? "bg-custom-dark-blue-1 text-white"
                            : "bg-transparent border-custom-dark-blue-1 text-custom-dark-blue-1"
                        }`}
                        onClick={() => setActiveTab("list")}
                      >
                        Observer List
                      </button>
                      <button
                        type="button"
                        data-tab="chat"
                        className={`rounded-full cursor-pointer text-sm px-4  shadow-sm ml-2 ${
                          activeTab === "chat"
                            ? "bg-custom-dark-blue-1 text-white"
                            : "bg-transparent border-custom-dark-blue-1 text-custom-dark-blue-1"
                        }`}
                        onClick={() => setActiveTab("chat")}
                      >
                        Observer Chat
                      </button>
                    </div>

                    <div data-observer-panel className="p-2 flex-1 min-h-0">
                      <div
                        data-tabcontent="list"
                        style={{
                          display: activeTab === "list" ? "block" : "none",
                        }}
                        className="h-[36vh] overflow-y-auto bg-white rounded p-2"
                      >
                        <div className="space-y-2">
                          <h1>Yet to implement</h1>
                        </div>
                      </div>
                      <div
                        data-tabcontent="chat"
                        style={{
                          display: activeTab === "chat" ? "block" : "none",
                        }}
                        className="h-[36vh] overflow-y-auto bg-white rounded p-2"
                      >
                        <div className="space-y-2">
                          <h1>Yet to implement</h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Chat Sheet on right */}
      <Sheet
        open={
          isChatOpen &&
          typeof window !== "undefined" &&
          window.innerWidth < 1024
        }
        onOpenChange={setIsChatOpen}
      >
        <SheetContent side="right" className="p-0 w-[90%] sm:max-w-sm">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Observation Room Chat</SheetTitle>
          </SheetHeader>
          <div className="p-2">
            <h1>Yet to implement</h1>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
