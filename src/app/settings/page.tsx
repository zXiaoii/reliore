'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import {
  Settings,
  Plus,
  Trash2,
  Check,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
} from 'lucide-react';
import {
  isFirebaseConfigured,
  getActiveFirebaseConfig,
  FirebaseConfigParams,
} from '@/lib/firebase';
import {
  getStoredSlackWebhook,
  setStoredSlackWebhook,
  sendSlackCreativeNotification,
} from '@/lib/slack';

export default function SettingsPage() {
  const { settings, users, store, tasks } = usePipeline();
  const { isPendingAccess, isAdmin } = useAuth();
  const { toast } = useToast();

  const [newAction, setNewAction] = useState('');
  const [newCreativeType, setNewCreativeType] = useState('');

  // Firebase Config State
  const [fbConfig, setFbConfig] = useState<FirebaseConfigParams>(getActiveFirebaseConfig());
  const [isLiveConnected, setIsLiveConnected] = useState(isFirebaseConfigured());

  // Slack Webhook State
  const [slackWebhookUrl, setSlackWebhookUrl] = useState<string>(() => getStoredSlackWebhook());
  const [isTestingSlack, setIsTestingSlack] = useState(false);

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;
    const clean = newAction.trim().toUpperCase();
    if (settings.campaignActions.includes(clean)) {
      toast.error('Action type already exists.');
      return;
    }
    settings.campaignActions = [...settings.campaignActions, clean];
    setNewAction('');
    toast.success(`Action "${clean}" added.`);
  };

  const handleRemoveAction = (action: string) => {
    settings.campaignActions = settings.campaignActions.filter((a) => a !== action);
    toast.info(`Action "${action}" removed.`);
  };

  const handleAddCreativeType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreativeType.trim()) return;
    const clean = newCreativeType.trim().toUpperCase();
    if (settings.creativeRequestTypes.includes(clean)) {
      toast.error('Creative requirement type already exists.');
      return;
    }
    settings.creativeRequestTypes = [...settings.creativeRequestTypes, clean];
    setNewCreativeType('');
    toast.success(`Creative Type "${clean}" added.`);
  };

  const handleRemoveCreativeType = (type: string) => {
    settings.creativeRequestTypes = settings.creativeRequestTypes.filter((t) => t !== type);
    toast.info(`Creative type "${type}" removed.`);
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbConfig.apiKey.trim() || !fbConfig.projectId.trim()) {
      toast.error('API Key and Project ID are required.');
      return;
    }
    localStorage.setItem('media_ops_firebase_config_v1', JSON.stringify(fbConfig));
    setIsLiveConnected(true);
    toast.success('Firebase configuration saved! Connecting live to Cloud Firestore...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleDisconnectFirebase = () => {
    localStorage.removeItem('media_ops_firebase_config_v1');
    setIsLiveConnected(false);
    toast.info('Reverted to local offline storage.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleSeedFirestore = () => {
    store.seedToFirestore();
    toast.success('Pushed all tasks, campaigns, and ad sets to Cloud Firestore!');
  };

  const handleSaveSlackWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredSlackWebhook(slackWebhookUrl);
    toast.success('Slack Webhook URL saved! Team alerts are now active.');
  };

  const handleTestSlackNotification = async () => {
    setIsTestingSlack(true);
    try {
      const mockTask = tasks[0] || {
        id: 'test-task',
        taskNumber: 1,
        product: 'FlexiVita',
        campaign: 'CBO FlexiVita 3',
        action: 'ADD NEW AD SET',
        owner: 'Yzah',
        market: 'CA',
        quantity: 8,
        quantityDone: 8,
        creativeTypes: ['SWIPES + PLAYBOOK'],
        folderUrl: 'https://drive.google.com/drive/folders/demo-creatives',
        creativeNotes: 'Test dispatch from Media Buying Ops settings.',
        winningHook: 'The 30-second European morning ritual',
      };

      const res = await sendSlackCreativeNotification(mockTask as any, 'Yzah (Creative)', true);
      if (res.ok) {
        if (!res.simulated) {
          toast.success('🚀 Real Slack notification delivered to your channel!');
        } else {
          toast.info('⚡ Slack simulation test succeeded! (Paste incoming webhook URL to post to live channel)');
        }
      } else {
        toast.error(`Slack test failed: ${res.message}`);
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message || 'Could not reach Slack API'}`);
    } finally {
      setIsTestingSlack(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans">
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-white" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Operations &amp; Automation Settings
            </h1>
            <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
              Admin Config
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure real-time database, dynamic campaign actions (§7), creative request types (§8), and team roles without hardcoding.
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Section 0: Cloud Firestore Database Connection */}
        <div className="vercel-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1f1f1f] pb-3.5 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">
                  Database &amp; Live Real-Time Sync (Cloud Firestore)
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fastest database setup for text and links: zero schema migrations, automatic offline cache, and 0ms optimistic UI updates.
              </p>
            </div>

            {/* Connection Status Pill */}
            <div>
              {isLiveConnected ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud Firestore Live: {fbConfig.projectId}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-mono font-bold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Local Storage Mode (Zero Setup Active)</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveFirebaseConfig} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Firebase Project ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. media-ops-pipeline-2026"
                  value={fbConfig.projectId}
                  onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                  className="w-full rounded-md border border-[#262626] bg-black p-2 font-mono text-xs text-white focus:border-zinc-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  API Key (Web API Key) *
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={fbConfig.apiKey}
                  onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                  className="w-full rounded-md border border-[#262626] bg-black p-2 font-mono text-xs text-white focus:border-zinc-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Auth Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={fbConfig.authDomain}
                  onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                  className="w-full rounded-md border border-[#262626] bg-black p-2 font-mono text-xs text-white focus:border-zinc-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  App ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={fbConfig.appId}
                  onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                  className="w-full rounded-md border border-[#262626] bg-black p-2 font-mono text-xs text-white focus:border-zinc-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#1f1f1f] gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="vercel-btn-primary flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-black" />
                  <span>Save &amp; Connect Cloud Firestore</span>
                </button>

                {isLiveConnected && (
                  <button
                    type="button"
                    onClick={handleSeedFirestore}
                    className="vercel-btn-secondary flex items-center gap-1.5 cursor-pointer"
                    title="Upload local tasks to Firestore"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Push Local State to Firestore</span>
                  </button>
                )}
              </div>

              {isLiveConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectFirebase}
                  className="text-xs text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Disconnect &amp; Reset
                </button>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 pt-1">
              💡 <em>How to get these keys:</em> In your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="h-2.5 w-2.5" /></a>, go to Project Settings &gt; General &gt; Your Apps &gt; Web App, copy the config, and paste it here.
            </p>
          </form>
        </div>

        {/* Section: Slack Webhook Notifications (Real-Time Team Alerts) */}
        <div className="vercel-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f1f1f] pb-3.5 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#181818] border border-[#262626] text-white font-bold text-sm">
                #
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">
                  Slack Notifications (Creative Submissions)
                </h2>
                <p className="text-xs text-zinc-400">
                  Notify Charles &amp; media buyers whenever Yzah delivers new creative cuts or updates Drive files.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSlackNotification}
              disabled={isTestingSlack}
              className="vercel-btn-secondary inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              {isTestingSlack ? 'Sending Test...' : '⚡ Send Test Slack Notification'}
            </button>
          </div>

          <form onSubmit={handleSaveSlackWebhook} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1 font-mono">
                Slack Incoming Webhook URL
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  placeholder="https://your-slack-webhook-url-here"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  className="flex-1 rounded-md border border-[#262626] bg-black p-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="vercel-btn-primary cursor-pointer shrink-0"
                >
                  Save Webhook
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              💡 <em>How to set up:</em> In your Slack workspace, create an <strong>Incoming Webhook</strong> for your channel (e.g. <code>#creative-deliveries</code> or <code>#media-ops</code>), and paste the URL above. The app will automatically post rich cards with Drive links, quantities, and hooks!
            </p>
          </form>
        </div>

        {/* Section 1: Campaign Action Types (§7) */}
        <div className="vercel-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f1f1f] pb-3.5 gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Campaign Action Types (§7)
              </h2>
              <p className="text-xs text-zinc-400">
                Actions media buyers can trigger from the smart dashboard or campaign pages.
              </p>
            </div>

            <form onSubmit={handleAddAction} className="flex items-center gap-2">
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="New action name..."
                className="rounded-md border border-[#262626] bg-black py-1.5 px-3 text-xs uppercase text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="vercel-btn-primary flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-black" />
                <span>Add Action</span>
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {settings.campaignActions.map((action) => (
              <div
                key={action}
                className="flex items-center justify-between rounded-md border border-[#262626] bg-black p-2.5"
              >
                <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                  {action}
                </span>
                <button
                  onClick={() => handleRemoveAction(action)}
                  className="rounded p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                  title="Remove action"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Creative Request Types (§8) */}
        <div className="vercel-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f1f1f] pb-3.5 gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Creative Request Types (§8)
              </h2>
              <p className="text-xs text-zinc-400">
                Multi-select creative requirements available when creating actions (swipes, playbooks, iterations).
              </p>
            </div>

            <form onSubmit={handleAddCreativeType} className="flex items-center gap-2">
              <input
                type="text"
                value={newCreativeType}
                onChange={(e) => setNewCreativeType(e.target.value)}
                placeholder="New creative type..."
                className="rounded-md border border-[#262626] bg-black py-1.5 px-3 text-xs uppercase text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="vercel-btn-primary flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-black" />
                <span>Add Type</span>
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {settings.creativeRequestTypes.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-md border border-[#262626] bg-black p-2.5"
              >
                <span className="font-mono text-xs font-semibold text-purple-300 truncate">
                  {type}
                </span>
                <button
                  onClick={() => handleRemoveCreativeType(type)}
                  className="rounded p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                  title="Remove type"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Team Directory & Roles (§3) */}
        <div className="vercel-card p-6">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
            <div>
              <h2 className="text-sm font-bold text-white">
                Team Roles &amp; Responsibilities (§3)
              </h2>
              <p className="text-xs text-zinc-400">
                User directory defining responsibilities for media buyers, creative leads, and setup executors.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold font-mono">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>RBAC Active</span>
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#1a1a1a]">
            {users.map((user) => (
              <div key={user.uid} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181818] border border-[#262626] font-bold text-zinc-200">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {user.displayName}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                      user.role === 'media_buyer'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                        : user.role === 'creative'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}
                  >
                    {(user.role || 'pending').replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
                    {user.role === 'media_buyer'
                      ? 'Full Admin Access'
                      : user.role === 'creative'
                      ? 'Creative Production'
                      : 'Campaign & Pixel Setup'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
