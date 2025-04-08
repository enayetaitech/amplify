"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

// Define a User type
export interface User {
  _id: string;
  email: string;
  [key: string]: any; // For any other user properties
}

// Define the shape of the context value
type GlobalContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
};

// Create context with a default value that matches the type
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Custom hook for consuming the context
export function useGlobalContext(): GlobalContextType {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
}

type GlobalProviderProps = {
  children: ReactNode;
};

export function GlobalProvider({ children }: GlobalProviderProps) {
  // Initialize user state with null or check localStorage
  const [user, setUser] = useState<User | null>(() => {
    // Check if we're in the browser and if there's a user in localStorage
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const contextValue: GlobalContextType = {
    user,
    setUser,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}
