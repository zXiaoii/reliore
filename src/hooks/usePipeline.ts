'use client';

import { useState, useEffect } from 'react';
import { WorkTask, Campaign, AdSet, SettingsConfig, TeamUser } from '@/types';
import { store } from '@/lib/store';

export function usePipeline() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [settings, setSettings] = useState<SettingsConfig>({
    defaultBatchQty: 8,
    adAccounts: ['CA AD 24', 'CA AD 19', 'AU AD 11', 'RL-01', 'RL-02'],
    campaignActions: [
      'ADD NEW AD SET',
      'LAUNCH NEW CBO',
      'LAUNCH NEW ABO',
      'DUPLICATE WINNER',
      'LAUNCH NEW CREATIVE BATCH',
      'LAUNCH WINNER ITERATIONS',
      'SCALE CAMPAIGN',
      'PAUSE / KILL',
    ],
    creativeRequestTypes: [
      'SWIPES',
      'PLAYBOOK CONCEPTS',
      'SWIPES + PLAYBOOK',
      'CURIOSITY ADS',
      'WINNER ITERATIONS',
    ],
    products: ['FlexiVita', 'SleepGlow', 'GlowVita'],
  });
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTasks = store.subscribeTasks((data) => {
      setTasks(data);
      setLoading(false);
    });

    const unsubCamps = store.subscribeCampaigns((data) => {
      setCampaigns(data);
    });

    const unsubAdSets = store.subscribeAdSets((data) => {
      setAdSets(data);
    });

    const unsubSettings = store.subscribeSettings((data) => {
      setSettings(data);
    });

    const unsubUsers = store.subscribeUsers((data) => {
      setUsers(data);
    });

    return () => {
      unsubTasks();
      unsubCamps();
      unsubAdSets();
      unsubSettings();
      unsubUsers();
    };
  }, []);

  return {
    tasks,
    campaigns,
    adSets,
    settings,
    users,
    loading,
    store,
  };
}
