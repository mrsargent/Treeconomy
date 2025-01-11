'use client'
import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
  isSignedIn: boolean;
  email: string | null;
  address: string | null; // Adding the address field
  setSignInStatus: (signedIn: boolean, email?: string, address?: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children?: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<{ isSignedIn: boolean; email: string | null; address: string | null }>({
    isSignedIn: false,
    email: null,
    address: null,
  });

  const setSignInStatus = (signedIn: boolean, email: string | null = null, address: string | null = null) => {
    setAuthState({ isSignedIn: signedIn, email, address });
  };

  return (
    <AuthContext.Provider value={{ ...authState, setSignInStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};