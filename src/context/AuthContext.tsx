'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamUser, UserRole } from '@/types';
import { store, INITIAL_USERS } from '@/lib/store';

interface AuthContextType {
  currentUser: TeamUser | null;
  setCurrentUser: (user: TeamUser) => void;
  switchUserByUid: (uid: string) => void;
  loginWithPassword: (
    identifier: string,
    passwordInput: string
  ) => { success: boolean; user?: TeamUser; error?: string };
  loginWithEmail: (email: string) => { success: boolean; user?: TeamUser; error?: string };
  grantUserAccount: (
    email: string,
    displayName: string,
    role: UserRole,
    password?: string
  ) => TeamUser;
  grantUserAccess: (email: string, displayName: string, role: UserRole) => TeamUser;
  updateUserRole: (uidOrEmail: string, role: UserRole) => void;
  updateUserPassword: (uidOrEmail: string, newPassword: string) => void;
  toggleUserActive: (uidOrEmail: string) => void;
  revokeUserAccess: (uidOrEmail: string) => void;
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
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('relio_user_email');
      if (!savedEmail) {
        setIsEmailModalOpen(true);
      }
    }
  }, []);

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
          return null;
        }
        const updated = users.find((u) => u.uid === prev.uid || u.email.toLowerCase() === prev.email.toLowerCase());
        return updated || prev;
      });
    });
    return () => unsub();
  }, []);

  const switchUserByUid = (uid: string) => {
    const target = availableUsers.find((u) => u.uid === uid || u.email.toLowerCase() === uid.toLowerCase());
    if (target) {
      setCurrentUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('relio_user_email', target.email.toLowerCase());
      }
    }
  };

  const loginWithPassword = (
    identifier: string,
    passwordInput: string
  ): { success: boolean; user?: TeamUser; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Match by full email, username (before @), or display name
    const user = availableUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.email.split('@')[0].toLowerCase() === cleanId ||
        u.displayName.toLowerCase() === cleanId
    );

    if (!user) {
      return {
        success: false,
        error: `Account "${identifier}" not found. Please verify your login credentials or ask an admin.`,
      };
    }

    if (user.password && user.password !== cleanPass) {
      return {
        success: false,
        error: 'Incorrect password. Please verify the password provided to you.',
      };
    }

    if (user.active === false || !user.role) {
      setCurrentUser(user);
      setIsEmailModalOpen(false);
      return {
        success: true,
        user,
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('relio_user_email', user.email.toLowerCase());
    }

    setCurrentUser(user);
    setIsEmailModalOpen(false);
    return { success: true, user };
  };

  const loginWithEmail = (email: string): { success: boolean; user?: TeamUser; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const user = availableUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.email.split('@')[0].toLowerCase() === cleanEmail ||
        u.displayName.toLowerCase() === cleanEmail
    );

    if (!user) {
      return {
        success: false,
        error: `Access Denied: "${cleanEmail}" has not been assigned an account. Please ask Charles or Danny in Settings.`,
      };
    }

    if (user.active === false || !user.role) {
      setCurrentUser(user);
      setIsEmailModalOpen(false);
      return {
        success: true,
        user,
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('relio_user_email', user.email.toLowerCase());
    }

    setCurrentUser(user);
    setIsEmailModalOpen(false);
    return { success: true, user };
  };

  const grantUserAccount = (
    email: string,
    displayName: string,
    role: UserRole,
    password?: string
  ): TeamUser => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = availableUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    const updatedUser: TeamUser = {
      uid: existing?.uid || `user-${Date.now().toString(36)}`,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      role,
      active: true,
      password: password?.trim() || `${displayName.toLowerCase().replace(/\s+/g, '')}2026`,
    };
    store.addUser(updatedUser);
    return updatedUser;
  };

  const grantUserAccess = (email: string, displayName: string, role: UserRole): TeamUser => {
    return grantUserAccount(email, displayName, role);
  };

  const updateUserRole = (uidOrEmail: string, role: UserRole) => {
    store.updateUserRole(uidOrEmail, role);
    if (
      currentUser &&
      (currentUser.uid === uidOrEmail || currentUser.email.toLowerCase() === uidOrEmail.toLowerCase())
    ) {
      setCurrentUser({ ...currentUser, role, active: true });
    }
  };

  const updateUserPassword = (uidOrEmail: string, newPassword: string) => {
    store.updateUserPassword(uidOrEmail, newPassword);
    if (
      currentUser &&
      (currentUser.uid === uidOrEmail || currentUser.email.toLowerCase() === uidOrEmail.toLowerCase())
    ) {
      setCurrentUser({ ...currentUser, password: newPassword });
    }
  };

  const toggleUserActive = (uidOrEmail: string) => {
    store.toggleUserActive(uidOrEmail);
  };

  const revokeUserAccess = (uidOrEmail: string) => {
    store.removeUser(uidOrEmail);
    if (
      currentUser &&
      (currentUser.uid === uidOrEmail || currentUser.email.toLowerCase() === uidOrEmail.toLowerCase())
    ) {
      logout();
    }
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
        loginWithPassword,
        loginWithEmail,
        grantUserAccount,
        grantUserAccess,
        updateUserRole,
        updateUserPassword,
        toggleUserActive,
        revokeUserAccess,
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
