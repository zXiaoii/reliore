'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserRole } from '@/types';
import {
  Mail,
  ArrowRight,
  Sparkles,
  X,
  Check,
  Flame,
  Palette,
  LayoutGrid,
  Shield,
  User,
} from 'lucide-react';

export const EmailAccessModal: React.FC = () => {
  const {
    currentUser,
    loginWithEmail,
    isEmailModalOpen,
    setIsEmailModalOpen,
    availableUsers,
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('setup');
  const [displayNameInput, setDisplayNameInput] = useState('');

  if (!isEmailModalOpen) return null;

  const handleSignIn = (emailToUse: string, roleToUse?: UserRole, nameToUse?: string) => {
    const trimmed = emailToUse.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Please enter a valid email address (e.g. name@company.com)');
      return;
    }

    const user = loginWithEmail(trimmed, nameToUse, roleToUse);
    toast.success(`Welcome ${user.displayName}! Signed in with ${user.email}`);

    // Direct user straight to their relevant workspace queue
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
    handleSignIn(emailInput, selectedRole, displayNameInput);
  };

  const setupUsers = availableUsers.filter((u) => u.role === 'setup');
  const creativeUsers = availableUsers.filter((u) => u.role === 'creative');
  const mediaBuyerUsers = availableUsers.filter((u) => u.role === 'media_buyer' || u.role === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a2a2a] bg-[#0c0c0c] p-6 text-white shadow-2xl">
        {/* Close Button (if already logged in) */}
        {currentUser && (
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(false)}
            className="absolute right-4 top-4 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#1f1f1f] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#262626] to-[#121212] border border-[#383838]">
            <Mail className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Access Media Ops Workspace
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter your email to sign in and view your dedicated queue.
            </p>
          </div>
        </div>

        {/* 1. Quick 1-Click Team Member Selection */}
        <div className="mt-5 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">
            1-Click Access (Team Members)
          </span>

          {/* Setup Queue Team */}
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5 font-mono">
                <Flame className="h-3.5 w-3.5" />
                <span>Setup Queue Team (Meta Ad Set Launchers)</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Only sees Setup Queue</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {setupUsers.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleSignIn(u.email, 'setup', u.displayName)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    currentUser?.email === u.email
                      ? 'bg-teal-500/20 border-teal-500 text-white font-bold'
                      : 'bg-black/60 border-[#262626] text-zinc-300 hover:border-teal-500/50 hover:bg-teal-500/10'
                  }`}
                >
                  <span className="text-xs font-bold">{u.displayName}</span>
                  <span className="text-[10px] font-mono text-zinc-500 truncate w-full">
                    {u.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Creative Queue Team & Media Buyers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Creative Queue */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5 font-mono">
                <Palette className="h-3.5 w-3.5" />
                <span>Creative Queue</span>
              </span>
              <div className="flex flex-col gap-1.5">
                {creativeUsers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => handleSignIn(u.email, 'creative', u.displayName)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      currentUser?.email === u.email
                        ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                        : 'bg-black/60 border-[#262626] text-zinc-300 hover:border-purple-500/50 hover:bg-purple-500/10'
                    }`}
                  >
                    <span className="font-bold">{u.displayName}</span>
                    <span className="font-mono text-[10px] text-purple-300">Creative Only</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Media Buying Team */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 font-mono">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Media Buyers &amp; Admin</span>
              </span>
              <div className="flex flex-col gap-1.5">
                {mediaBuyerUsers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => handleSignIn(u.email, u.role || 'media_buyer', u.displayName)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      currentUser?.email === u.email
                        ? 'bg-blue-500/20 border-blue-500 text-white font-bold'
                        : 'bg-black/60 border-[#262626] text-zinc-300 hover:border-blue-500/50 hover:bg-blue-500/10'
                    }`}
                  >
                    <span className="font-bold">{u.displayName}</span>
                    <span className="font-mono text-[10px] text-blue-300">Full Access</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Custom Email Input Form */}
        <div className="mt-5 pt-4 border-t border-[#1f1f1f]">
          <form onSubmit={handleSubmit} className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">
              Or Enter Any Email Address
            </span>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your.name@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-black px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="vercel-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer shrink-0"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </button>
            </div>

            {/* If entering custom email, pick role */}
            {emailInput.trim() && (
              <div className="pt-2">
                <span className="text-[10px] text-zinc-400 font-mono block mb-1.5">
                  Select your role for this email:
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('setup')}
                    className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                      selectedRole === 'setup'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-black border-[#262626] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Setup Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('creative')}
                    className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                      selectedRole === 'creative'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-black border-[#262626] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Creative Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('media_buyer')}
                    className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                      selectedRole === 'media_buyer'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-black border-[#262626] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Media Buyer
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-[11px] text-zinc-500">
          <span>Remembered on this browser via secure local session.</span>
          {currentUser && (
            <span className="text-zinc-400 font-mono">
              Current: <strong>{currentUser.email}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
