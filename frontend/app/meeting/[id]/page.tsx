"use client";

import ModeratorWaitingPanel from "components/meeting/waitingRoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useRoomContext,
} from "@livekit/components-react";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import "@livekit/components-styles";
import "./meeting.css";
import { useGlobalContext } from "context/GlobalContext";
import { flagsFromSearchParams } from "constant/featureFlags";
import { safeLocalGet } from "utils/storage";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import BreakoutsPanel from "components/meeting/BreakoutsPanel";
import AutoPublishOnConnect from "components/meeting/AutoPublishOnConnect";
import Stage from "components/meeting/Stage";
import SubscribeCameraBridge from "components/meeting/SubscribeCameraBridge";
import ParticipantsPanel from "components/meeting/ParticipantsPanel";
import ForceMuteSelfBridge from "components/meeting/ForceMuteSelfBridge";
import ForceCameraOffSelfBridge from "components/meeting/ForceCameraOffSelfBridge";
import RegisterIdentityBridge from "components/meeting/RegisterIdentityBridge";
import BreakoutWarningBridge from "components/meeting/BreakoutWarningBridge";
import ObserverMeetingView from "components/meeting/observer/ObserverMeetingView";
import ParticipantChatPanel from "components/meeting/ParticipantChatPanel";
import MeetingJoinBridge from "components/meeting/MeetingJoinBridge";
import {
  ChevronLeft,
  ChevronRight,
  PenTool,
  Play,
  Square,
  LayoutGrid,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import Logo from "components/shared/LogoComponent";
import { Button } from "components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";

declare global {
  interface Window {
    __meetingSocket?: Socket;
  }
}
import {
  UiRole,
  ServerRole,
  toServerRole,
  normalizeUiRole,
  normalizeServerRole,
} from "constant/roles";
import MainRightSidebar from "components/meeting/rightSideBar/MainRightSidebar";
import WhiteboardPanel from "components/whiteboard/WhiteboardPanel";

type LocalJoinUser = {
  name?: string;
  email?: string;
  role?: ServerRole | string;
};

async function fetchLiveKitToken(sessionId: string, role: ServerRole) {
  const res = await api.post<ApiResponse<{ token: string }>>(
    "/api/v1/livekit/token",
    {
      roomName: sessionId,
      role,
    }
  );
  return res.data.data.token;
}

function LeaveMeetingButton({
  role,
  sessionId,
}: {
  role: UiRole;
  sessionId: string;
}) {
  const room = useRoomContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmText =
    role === "admin" || role === "moderator"
      ? "Are you sure you want to end this meeting for everyone?"
      : "Are you sure you want to leave this meeting?";

  const titleText =
    role === "admin" || role === "moderator" ? "End meeting" : "Leave meeting";

  const onConfirm = async () => {
    try {
      setBusy(true);
      if (role === "admin" || role === "moderator") {
        try {
          await api.post<ApiResponse<unknown>>(
            `/api/v1/liveSessions/${sessionId}/end`
          );
          toast.success("Meeting ended");
        } catch {
          toast.error("Failed to end meeting");
        }
        try {
          await room.disconnect(true);
        } catch {}
        try {
          localStorage.removeItem("liveSessionUser");
        } catch {}
        router.push("/projects");
      } else {
        try {
          await room.disconnect(true);
        } catch {}
        try {
          localStorage.removeItem("liveSessionUser");
        } catch {}
        router.replace("/participant-left");
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        {role === "admin" || role === "moderator" ? "End" : "Leave"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{titleText}</AlertDialogTitle>
            <AlertDialogDescription>{confirmText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={busy}>
              {role === "admin" || role === "moderator" ? "End" : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Meeting() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const featureFlags = useMemo(
    () => flagsFromSearchParams(searchParams),
    [searchParams]
  );

  const { id: sessionId } = useParams();

  // 1) derive role
  const { user } = useGlobalContext();

  const role: UiRole = useMemo((): UiRole => {
    const dashboardServer = normalizeServerRole(user?.role);
    if (dashboardServer)
      return dashboardServer === "Observer"
        ? "observer"
        : dashboardServer === "Moderator"
        ? "moderator"
        : dashboardServer === "Admin"
        ? "admin"
        : "participant";

    const qp = searchParams?.get("role");
    const qpUi = normalizeUiRole(qp);
    if (qpUi) return qpUi;

    const u = safeLocalGet<LocalJoinUser>("liveSessionUser");
    if (u) {
      const storedServer = normalizeServerRole(u?.role);
      if (storedServer)
        return storedServer === "Observer"
          ? "observer"
          : storedServer === "Moderator"
          ? "moderator"
          : storedServer === "Admin"
          ? "admin"
          : "participant";
    }
    return "participant" as UiRole;
  }, [user, searchParams]);

  const serverRole: ServerRole = useMemo(() => toServerRole(role), [role]);

  // current user's name/email (dashboard or join flow)
  const my = useMemo(() => {
    if (user?.email) {
      return {
        name: user?.firstName || user?.lastName || "",
        email: user.email as string,
        role: (user.role as ServerRole) || "Observer",
      };
    }
    const u = safeLocalGet<LocalJoinUser>("liveSessionUser") || {};
    return {
      name: u?.name || "",
      email: (u?.email as string) || "",
      role: (u?.role as ServerRole) || "Participant",
    };
  }, [user]);

  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(role !== "participant");
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [streamBusy, setStreamBusy] = useState<null | "start" | "stop">(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [observerCount, setObserverCount] = useState(0);
  const [observerList, setObserverList] = useState<
    { name: string; email: string }[]
  >([]);
  const [isBreakoutOverlayOpen, setIsBreakoutOverlayOpen] = useState(false);

  // 🔌 single meeting socket for this page
  const socketRef = useRef<Socket | null>(null);
  // warning toast state not needed; we use sonner directly

  // 1) fetch start/join token (participants/admin/mod) OR HLS url (observers)
  useEffect(() => {
    if (!sessionId) return;

    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
    if (!url) {
      console.error("Missing NEXT_PUBLIC_LIVEKIT_URL");
      return;
    }

    if ((role as UiRole) === "participant") {
      const saved =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`lk:${sessionId as string}`)
          : null;

      if (!saved) {
        router.replace(`/waiting-room/participant/${sessionId}`);
        return;
      }
      setToken(saved);
      setWsUrl(url);
      return;
    }

    if (role === "observer") {
      (async () => {
        try {
          const res = await api.get<ApiResponse<{ url: string }>>(
            `/api/v1/livekit/${sessionId as string}/hls`
          );
          const u = res.data?.data?.url || null;
          if (!u) {
            router.replace(`/waiting-room/observer/${sessionId}`);
            return;
          }
          setHlsUrl(u);
        } catch {
          router.replace(`/waiting-room/observer/${sessionId}`);
        }
      })();
      return;
    }

    (async () => {
      const lkToken = await fetchLiveKitToken(sessionId as string, serverRole);
      if (!lkToken) {
        console.error("Failed to get LiveKit token");
        return;
      }
      setToken(lkToken);
      setWsUrl(url);
    })();
  }, [sessionId, role, serverRole, router]);

  // Connect socket (once we know session)
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
        sessionId: String(sessionId),
        role: serverRole,
        name: my?.name || saved?.name || "",
        email: my?.email || saved?.email || "",
      },
    });
    socketRef.current = s;
    window.__meetingSocket = s;
    s.on("observer:count", (p: { count?: number }) => {
      setObserverCount(Number(p?.count || 0));
    });
    s.on(
      "observer:list",
      (p: { observers?: { name: string; email: string }[] }) => {
        setObserverList(Array.isArray(p?.observers) ? p.observers : []);
      }
    );
    // 1-minute breakout warning handler
    s.on("meeting:force-mute", (payload: { email?: string }) => {
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-mute-self"));
      toast.info("Your microphone was muted by the host.");
    });

    s.on("meeting:force-camera-off", (payload: { email?: string }) => {
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-camera-off"));
      toast.info("Your camera was turned off by the host.");
    });

    // Notify participant when moved to waiting
    s.on("meeting:moved-to-waiting", () => {
      try {
        toast.info("You were moved to the waiting room by the host.");
        // route them to waiting room (participant flow)
        router.replace(`/waiting-room/participant/${sessionId}`);
      } catch {}
    });

    // Participant removed (kicked)
    s.on("meeting:removed", () => {
      try {
        toast.error("You were removed from the meeting by the host.");
        router.replace(`/remove-participant`);
      } catch {}
    });

    // initial snapshot of observers
    s.emit(
      "observer:list:get",
      {},
      (resp?: { observers?: { name: string; email: string }[] }) => {
        setObserverList(Array.isArray(resp?.observers) ? resp!.observers! : []);
      }
    );

    // Request initial waiting list snapshot broadcast for seeding moderator toasts
    try {
      s.emit("join-room", {});
    } catch {}

    // Meeting end broadcast → route away
    const onMeetingEnded = () => {
      if (role === "observer") {
        router.replace(`/waiting-room/observer/${sessionId}`);
      } else if (role === "admin" || role === "moderator") {
        router.push("/projects");
      } else {
        router.replace("/meeting-ended");
      }
    };
    s.on("meeting:ended", onMeetingEnded);

    return () => {
      s.off("meeting:ended", onMeetingEnded);
      s.off("meeting:force-mute");
      s.off("meeting:force-camera-off");
      s.off("observer:list");
      s.disconnect();
    };
  }, [sessionId, my?.email, my?.name, serverRole, role, router]);

  // Clear local storage on browser/tab close for participants
  useEffect(() => {
    if (role !== "participant") return;
    const onBeforeUnload = () => {
      try {
        localStorage.removeItem("liveSessionUser");
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [role]);

  // If observer and stream stops, route back to observer waiting room
  useEffect(() => {
    if (role !== "observer") return;
    const s = window.__meetingSocket;
    if (!s) return;
    const onStopped = () => {
      toast.info(
        "Streaming stopped. You are being taken to the observation room."
      );
      router.replace(`/waiting-room/observer/${sessionId}`);
    };
    s.on("observer:stream:stopped", onStopped);
    return () => {
      s.off("observer:stream:stopped", onStopped);
    };
  }, [role, router, sessionId]);

  // Always-mounted bridge for moderator/admin: toast when participants join waiting room
  useEffect(() => {
    if (!(role === "moderator" || role === "admin")) return;
    const s = window.__meetingSocket;
    if (!s) return;
    let prev = new Set<string>();

    // seed once by requesting the list, reusing existing endpoint behavior
    s.emit("observer:list:get", {});

    const onWaitingList = (payload: {
      participantsWaitingRoom: { email?: string; name?: string }[];
    }) => {
      const next = payload?.participantsWaitingRoom || [];
      const nextSet = new Set(next.map((u) => (u.email || "").toLowerCase()));

      if (prev.size > 0) {
        for (const u of next) {
          const emailKey = (u.email || "").toLowerCase();
          if (!prev.has(emailKey)) {
            const label = u.name || u.email || "Someone";
            toast.success(`${label} joined the waiting room`);
          }
        }
      }
      prev = nextSet;
    };

    s.on("waiting:list", onWaitingList);
    return () => {
      s.off("waiting:list", onWaitingList);
    };
  }, [role]);

  // Observer toasts for admitted participants (single or all)
  useEffect(() => {
    if (role !== "observer") return;
    const s = window.__meetingSocket;
    if (!s) return;
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
      s.off("announce:participant:admitted", onOneAdmitted);
      s.off("announce:participants:admitted", onManyAdmitted);
    };
  }, [role]);

  // Observer view
  if (role === "observer") {
    return (
      <ObserverMeetingView
        sessionId={String(sessionId)}
        initialMainUrl={hlsUrl}
      />
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="grid grid-cols-12 gap-4 h-[100dvh] overflow-hidden p-4">
        <div className="col-span-12 m-auto text-gray-500">Connecting…</div>
      </div>
    );
  }

  // Note: right panel initial state derives from role; avoid conditional hooks after returns

  const mainColSpanClass =
    (isLeftOpen ? 1 : 0) + (role !== "participant" && isRightOpen ? 1 : 0) === 2
      ? "col-span-6"
      : (isLeftOpen ? 1 : 0) +
          (role !== "participant" && isRightOpen ? 1 : 0) ===
        1
      ? "col-span-9"
      : "col-span-12";

  return (
    <LiveKitRoom token={token} serverUrl={wsUrl}>
      <div className="relative grid grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4 h-[100dvh] overflow-hidden min-h-0  meeting_bg">
        {/* LEFT: moderator/participant sidebar (now inside room context) */}
        {isLeftOpen && (
          <aside className="relative col-span-3 h-full rounded-r-2xl p-2 overflow-y-auto overflow-x-hidden bg-white shadow">
            <button
              type="button"
              onClick={() => setIsLeftOpen(false)}
              className="absolute -right-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
              aria-label="Collapse left panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsWhiteboardOpen((v) => !v)}
              className="mb-2  cursor-pointer inline-flex w-[80%] items-center gap-3 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition"
              aria-label="Whiteboard"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-yellow-400">
                <PenTool className="h-3.5 w-3.5 text-white" />
              </span>
              <span>
                {isWhiteboardOpen ? "Close Whiteboard" : "Whiteboard"}
              </span>
            </button>

            {isWhiteboardOpen && (
              <div className="mb-3">
                <WhiteboardPanel
                  sessionId={String(sessionId)}
                  socket={socketRef.current}
                  role={serverRole}
                />
              </div>
            )}

            {(role === "admin" || role === "moderator") && (
              <button
                type="button"
                onClick={() => {
                  const s = socketRef.current;
                  if (!s || streamBusy !== null) return;
                  if (!isStreaming) {
                    setStreamBusy("start");
                    s.emit(
                      "meeting:stream:start",
                      {},
                      (ack?: { ok?: boolean; error?: string }) => {
                        setStreamBusy(null);
                        if (ack?.ok) {
                          setIsStreaming(true);
                          toast.success("Streaming started");
                        } else {
                          toast.error(
                            ack?.error || "Failed to start streaming"
                          );
                        }
                      }
                    );
                  } else {
                    setStreamBusy("stop");
                    s.emit(
                      "meeting:stream:stop",
                      {},
                      (ack?: { ok?: boolean; error?: string }) => {
                        setStreamBusy(null);
                        if (ack?.ok) {
                          setIsStreaming(false);
                          toast.success("Streaming stopped");
                        } else {
                          toast.error(ack?.error || "Failed to stop streaming");
                        }
                      }
                    );
                  }
                }}
                disabled={streamBusy !== null}
                className={`mb-3 inline-flex w-[80%] items-center gap-3 rounded-xl px-3 py-2 cursor-pointer text-sm transition  ${
                  streamBusy !== null
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-200"
                } bg-gray-100 text-gray-700`}
                aria-label={isStreaming ? "Stop Stream" : "Start Stream"}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-yellow-400">
                  {isStreaming ? (
                    <Square className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-white" />
                  )}
                </span>
                <span>{isStreaming ? "Stop Stream" : "Start Stream"}</span>
              </button>
            )}
            {featureFlags.breakoutsEnabled &&
              (role === "admin" || role === "moderator") && (
                <button
                  type="button"
                  onClick={() => setIsBreakoutOverlayOpen((v) => !v)}
                  className="mb-3 inline-flex w-[80%] items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-sm cursor-pointer text-gray-700 hover:bg-gray-200 transition"
                  aria-label={
                    isBreakoutOverlayOpen
                      ? "Close Breakout Panel"
                      : "Open Breakout Panel"
                  }
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-custom-dark-blue-1">
                    <LayoutGrid className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span>
                    {isBreakoutOverlayOpen
                      ? "Close Breakout Panel"
                      : "Open Breakout Panel"}
                  </span>
                </button>
              )}
            <div className="relative">
              {featureFlags.breakoutsEnabled &&
                (role === "admin" || role === "moderator") && (
                  <div
                    className={`absolute border inset-0 rounded-lg bg-white p-3 overflow-auto transition-opacity ${
                      isBreakoutOverlayOpen
                        ? "z-30 opacity-100"
                        : "z-[-1] opacity-0 pointer-events-none"
                    }`}
                    aria-hidden={!isBreakoutOverlayOpen}
                  >
                    <h4 className="font-semibold mb-2">Breakouts</h4>
                    <BreakoutsPanel sessionId={String(sessionId)} role={role} />
                  </div>
                )}
              <ParticipantsPanel
                role={role}
                socket={socketRef.current}
                myEmail={my?.email || null}
                sessionId={String(sessionId)}
              />
              <ModeratorWaitingPanel />
              {(role as UiRole) === "participant" && (
                <div className="mt-2">
                  <ParticipantChatPanel
                    socket={socketRef.current}
                    sessionId={String(sessionId)}
                    me={{ email: my.email, name: my.name, role: "Participant" }}
                  />
                </div>
              )}
              <div data-breakouts={featureFlags.breakoutsEnabled ? "1" : "0"} />
            </div>
          </aside>
        )}

        {!isLeftOpen && (
          <button
            type="button"
            onClick={() => setIsLeftOpen(true)}
            className="absolute -left-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
            aria-label="Expand left panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* MIDDLE: LiveKit room visuals */}
        <main
          className={`${mainColSpanClass} h-full min-h-0 overflow-hidden rounded p-3 flex flex-col`}
        >
          {/* Top header inside main area */}
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <span>On going meeting</span>
              </div>
              <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
                {role === "moderator"
                  ? "Moderator View"
                  : role === "admin"
                  ? "Admin View"
                  : "Participant View"}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Logo />
              <LeaveMeetingButton role={role} sessionId={String(sessionId)} />
            </div>
          </div>

          <div className="flex flex-col flex-1 min-h-0 lk-scope">
            <AutoPublishOnConnect role={role} />
            <SubscribeCameraBridge />
            <RegisterIdentityBridge
              socket={socketRef.current}
              email={my?.email || ""}
            />
            <MeetingJoinBridge socket={socketRef.current} />
            <BreakoutWarningBridge socket={socketRef.current} role={role} />
            <MeetingJoinBridge socket={socketRef.current} />
            <ForceMuteSelfBridge />
            <ForceCameraOffSelfBridge />
            <RoomAudioRenderer />
            <Stage role={role} />
            <div className="shrink-0 pt-2  gap-2">
              <ControlBar variation="minimal" controls={{ leave: false }} />
            </div>
          </div>
        </main>

        {/* RIGHT: observer chat/media hub — hide for participants. For participants, show their chat panel on the left sidebar above waiting room. */}
        {role !== "participant" && isRightOpen && (
          <MainRightSidebar
            setIsRightOpen={setIsRightOpen}
            isStreaming={isStreaming}
            observerCount={observerCount}
            observerList={observerList}
            sessionId={String(sessionId)}
            socket={socketRef.current}
            me={{ email: my.email, name: my.name, role: my.role }}
          />
        )}
      </div>
    </LiveKitRoom>
  );
}
