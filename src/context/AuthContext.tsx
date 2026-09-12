'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamUser, UserRole } from '@/types';
import { store, INITIAL_USERS } from '@/lib/store';

interface AuthContextType {
  currentUser: TeamUser | null;
  setCurrentUser: (user: TeamUser) => void;
  switchUserByUid: (uid: string) => void;
  availableUsers: TeamUser[];
  role: UserRole;
  isActive: boolean;
  isAdmin: boolean;
  isMediaBuyer: boolean;
  isCreative: boolean;
  isSetup: boolean;
  isPendingAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [availableUsers, setAvailableUsers] = useState<TeamUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<TeamUser | null>(null);

  useEffect(() => {
    const unsub = store.subscribeUsers((users) => {
      setAvailableUsers(users);
      setCurrentUser((prev) => {
        if (!prev) {
          // Default to Charles (Media Buyer)
          const charles = users.find((u) => u.uid === 'charles-01') || users[0];
          return charles;
        }
        const updated = users.find((u) => u.uid === prev.uid);
        return updated || prev;
      });
    });
    return () => unsub();
  }, []);

  const switchUserByUid = (uid: string) => {
    const target = availableUsers.find((u) => u.uid === uid);
    if (target) {
      setCurrentUser(target);
    }
  };

  const role = currentUser?.role ?? null;
  const isActive = currentUser?.active ?? false;
  const isAdmin = role === 'admin';
  const isMediaBuyer = role === 'media_buyer' || isAdmin;
  const isCreative = role === 'creative' || isAdmin;
  const isSetup = role === 'setup' || isAdmin;
  const isPendingAccess = !role || !isActive;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUserByUid,
        availableUsers,
        role,
        isActive,
        isAdmin,
        isMediaBuyer,
        isCreative,
        isSetup,
        isPendingAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
