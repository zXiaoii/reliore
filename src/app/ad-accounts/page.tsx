'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import { CreditCard, Plus, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdAccountsPage() {
  const { settings, campaigns, tasks, store } = usePipeline();
  const { isPendingAccess, isMediaBuyer } = useAuth();
  const { toast } = useToast();

  const [newAccount, setNewAccount] = useState('');

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.trim()) return;
    const clean = newAccount.trim().toUpperCase();
    if (settings.adAccounts.includes(clean)) {
      toast.error('Ad Account already registered.');
      return;
    }

    settings.adAccounts = [clean, ...settings.adAccounts];
    setNewAccount('');
    toast.success(`Ad Account "${clean}" added.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans">
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-6xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Ad Accounts Directory
              </h1>
              <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
                {settings.adAccounts.length} Accounts
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Typeable ad accounts across markets (CA, UK, US, AUS) with assigned campaigns and spend.
            </p>
          </div>

          {isMediaBuyer && (
            <form onSubmit={handleAddAccount} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                placeholder="e.g. CA AD 25 or RL-06"
                className="flex-1 sm:flex-none rounded-md border border-[#262626] bg-black py-1.5 px-3 text-xs font-mono uppercase text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="vercel-btn-primary flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-black" />
                <span>Add Account</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.adAccounts.map((acc) => {
            const accCampaigns = campaigns.filter((c) => c.adAccount === acc);
            const accTasks = tasks.filter((t) => t.adAccount === acc && t.status !== 'CANCELLED');

            return (
              <div
                key={acc}
                className="vercel-card p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3 mb-3">
                    <h3 className="text-base font-mono font-bold text-white">
                      {acc}
                    </h3>
                    <span className="rounded bg-[#141414] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
                      {accCampaigns.length} campaigns
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">
                      Campaigns on this Account:
                    </span>
                    {accCampaigns.length === 0 ? (
                      <p className="text-zinc-500 italic">No active campaigns running.</p>
                    ) : (
                      accCampaigns.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between font-mono text-[11px] p-2 rounded-md bg-black border border-[#222222]"
                        >
                          <span className="font-bold text-white truncate max-w-[170px]">{c.name}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold">{c.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1f1f1f] flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    {accTasks.length} total tasks
                  </span>
                  <Link
                    href={`/?adAccount=${acc}`}
                    className="vercel-btn-secondary inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>View Tasks</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
