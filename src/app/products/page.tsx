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

    store.addProduct(newProduct.trim());
    setNewProduct('');
    toast.success(`Product "${newProduct.trim()}" added.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans">
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-6xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-white" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Products &amp; Brands
              </h1>
              <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
                {settings.products.length} Products
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
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
                className="flex-1 sm:flex-none rounded-md border border-[#262626] bg-black py-1.5 px-3 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="vercel-btn-primary flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-black" />
                <span>Add Product</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.products.map((prod) => {
            const prodCampaigns = campaigns.filter((c) => c.product === prod);
            const prodTasks = tasks.filter((t) => t.product === prod && t.status !== 'CANCELLED');

            return (
              <div
                key={prod}
                className="vercel-card p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3 mb-3">
                    <h3 className="text-base font-bold text-white">
                      {prod}
                    </h3>
                    <span className="rounded bg-[#141414] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
                      {prodCampaigns.length} campaigns
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">
                      Active Campaigns:
                    </span>
                    {prodCampaigns.length === 0 ? (
                      <p className="text-zinc-500 italic">No campaigns launched yet.</p>
                    ) : (
                      prodCampaigns.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between font-mono text-[11px] p-2 rounded-md bg-black border border-[#222222]"
                        >
                          <span className="font-bold text-white truncate max-w-[160px]">{c.name}</span>
                          <span className="text-[10px] text-zinc-400 inline-flex items-center gap-1.5 font-mono shrink-0">
                            <span>{c.adAccount}</span>
                            <MarketBadge market={c.market} size="xs" />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1f1f1f] flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    {prodTasks.length} total tasks
                  </span>
                  <Link
                    href={`/?product=${prod}`}
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
