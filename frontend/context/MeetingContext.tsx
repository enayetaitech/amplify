"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";

// context value
interface MeetingContextValue {
  socket: Socket | null;
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
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8008",
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

  const contextValue = useMemo(
    () => ({
      socket,
    }),
    [socket]
  );

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
}
