"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context value
type GlobalContextType = {
  user: string | null,

};

// Create context with an undefined default
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Custom hook for consuming the context
export function useGlobal(): GlobalContextType {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}

type GlobalProviderProps = {
  children: ReactNode;
};

export function GlobalProvider({ children }: GlobalProviderProps) {
 
  const [user, setUser] = useState(null)

  

  const contextValue: GlobalContextType = {
   user, setUser
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}
