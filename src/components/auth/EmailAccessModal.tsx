'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react';

export const EmailAccessModal: React.FC = () => {
  const {
    loginWithPassword,
    isEmailModalOpen,
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isEmailModalOpen) return null;

  const handleLogin = (idToUse: string, passToUse: string) => {
    setAuthError(null);
    const cleanId = idToUse.trim();
    const cleanPass = passToUse.trim();

    if (!cleanId) {
      toast.error('Please enter your email or username');
      return;
    }
    if (!cleanPass) {
      toast.error('Please enter your password');
      return;
    }

    const res = loginWithPassword(cleanId, cleanPass);
    if (!res.success || !res.user) {
      const errMsg = res.error || 'Invalid credentials. Please verify your username and password.';
      setAuthError(errMsg);
      toast.error(errMsg);
      return;
    }

    const user = res.user;
    toast.success(`Welcome, ${user.displayName}! Signed in with ${user.role?.toUpperCase().replace('_', ' ')} access.`);

    // Route user to their dedicated role queue
    if (user.role === 'setup') {
      router.push('/setup');
    } else if (user.role === 'creative') {
      router.push('/creative');
    } else {
      router.push('/');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(identifierInput, passwordInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Lock className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Sign in to your account to continue
            </p>
          </div>
        </div>

        {authError && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            <p>{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-300">
              Email or Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="name@example.com"
                value={identifierInput}
                onChange={(e) => {
                  setIdentifierInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-300">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 h-9 px-4 py-2 w-full mt-2 cursor-pointer"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};
