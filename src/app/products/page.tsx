'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import { Package, Plus, Layers, ArrowRight } from 'lucide-react';
import { MarketBadge } from '@/components/common/MarketBadge';
import Link from 'next/link';

export default function ProductsPage() {
  const { settings, campaigns, tasks, store } = usePipeline();
  const { isPendingAccess, isMediaBuyer } = useAuth();
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState('');

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.trim()) return;
    if (settings.products.includes(newProduct.trim())) {
      toast.error('Product already exists.');
      return;
    }

    store.subscribeSettings(() => {}); // trigger update
    settings.products = [newProduct.trim(), ...settings.products];
    setNewProduct('');
    toast.success(`Product "${newProduct.trim()}" added.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="border-b border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-zinc-900 dark:text-white" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Products & Brands
              </h1>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {settings.products.length} Products
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Active direct-response product lines and their associated campaigns.
            </p>
          </div>

          {isMediaBuyer && (
            <form onSubmit={handleAddProduct} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="New product name..."
                className="flex-1 sm:flex-none rounded-md border border-zinc-300 bg-white py-1.5 px-3 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-6 max-w-6xl w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.products.map((prod) => {
            const prodCampaigns = campaigns.filter((c) => c.product === prod);
            const prodTasks = tasks.filter((t) => t.product === prod && t.status !== 'CANCELLED');

            return (
              <div
                key={prod}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800 mb-3">
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {prod}
                    </h3>
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {prodCampaigns.length} campaigns
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Active Campaigns:
                    </span>
                    {prodCampaigns.length === 0 ? (
                      <p className="text-zinc-400 italic">No campaigns launched yet.</p>
                    ) : (
                      prodCampaigns.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between font-mono text-[11px] p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60"
                        >
                          <span className="font-bold text-teal-800 dark:text-teal-300">{c.name}</span>
                          <span className="text-[10px] text-zinc-500 inline-flex items-center gap-1.5 font-mono">
                            <span>{c.adAccount}</span>
                            <MarketBadge market={c.market} size="xs" />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    {prodTasks.length} total tasks
                  </span>
                  <Link
                    href={`/?product=${prod}`}
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
