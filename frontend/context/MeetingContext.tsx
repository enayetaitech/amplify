"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a Meeting type (customize the properties as needed)
type Meeting = {
  id: string;
  topic: string;
} | null;

type MeetingContextType = {
  meeting: Meeting;
  startMeeting: (meetingData: Exclude<Meeting, null>) => void;
  endMeeting: () => void;
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function useMeeting(): MeetingContextType {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}

type MeetingProviderProps = {
  children: ReactNode;
};

export function MeetingProvider({ children }: MeetingProviderProps) {
  const [meeting, setMeeting] = useState<Meeting>(null);

  const startMeeting = (meetingData: Exclude<Meeting, null>) => {
    setMeeting(meetingData);
  };

  const endMeeting = () => {
    setMeeting(null);
  };

  const contextValue: MeetingContextType = {
    meeting,
    startMeeting,
    endMeeting,
  };

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
}
