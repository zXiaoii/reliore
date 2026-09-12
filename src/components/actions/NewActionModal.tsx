'use client';

import React, { useState } from 'react';
import {
  CampaignAction,
  Market,
  Priority,
  CreativeRequestType,
} from '@/types';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatTaskNumber } from '@/lib/pipeline';
import {
  X,
  Plus,
  Flame,
  Clock,
  Sparkles,
  Layers,
  Send,
  Zap,
} from 'lucide-react';

interface NewActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAction?: CampaignAction;
  defaultCampaign?: string;
  defaultProduct?: string;
}

export const NewActionModal: React.FC<NewActionModalProps> = ({
  isOpen,
  onClose,
  defaultAction = 'ADD NEW AD SET',
  defaultCampaign,
  defaultProduct,
}) => {
  const { campaigns, settings, store } = usePipeline();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [action, setAction] = useState<CampaignAction>(defaultAction);
  const [product, setProduct] = useState(defaultProduct || 'FlexiVita');
  const [campaign, setCampaign] = useState(defaultCampaign || 'CBO FlexiVita 3');
  const [market, setMarket] = useState<Market>('CA');
  const [adAccount, setAdAccount] = useState('CA AD 24');
  const [priority, setPriority] = useState<Priority>('P1');
  const [deadline, setDeadline] = useState('Today 6 PM');

  // Creative requirements multi-select (§8)
  const [selectedCreativeTypes, setSelectedCreativeTypes] = useState<string[]>([
    'SWIPES',
    'PLAYBOOK CONCEPTS',
  ]);
  const [quantity, setQuantity] = useState(8);
  const [creativeAssignedTo, setCreativeAssignedTo] = useState('Yzah');
  const [setupAssignedTo, setSetupAssignedTo] = useState('Karl');

  // Brief details (§18)
  const [reasonTrigger, setReasonTrigger] = useState('Add New Ad Set to Winning CBO');
  const [winningReference, setWinningReference] = useState('');
  const [winningHook, setWinningHook] = useState('');
  const [winningAngle, setWinningAngle] = useState('');
  const [whatToKeep, setWhatToKeep] = useState('Hook, Offer, Core copy');
  const [whatToChange, setWhatToChange] = useState('Visual execution, safe-zone framing');
  const [format, setFormat] = useState('9:16 Video');

  if (!isOpen) return null;

  const toggleCreativeType = (type: string) => {
    setSelectedCreativeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCampaignSelect = (campName: string) => {
    setCampaign(campName);
    const existing = campaigns.find((c) => c.name === campName);
    if (existing) {
      setProduct(existing.product);
      setMarket(existing.market);
      setAdAccount(existing.adAccount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!product.trim() || !campaign.trim() || !adAccount.trim()) {
      toast.error('Please enter Product, Campaign Name, and Ad Account.');
      return;
    }

    if (selectedCreativeTypes.length === 0) {
      toast.error('Please select at least one creative requirement.');
      return;
    }

    const newTask = store.createActionTask({
      product: product.trim(),
      campaign: campaign.trim(),
      action,
      market,
      adAccount: adAccount.trim().toUpperCase(),
      priority,
      deadline: deadline.trim() || 'Today 6 PM',
      creativeTypes: selectedCreativeTypes,
      quantity: Number(quantity) || 8,
      creativeAssignedTo,
      setupAssignedTo,
      reasonTrigger: reasonTrigger.trim(),
      winningReference: winningReference.trim(),
      winningHook: winningHook.trim(),
      winningAngle: winningAngle.trim(),
      whatToKeep: whatToKeep.trim(),
      whatToChange: whatToChange.trim(),
      format,
      createdBy: currentUser?.uid || 'charles-01',
    });

    toast.success(
      `Task ${formatTaskNumber(newTask.taskNumber)} created: ${action} for ${campaign}! Assigned to ${creativeAssignedTo}.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                + New Action Task
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Media Buyer (Charles): Rapid task creator for campaigns, ad sets, and creative batches.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Action Selector (§7) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
              1. Choose Action Type
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as CampaignAction)}
              style={{ colorScheme: 'dark' }}
              className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white [color-scheme:dark]"
            >
              {settings.campaignActions.map((act) => (
                <option key={act} value={act} className="bg-zinc-900 text-zinc-100 py-1">
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Product & Campaign Selection (§5 & §6) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Product
              </label>
              <input
                type="text"
                list="products-list"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. FlexiVita"
                className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <datalist id="products-list">
                {settings.products.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Campaign Name
              </label>
              <input
                type="text"
                list="campaigns-list"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="e.g. CBO FlexiVita 3"
                className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <datalist id="campaigns-list">
                {campaigns.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Market, Ad Account, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Market
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as Market)}
                style={{ colorScheme: 'dark' }}
                className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white [color-scheme:dark]"
              >
                <option value="CA" className="bg-zinc-900 text-zinc-100 py-1">🇨🇦 Canada (CA)</option>
                <option value="UK" className="bg-zinc-900 text-zinc-100 py-1">🇬🇧 United Kingdom (UK)</option>
                <option value="US" className="bg-zinc-900 text-zinc-100 py-1">🇺🇸 United States (US)</option>
                <option value="AUS" className="bg-zinc-900 text-zinc-100 py-1">🇦🇺 Australia (AUS)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Ad Account
              </label>
              <input
                type="text"
                list="ad-accounts-list"
                value={adAccount}
                onChange={(e) => setAdAccount(e.target.value)}
                placeholder="e.g. CA AD 24"
                className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <datalist id="ad-accounts-list">
                {settings.adAccounts.map((acc) => (
                  <option key={acc} value={acc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setPriority('P1')}
                  className={`py-1.5 rounded text-[11px] font-extrabold transition-all ${
                    priority === 'P1'
                      ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  🔥 P1
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('P2')}
                  className={`py-1.5 rounded text-[11px] font-bold transition-all ${
                    priority === 'P2'
                      ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  ⏱️ P2
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('P3')}
                  className={`py-1.5 rounded text-[11px] font-semibold transition-all ${
                    priority === 'P3'
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  📦 P3
                </button>
              </div>
            </div>
          </div>

          {/* Creative Requirement Multi-Select (§8) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
              Creative Requirements (Multi-Select Allowed)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
              {settings.creativeRequestTypes.map((type) => {
                const isSelected = selectedCreativeTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCreativeType(type)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-2xs scale-[1.02]'
                        : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {isSelected ? `✓ ${type}` : `+ ${type}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignees, Quantity, Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Creative Owner
              </label>
              <select
                value={creativeAssignedTo}
                onChange={(e) => setCreativeAssignedTo(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-bold text-purple-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-purple-300 [color-scheme:dark]"
              >
                <option value="Yzah" className="bg-zinc-900 text-zinc-100 py-1">Yzah (Primary)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Setup Owner
              </label>
              <select
                value={setupAssignedTo}
                onChange={(e) => setSetupAssignedTo(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-bold text-teal-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-teal-300 [color-scheme:dark]"
              >
                <option value="Karl" className="bg-zinc-900 text-zinc-100 py-1">Karl</option>
                <option value="Mark" className="bg-zinc-900 text-zinc-100 py-1">Mark</option>
                <option value="Christian" className="bg-zinc-900 text-zinc-100 py-1">Christian</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Deadline
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Today 6 PM"
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Creative Brief Details (§18: What to make, Why, Reference, Hook, What to keep/change) */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Creative Brief Details (For Yzah)
            </span>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                Why / Reason / Trigger
              </label>
              <input
                type="text"
                value={reasonTrigger}
                onChange={(e) => setReasonTrigger(e.target.value)}
                placeholder="e.g. 1 Day After Swipe Batch Launch / Scaling Winning Angle"
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  Winning Reference Link or Asset
                </label>
                <input
                  type="text"
                  value={winningReference}
                  onChange={(e) => setWinningReference(e.target.value)}
                  placeholder="e.g. CA AD14 Creative 03 or URL"
                  className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  Winning Hook / Angle
                </label>
                <input
                  type="text"
                  value={winningHook}
                  onChange={(e) => setWinningHook(e.target.value)}
                  placeholder="e.g. Orthopedic surgeon explains joint mobility failure"
                  className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  What To Keep
                </label>
                <input
                  type="text"
                  value={whatToKeep}
                  onChange={(e) => setWhatToKeep(e.target.value)}
                  placeholder="e.g. Hook, Offer, Core copy"
                  className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  What To Change
                </label>
                <input
                  type="text"
                  value={whatToChange}
                  onChange={(e) => setWhatToChange(e.target.value)}
                  placeholder="e.g. Visual execution, safe-zone framing"
                  className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Create Action & Assign Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
