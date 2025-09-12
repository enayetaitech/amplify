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

export default function ObserverWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
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
      router.replace(`/meeting/${sessionId}?role=Observer`);
    };

    s.on("observer:stream:started", onStarted);

    return () => {
      s.off("observer:stream:started", onStarted);
      s.disconnect();
    };
  }, [router, sessionId]);

  return (
    <div className="min-h-screen dashboard_sidebar_bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="items-center gap-3 hidden lg:flex">
          <Video />
          <span className="text-sm">Waiting Room</span>
          <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
            Observer View
          </span>
        </div>
        {/* <div className="text-center hidden lg:block">
          <h1 className="text-lg lg:text-xl font-semibold tracking-wide">
            MEETING 01 - PROJECT NAME
          </h1>
        </div> */}
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

      <div className="flex">
        {/* Main */}
        <main className="flex-1 px-4 lg:px-8 pb-10 w-full">
          {/* Desktop toggle when sidebar hidden */}
          {!isChatOpen && (
            <div className="hidden lg:flex items-center gap-2 mb-3 justify-end">
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
          <aside className="hidden lg:flex w-[320px] shrink-0 h-[calc(100vh-80px)] sticky top-0">
            <div className="bg-white w-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold tracking-wide">
                  WAITING ROOM CHAT
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
              <div className="p-4 text-sm text-muted-foreground">
                Chat will appear here once implemented.
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
            <SheetTitle>WAITING ROOM CHAT</SheetTitle>
          </SheetHeader>
          <div className="p-4 text-sm text-muted-foreground">
            Chat will appear here once implemented.
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
