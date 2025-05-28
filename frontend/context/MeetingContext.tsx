"use client";
import { IObserverWaitingUser } from "@shared/interface/LiveSessionInterface";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";



export interface MeetingContextValue {
  socket: Socket | null;

  joinRoom: (
    payload: { sessionId: string; name: string; email: string; role: "Observer" },
    cb: (data: { observers: IObserverWaitingUser[] }) => void
  ) => void;
  onObserverWaitingRoomUpdate: (handler: (list: IObserverWaitingUser[]) => void) => void;
  offObserverWaitingRoomUpdate: (handler: (list: IObserverWaitingUser[]) => void) => void;

}

const MeetingContext = createContext<MeetingContextValue | undefined>(
  undefined
);

export function useMeeting(): MeetingContextValue {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
}

type MeetingProviderProps = {
  children: ReactNode;

};

export function MeetingProvider({ children }: MeetingProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // 1️⃣ actually capture the return value of io()
    const s = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://bamplify.hgsingalong.com",
      {
        // any client options…
      }
    );
    // only once the client has actually connected will `s.id` be set
    s.on("connect", () => {
      // console.log("💡 initSocket connected, my id is", s.id);
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);


     const joinRoom: MeetingContextValue["joinRoom"] = (payload, cb) => {
    // Only emit if socket is ready
    socket?.emit("observer:join", payload, cb);
  };

  const onObserverWaitingRoomUpdate: MeetingContextValue["onObserverWaitingRoomUpdate"] = (
    handler
  ) => {
    socket?.on("observer:waiting_room_update", handler);
  };

  const offObserverWaitingRoomUpdate: MeetingContextValue["offObserverWaitingRoomUpdate"] = (
    handler
  ) => {
    socket?.off("observer:waiting_room_update", handler);
  };


  const value = useMemo<MeetingContextValue>(

    () => ({
      socket,
      joinRoom,
      onObserverWaitingRoomUpdate,
      offObserverWaitingRoomUpdate,
    }),
    [socket]
  );


  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}
