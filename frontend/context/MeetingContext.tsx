"use client";
import React, { createContext, useContext, ReactNode, useMemo } from "react";

export interface MeetingContextValue {
  data: string;
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
  const value = useMemo<MeetingContextValue>(
    () => ({
      data: "test",
    }),
    []
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}
