'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

// Define the shape for dashboard stats (customize as needed)
type Stats = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

type DashboardContextType = {
  stats: Stats
  updateStats: (newStats: Stats) => void
  viewProject: boolean
  setViewProject: React.Dispatch<React.SetStateAction<boolean>>
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
)

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

type DashboardProviderProps = {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [stats, setStats] = useState<Stats>({})
  const [viewProject, setViewProject] = useState(false)

  const updateStats = (newStats: Stats) => {
    setStats(newStats)
  }

  const contextValue: DashboardContextType = {
    stats,
    updateStats,
    viewProject,
    setViewProject,
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}
