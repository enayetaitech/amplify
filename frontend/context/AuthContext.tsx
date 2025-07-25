"use client"
import api from 'lib/api';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a User type
type User = {
  name: string;
  email?: string;
};

interface LoginResponse {
  user: User;
}
// Define the shape of the context
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    setUser(data.user);
  };

  const logout = async  () => {
    await api.post<null>("/auth/logout");
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
