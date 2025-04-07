
import { AuthProvider } from 'context/AuthContext';
import { DashboardProvider } from 'context/DashboardContext';
import { GlobalProvider } from 'context/GlobalContext';
import { MeetingProvider } from 'context/MeetingContext';
import React, { ReactNode } from 'react';


type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <GlobalProvider>
      <AuthProvider>
        <DashboardProvider>
          <MeetingProvider>
            {children}
          </MeetingProvider>
        </DashboardProvider>
      </AuthProvider>
    </GlobalProvider>
  );
}
