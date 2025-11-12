"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import type {
  IObserverWaitingUser,
  IParticipant,
  IObserver,
} from "@shared/interface/LiveSessionInterface";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
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
  MoveLeftIcon,
  MoveRightIcon,
  Video,
} from "lucide-react";
import ParticipantWaitingDm from "components/meeting/ParticipantWaitingDm";
import useChat from "hooks/useChat";

type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

interface WaitingUser {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
  joinedAt: string;
}

interface JoinAck {
  participantsWaitingRoom: WaitingUser[];
  observersWaitingRoom: IObserverWaitingUser[];
  participantList: IParticipant[];
  observerList: IObserver[];
}

export default function ParticipantWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  // const { socket } = useMeeting();

  // Load 'me' from localStorage (set by Join page)
  const me = useMemo(() => {
    const raw = localStorage.getItem("liveSessionUser");
    if (!raw) {
      // If missing, bounce back to join
      router.replace(`/join/participant/${sessionId}`);
      return {
        name: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "Participant" as UserRole,
      };
    }
    const parsed = JSON.parse(raw) as {
      name: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: UserRole;
    };
    return {
      name: parsed.name,
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: parsed.role,
    };
  }, [router, sessionId]);

  const [waiting, setWaiting] = useState<WaitingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Custom function to handle chat open/close with unread count reset
  const handleChatToggle = useCallback((open: boolean) => {
    setIsChatOpen(open);
    if (open) {
      setUnreadCount(0); // Reset unread count when opening chat
    }
  }, []);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessageCountRef = useRef(0);

  // Move chat state to parent to persist across mobile sheet open/close
  const { send, getHistory, messagesByScope } = useChat({
    socket: socketRef.current,
    sessionId,
    my: { email: me.email, name: me.name, role: me.role },
  });

  // Track unread messages
  useEffect(() => {
    const currentMessageCount = messagesByScope["waiting_dm"]?.length || 0;
    const prevMessageCount = prevMessageCountRef.current;

    if (currentMessageCount > prevMessageCount && !isChatOpen) {
      setUnreadCount((prev) => prev + (currentMessageCount - prevMessageCount));
    }

    prevMessageCountRef.current = currentMessageCount;
  }, [messagesByScope, isChatOpen]);

  // Initialize chat history when socket is available
  useEffect(() => {
    if (socketRef.current && me.email) {
      getHistory("waiting_dm");
    }
  }, [getHistory, me.email]);

  // chat state
  // const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!sessionId || !me.email) return;

    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId,
        role: me.role,
        name: me.name,
        email: me.email,
      },
    });

    socketRef.current = s;

    s.on("connect", () => {
      if (joinedRef.current) return;
      joinedRef.current = true;

      s.emit("join-room", {}, (rooms: JoinAck) => {
        // exclude self from the UI list
        const others = (rooms.participantsWaitingRoom || []).filter(
          (u) => u.email !== me.email
        );
        setWaiting(others);
      });
    });

    s.on(
      "waiting:list",
      (payload: { participantsWaitingRoom: WaitingUser[] }) => {
        setWaiting(
          (payload.participantsWaitingRoom || []).filter(
            (u) => u.email !== me.email
          )
        );
      }
    );

    s.on(
      "participant:admitted",
      async ({ admitToken }: { admitToken: string }) => {
        try {
          const { toast } = await import("sonner");
          toast.success("You have been admitted to the meeting");
          const resp = await api.post<ApiResponse<{ token: string }>>(
            "/api/v1/livekit/exchange",
            { admitToken } // public route – no auth header needed
          );
          const lkToken = resp.data.data.token;

          // Store for the meeting page to read (short-lived is fine in sessionStorage)
          sessionStorage.setItem(`lk:${sessionId}`, lkToken);

          // Go to the actual meeting page
          router.push(`/meeting/${sessionId}`);
        } catch (err) {
          console.error("Failed to exchange admit token", err);
        }
      }
    );

    s.on("waiting:removed", () => {
      try {
        localStorage.removeItem("liveSessionUser");
      } catch {}
      router.push(`/remove-participant`); // implement simple “removed” page later
    });

    return () => {
      s.off("waiting:list");
      s.off("participant:admitted");
      s.off("waiting:removed");
      s.disconnect();
    };
  }, [me.email, me.name, me.role, router, sessionId]);

  // Clear local storage on browser/tab close
  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        localStorage.removeItem("liveSessionUser");
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return (
    <div className="min-h-screen dashboard_sidebar_bg">
      {/* Header */}

      {/* Layout */}
      <div className="flex h-full">
        {/* Sidebar (desktop) */}
        {isChatOpen && (
          <aside className="hidden lg:flex w-[320px] ">
            <div className="bg-white w-full flex flex-col h-full rounded-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold tracking-wide">
                  WAITING ROOM CHAT
                </h3>
                <Button
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close chat"
                  className="rounded-full "
                >
                  <MoveLeftIcon className="h-4 w-4 text-white" />
                </Button>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <ParticipantWaitingDm
                  socket={socketRef.current}
                  sessionId={sessionId}
                  me={{
                    email: me.email,
                    name: me.name,
                    firstName: me.firstName,
                    lastName: me.lastName,
                    role: "Participant",
                  }}
                  chatProps={{ send, getHistory, messagesByScope }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 px-4 lg:px-8 pb-10 w-full">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="items-center gap-3 hidden lg:flex">
              <Video />
              <span className="text-sm ">Waiting Room</span>
              <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
                Participant View
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
                className="lg:hidden z-50 relative"
                onClick={() => handleChatToggle(true)}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
              <Logo />
            </div>
          </div>
          {!isChatOpen && (
            <div className="hidden lg:flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChatToggle(true)}
              >
                <MoveRightIcon className="h-4 w-4 mr-2" /> Open Chat
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          )}

          <div className="rounded-xl bg-white p-4 lg:p-6">
            <div className="h-[60vh] lg:h-[70vh] flex items-center justify-center">
              <p className="text-center text-slate-700">
                Please wait, the meeting host will let you in soon.
              </p>
            </div>
          </div>

          {/* Optional list of others waiting – hidden to match design */}
          <div className="sr-only">
            {waiting.length > 0 && (
              <ul>
                {waiting.map((u) => (
                  <li key={u.email}>{u.name}</li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Chat Sheet */}
      <Sheet
        open={
          isChatOpen &&
          typeof window !== "undefined" &&
          window.innerWidth < 1024
        }
        onOpenChange={handleChatToggle}
      >
        <SheetContent side="left" className="p-0 w-[90%] sm:max-w-sm">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>WAITING ROOM CHAT</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col min-h-0">
            <ParticipantWaitingDm
              socket={socketRef.current}
              sessionId={sessionId}
              me={{ email: me.email, name: me.name, role: "Participant" }}
              chatProps={{ send, getHistory, messagesByScope }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
