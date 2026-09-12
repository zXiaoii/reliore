'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Lock,
  User,
  ArrowRight,
  X,
  Check,
  Flame,
  Palette,
  LayoutGrid,
  Shield,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const EmailAccessModal: React.FC = () => {
  const {
    currentUser,
    loginWithPassword,
    isEmailModalOpen,
    setIsEmailModalOpen,
    availableUsers,
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState(true);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

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

  const handleQuickFill = (email: string, pass?: string) => {
    setIdentifierInput(email);
    setPasswordInput(pass || 'ops2026');
    setAuthError(null);
  };

  const handleCopyCredentials = (u: typeof availableUsers[0]) => {
    const text = `Relio Ops Access:\nLogin: ${u.email} (or ${u.displayName.toLowerCase()})\nPassword: ${u.password || 'ops2026'}\nRole: ${u.role?.toUpperCase().replace('_', ' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedUid(u.uid);
    toast.success(`Copied login credentials for ${u.displayName}!`);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const setupUsers = availableUsers.filter((u) => u.role === 'setup');
  const creativeUsers = availableUsers.filter((u) => u.role === 'creative');
  const mediaBuyerUsers = availableUsers.filter((u) => u.role === 'media_buyer' || u.role === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a2a2a] bg-[#0c0c0c] p-6 text-white shadow-2xl my-8">
        {/* Close Button (if already logged in) */}
        {currentUser && (
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              setIsEmailModalOpen(false);
            }}
            className="absolute right-4 top-4 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#1f1f1f] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#262626] to-[#121212] border border-[#383838]">
            <Lock className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Sign In to Operations Workspace
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter your account username/email and assigned password.
            </p>
          </div>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
            <p className="font-semibold">{authError}</p>
          </div>
        )}

        {/* Direct Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-1">
              Email or Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. karl@operations.internal or karl"
                value={identifierInput}
                onChange={(e) => {
                  setIdentifierInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="w-full rounded-lg border border-[#2a2a2a] bg-black pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="w-full rounded-lg border border-[#2a2a2a] bg-black pl-9 pr-10 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full vercel-btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold cursor-pointer rounded-lg mt-2"
          >
            <span>Sign In to Dedicated Queue</span>
            <ArrowRight className="h-4 w-4 text-black" />
          </button>
        </form>

        {/* Collapsible Admin Credential Sheet (To Give to Each Member) */}
        <div className="mt-5 border-t border-[#1f1f1f] pt-4">
          <button
            type="button"
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">
                Team Passwords &amp; Login List (To Give to Members)
              </span>
            </div>
            {showCheatSheet ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>

          {showCheatSheet && (
            <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-150">
              <p className="text-[11px] text-zinc-400">
                Click <strong>Fill</strong> to test login, or click <strong>Copy</strong> to send credentials to each person:
              </p>

              {/* Setup Queue */}
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-400 font-mono flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    <span>Setup Queue (Karl, Mark, Christian)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Only sees /setup</span>
                </div>
                <div className="space-y-1.5">
                  {setupUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between rounded-lg bg-black/60 border border-[#222] p-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.displayName}</span>
                          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/25">
                            {u.role?.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          Login: <strong className="text-zinc-200">{u.displayName.toLowerCase()}</strong> (or {u.email})
                          {' · '}Pass: <strong className="text-amber-300">{u.password || 'karl2026'}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickFill(u.email, u.password)}
                          className="px-2 py-1 rounded bg-[#202020] hover:bg-[#303030] text-[11px] font-mono text-zinc-300 font-medium cursor-pointer"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(u)}
                          className="p-1 rounded bg-[#202020] hover:bg-[#303030] text-zinc-300 hover:text-white cursor-pointer"
                          title="Copy login info"
                        >
                          {copiedUid === u.uid ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creative Queue & Media Buyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Creative */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-400 font-mono flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    <span>Creative Queue</span>
                  </span>
                  {creativeUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="rounded-lg bg-black/60 border border-[#222] p-2 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          Pass: <strong className="text-amber-300">{u.password || 'yzah2026'}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickFill(u.email, u.password)}
                          className="px-2 py-0.5 rounded bg-[#202020] text-[10px] font-mono text-zinc-300 cursor-pointer"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(u)}
                          className="p-1 rounded bg-[#202020] text-zinc-300 cursor-pointer"
                        >
                          {copiedUid === u.uid ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Media Buyer & Admin */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-blue-400 font-mono flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3" />
                    <span>Media Buyer &amp; Admin</span>
                  </span>
                  {mediaBuyerUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="rounded-lg bg-black/60 border border-[#222] p-2 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{u.displayName} ({u.role === 'admin' ? 'Admin' : 'Buyer'})</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          Pass: <strong className="text-amber-300">{u.password || 'buyer2026'}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickFill(u.email, u.password)}
                          className="px-2 py-0.5 rounded bg-[#202020] text-[10px] font-mono text-zinc-300 cursor-pointer"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(u)}
                          className="p-1 rounded bg-[#202020] text-zinc-300 cursor-pointer"
                        >
                          {copiedUid === u.uid ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer session info */}
        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-[11px] text-zinc-500">
          <span>Remembered on this browser via secure local session.</span>
          {currentUser && (
            <span className="text-zinc-400 font-mono">
              Active: <strong>{currentUser.displayName}</strong> ({currentUser.role?.toUpperCase()})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
