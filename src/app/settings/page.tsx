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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="border-b border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-zinc-900 dark:text-white" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Operations &amp; Automation Settings
          </h1>
          <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
            Admin Config
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure real-time database, dynamic campaign actions (§7), creative request types (§8), and team roles without hardcoding.
        </p>
      </div>

      <div className="flex-1 p-3 sm:p-6 max-w-5xl w-full space-y-6">
        {/* Section 0: Cloud Firestore Database Connection */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Database &amp; Live Real-Time Sync (Cloud Firestore)
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Fastest database setup for text and links: zero schema migrations, automatic offline cache, and 0ms optimistic UI updates.
              </p>
            </div>

            {/* Connection Status Pill */}
            <div>
              {isLiveConnected ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Firestore Live: {fbConfig.projectId}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Local Storage Mode (Zero Setup Active)</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveFirebaseConfig} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Firebase Project ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. media-ops-pipeline-2026"
                  value={fbConfig.projectId}
                  onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                  className="w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  API Key (Web API Key) *
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={fbConfig.apiKey}
                  onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                  className="w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Auth Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={fbConfig.authDomain}
                  onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                  className="w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  App ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={fbConfig.appId}
                  onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                  className="w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-2xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save &amp; Connect Cloud Firestore</span>
                </button>

                {isLiveConnected && (
                  <button
                    type="button"
                    onClick={handleSeedFirestore}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    title="Upload local tasks to Firestore"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Push Local State to Firestore</span>
                  </button>
                )}
              </div>

              {isLiveConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectFirebase}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Disconnect &amp; Reset
                </button>
              )}
            </div>

            <p className="text-[11px] text-zinc-400">
              💡 <em>How to get these keys:</em> In your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="h-2.5 w-2.5" /></a>, go to Project Settings &gt; General &gt; Your Apps &gt; Web App, copy the config, and paste it here or into <code>.env.local</code>.
            </p>
          </form>
        </div>

        {/* Section: Slack Webhook Notifications (Real-Time Team Alerts) */}
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-zinc-900 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-sm">
                #
              </span>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Slack Notifications (Creative Submissions)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Notify Charles &amp; media buyers whenever Yzah delivers new creative cuts or updates Drive files.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSlackNotification}
              disabled={isTestingSlack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/50 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 self-start sm:self-auto"
            >
              {isTestingSlack ? 'Sending Test...' : '⚡ Send Test Slack Notification'}
            </button>
          </div>

          <form onSubmit={handleSaveSlackWebhook} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Slack Incoming Webhook URL
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  placeholder="https://your-slack-webhook-url-here"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white p-2 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-colors shrink-0 shadow-2xs"
                >
                  Save Webhook
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              💡 <em>How to set up:</em> In your Slack workspace, create an <strong>Incoming Webhook</strong> for your channel (e.g. <code>#creative-deliveries</code> or <code>#media-ops</code>), and paste the URL above. The app will automatically post rich cards with Drive links, quantities, and hooks!
            </p>
          </form>
        </div>

        {/* Section 1: Campaign Action Types (§7) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Campaign Action Types (§7)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Actions media buyers can trigger from the smart dashboard or campaign pages.
              </p>
            </div>

            <form onSubmit={handleAddAction} className="flex items-center gap-2">
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="New action name..."
                className="rounded-md border border-zinc-300 bg-white py-1.5 px-3 text-xs uppercase text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Action</span>
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {settings.campaignActions.map((action) => (
              <div
                key={action}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60"
              >
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {action}
                </span>
                <button
                  onClick={() => handleRemoveAction(action)}
                  className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Remove action"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Creative Request Types (§8) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Creative Request Types (§8)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-select creative requirements available when creating actions (swipes, playbooks, iterations).
              </p>
            </div>

            <form onSubmit={handleAddCreativeType} className="flex items-center gap-2">
              <input
                type="text"
                value={newCreativeType}
                onChange={(e) => setNewCreativeType(e.target.value)}
                placeholder="New creative type..."
                className="rounded-md border border-zinc-300 bg-white py-1.5 px-3 text-xs uppercase text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Type</span>
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {settings.creativeRequestTypes.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50/50 p-2.5 dark:border-purple-900/40 dark:bg-purple-950/20"
              >
                <span className="font-mono text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
                  {type}
                </span>
                <button
                  onClick={() => handleRemoveCreativeType(type)}
                  className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Remove type"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Team Directory & Roles (§3) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Team Roles &amp; Responsibilities (§3)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                User directory defining responsibilities for media buyers, creative leads, and setup executors.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Role-Based Access Control</span>
            </div>
          </div>

          <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => (
              <div key={user.uid} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      {user.displayName}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      user.role === 'media_buyer'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : user.role === 'creative'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
