'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamUser, UserRole } from '@/types';
import { store, INITIAL_USERS } from '@/lib/store';

interface AuthContextType {
  currentUser: TeamUser | null;
  setCurrentUser: (user: TeamUser) => void;
  switchUserByUid: (uid: string) => void;
  loginWithEmail: (email: string, displayName?: string, role?: UserRole) => TeamUser;
  logout: () => void;
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (open: boolean) => void;
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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const unsub = store.subscribeUsers((users) => {
      setAvailableUsers(users);
      setCurrentUser((prev) => {
        if (!prev) {
          const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('relio_user_email') : null;
          if (savedEmail) {
            const matched = users.find((u) => u.email.toLowerCase() === savedEmail.toLowerCase());
            if (matched) return matched;
          }
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('relio_user_email', target.email.toLowerCase());
      }
    }
  };

  const loginWithEmail = (email: string, customDisplayName?: string, customRole?: UserRole): TeamUser => {
    const cleanEmail = email.trim().toLowerCase();
    let user = availableUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Auto-assign smart default name & role
      const defaultName =
        customDisplayName ||
        cleanEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      let deducedRole: UserRole = customRole || 'setup';
      if (cleanEmail.includes('charles') || cleanEmail.includes('media') || cleanEmail.includes('buyer')) {
        deducedRole = 'media_buyer';
      } else if (cleanEmail.includes('yzah') || cleanEmail.includes('creative') || cleanEmail.includes('video')) {
        deducedRole = 'creative';
      } else if (cleanEmail.includes('danny') || cleanEmail.includes('admin')) {
        deducedRole = 'admin';
      }

      const newUser: TeamUser = {
        uid: `user-${Date.now().toString(36)}`,
        email: cleanEmail,
        displayName: defaultName,
        role: deducedRole,
        active: true,
      };

      store.addUser(newUser);
      user = newUser;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('relio_user_email', cleanEmail);
    }

    setCurrentUser(user);
    setIsEmailModalOpen(false);
    return user;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('relio_user_email');
    }
    setIsEmailModalOpen(true);
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
        loginWithEmail,
        logout,
        isEmailModalOpen,
        setIsEmailModalOpen,
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
