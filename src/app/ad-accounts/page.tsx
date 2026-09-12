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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="border-b border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-900 dark:text-white" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Ad Accounts Directory
              </h1>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {settings.adAccounts.length} Accounts
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
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
                className="flex-1 sm:flex-none rounded-md border border-zinc-300 bg-white py-1.5 px-3 text-xs font-mono uppercase text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Account</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-6 max-w-6xl w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.adAccounts.map((acc) => {
            const accCampaigns = campaigns.filter((c) => c.adAccount === acc);
            const accTasks = tasks.filter((t) => t.adAccount === acc && t.status !== 'CANCELLED');

            return (
              <div
                key={acc}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800 mb-3">
                    <h3 className="text-base font-mono font-extrabold text-zinc-900 dark:text-white">
                      {acc}
                    </h3>
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {accCampaigns.length} campaigns
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Campaigns on this Account:
                    </span>
                    {accCampaigns.length === 0 ? (
                      <p className="text-zinc-400 italic">No active campaigns running.</p>
                    ) : (
                      accCampaigns.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between font-mono text-[11px] p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60"
                        >
                          <span className="font-bold text-teal-800 dark:text-teal-300">{c.name}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{c.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    {accTasks.length} total tasks
                  </span>
                  <Link
                    href={`/?adAccount=${acc}`}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
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
