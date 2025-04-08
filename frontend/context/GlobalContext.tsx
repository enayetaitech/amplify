"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { IUser } from "../../shared/interface/user.interface";

type GlobalContextType = {
  user: IUser | null;
  token: string | null;
  setUser: Dispatch<SetStateAction<IUser | null>>;
  setToken: Dispatch<SetStateAction<string | null>>;
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
  const [user, setUser] = useState<IUser | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || null;
    }
    return null;
  });

  const value: GlobalContextType = {
    user,
    token,
    setUser,
    setToken,
  };

  return (
    <GlobalContext.Provider  value={value}>
      {children}
    </GlobalContext.Provider>
  );
}
