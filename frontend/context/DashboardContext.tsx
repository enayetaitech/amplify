"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape for dashboard stats (customize as needed)
type Stats = {
  [key: string]: any;
};

type DashboardContextType = {
  stats: Stats;
  updateStats: (newStats: Stats) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

type DashboardProviderProps = {
  children: ReactNode;
};

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [stats, setStats] = useState<Stats>({});

  const updateStats = (newStats: Stats) => {
    setStats(newStats);
  };

  const contextValue: DashboardContextType = {
    stats,
    updateStats,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
