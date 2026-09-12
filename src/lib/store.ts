import {
  Campaign,
  AdSet,
  WorkTask,
  SettingsConfig,
  TeamUser,
  CampaignAction,
  Market,
  Priority,
  WorkStatus,
  CampaignStatus,
  UserRole,
} from '@/types';
import { deriveStage, getNextAction, getSuggestedAdSetName } from './pipeline';
import { initFirestoreInstance, isFirebaseConfigured } from './firebase';

export const INITIAL_USERS: TeamUser[] = [
  {
    uid: 'charles-01',
    email: 'charles@operations.internal',
    displayName: 'Charles',
    role: 'media_buyer',
    active: true,
    password: 'charles2026',
  },
  {
    uid: 'yzah-03',
    email: 'yzah@operations.internal',
    displayName: 'Yzah',
    role: 'creative',
    active: true,
    password: 'yzah2026',
  },
  {
    uid: 'karl-04',
    email: 'karl@operations.internal',
    displayName: 'Karl',
    role: 'setup',
    active: true,
    password: 'karl2026',
  },
  {
    uid: 'mark-05',
    email: 'mark@operations.internal',
    displayName: 'Mark',
    role: 'setup',
    active: true,
    password: 'mark2026',
  },
  {
    uid: 'christian-06',
    email: 'christian@operations.internal',
    displayName: 'Christian',
    role: 'setup',
    active: true,
    password: 'christian2026',
  },
  {
    uid: 'danny-01',
    email: 'danny@operations.internal',
    displayName: 'Danny',
    role: 'admin',
    active: true,
    password: 'danny2026',
  },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-flexi-3',
    name: 'CBO FlexiVita 3',
    product: 'FlexiVita',
    market: 'CA',
    adAccount: 'CA AD 24',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/10/26',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    history: [
      {
        at: '09/10/26 10:00 AM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Campaign Created',
        detail: 'Created CBO FlexiVita 3 on CA AD 24 for Canada market.',
      },
      {
        at: '09/10/26 04:30 PM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Creatives Approved',
        detail: 'Approved initial 8 swipe variants.',
      },
      {
        at: '09/10/26 06:15 PM',
        uid: 'karl-04',
        userDisplayName: 'Karl',
        action: 'Campaign Launched',
        detail: 'Launched campaign with ad set: 09/10/26 Initial Swipes.',
      },
      {
        at: '09/12/26 05:00 PM',
        uid: 'karl-04',
        userDisplayName: 'Karl',
        action: 'Ad Set Launched',
        detail: 'Launched ad set: 09/12/26 Swipes.',
      },
    ],
  },
  {
    id: 'camp-flexi-curiosity',
    name: 'CBO FlexiVita Curiosity 1',
    product: 'FlexiVita',
    market: 'CA',
    adAccount: 'CA AD 19',
    status: 'LIVE',
    stage: 'Initial Testing',
    launchDate: '09/11/26',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    history: [
      {
        at: '09/11/26 11:00 AM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Campaign Created',
        detail: 'Launched new curiosity angle campaign.',
      },
    ],
  },
  {
    id: 'camp-glowvita-2',
    name: 'CBO GlowVita 2',
    product: 'GlowVita',
    market: 'AUS',
    adAccount: 'AU AD 11',
    status: 'WATCH',
    stage: 'Broad Scaling',
    launchDate: '09/08/26',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    history: [
      {
        at: '09/08/26 02:00 PM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Campaign Launched',
        detail: 'Launched in Australia on AU AD 11.',
      },
    ],
  },
  {
    id: 'camp-flexi-uk',
    name: 'UK - FlexiVita - Scale',
    product: 'FlexiVita',
    market: 'UK',
    adAccount: 'RL-01',
    status: 'SCALE',
    stage: 'Scale Phase',
    launchDate: '09/05/26',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    history: [
      {
        at: '09/05/26 09:00 AM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Campaign Scaled',
        detail: 'Budget raised to €500/day after 2.6x ROAS.',
      },
    ],
  },
];

const INITIAL_ADSETS: AdSet[] = [
  {
    id: 'adset-01',
    campaignId: 'camp-flexi-3',
    campaignName: 'CBO FlexiVita 3',
    name: '09/10/26 Initial Swipes',
    launchDate: '09/10/26',
    status: 'LIVE',
    creativeType: 'SWIPES',
    assignedSetupUser: 'Karl',
    notes: 'Initial launch batch, performing at 2.4x ROAS.',
    createdAt: '09/10/26',
    launchedAt: '09/10/26',
  },
  {
    id: 'adset-02',
    campaignId: 'camp-flexi-3',
    campaignName: 'CBO FlexiVita 3',
    name: '09/12/26 Swipes',
    launchDate: '09/12/26',
    status: 'LIVE',
    creativeType: 'SWIPES',
    assignedSetupUser: 'Karl',
    notes: 'Second swipe batch testing doctor whiteboard hooks.',
    createdAt: '09/12/26',
    launchedAt: '09/12/26',
  },
  {
    id: 'adset-03',
    campaignId: 'camp-flexi-curiosity',
    campaignName: 'CBO FlexiVita Curiosity 1',
    name: '09/11/26 Curiosity Batch',
    launchDate: '09/11/26',
    status: 'LIVE',
    creativeType: 'CURIOSITY ADS',
    assignedSetupUser: 'Mark',
    notes: 'Curiosity blind test angle.',
    createdAt: '09/11/26',
    launchedAt: '09/11/26',
  },
  {
    id: 'adset-04',
    campaignId: 'camp-glowvita-2',
    campaignName: 'CBO GlowVita 2',
    name: '09/08/26 Iterations',
    launchDate: '09/08/26',
    status: 'LIVE',
    creativeType: 'WINNER ITERATIONS',
    assignedSetupUser: 'Christian',
    notes: 'Collagen comparison cuts.',
    createdAt: '09/08/26',
    launchedAt: '09/08/26',
  },
];

const INITIAL_TASKS: WorkTask[] = [
  // Task 1: Use Case 1 from User Brief!
  {
    id: 'task-001',
    taskNumber: 1,
    product: 'FlexiVita',
    campaign: 'CBO FlexiVita 3',
    campaignId: 'camp-flexi-3',
    action: 'ADD NEW AD SET',
    owner: 'Karl',
    ownerUid: 'karl-04',
    status: 'READY',
    deadline: 'Today 6 PM',
    nextAction: 'Karl set up ad set in CBO FlexiVita 3',
    market: 'CA',
    adAccount: 'CA AD 24',
    priority: 'P1',
    stage: 'Setup',
    creativeTypes: ['SWIPES', 'PLAYBOOK CONCEPTS'],
    quantity: 8,
    quantityDone: 8,
    reasonTrigger: 'Add New Ad Set to Winning CBO',
    winningReference: 'CA AD 14 Creative 03',
    winningHook: 'Orthopedic surgeon explains joint mobility failure',
    winningAngle: 'Doctor whiteboard breakdown with 3D joint animation clip',
    whatToKeep: 'Hook, Offer, Core copy',
    whatToChange: 'Visual execution, safe-zone framing',
    format: '9:16 Video',
    folderUrl: 'https://drive.google.com/drive/folders/flexivita-swipe-playbook-0913',
    creativeNotes: 'All 8 variants approved by Charles. Ready for Karl to launch.',
    adSetName: '09/13/26 Swipes + Playbook',
    dailyBudget: 250,
    setupNotes: 'Inserting into CBO FlexiVita 3, broad 35+, pixel verified.',
    assignedSetupUser: 'Karl',
    funnelReady: true,
    pixelOk: true,
    trackingOk: true,
    createdBy: 'charles-01',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        at: '09/12/26 10:00 AM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Created Request',
        detail: 'Created 8 Swipes + Playbook Concepts assigned to Yzah.',
      },
      {
        at: '09/12/26 03:00 PM',
        uid: 'yzah-03',
        userDisplayName: 'Yzah',
        action: 'Delivered Creative',
        detail: 'Uploaded 8 variants to Google Drive folder.',
      },
      {
        at: '09/12/26 04:15 PM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Approved Creative',
        detail: 'Approved batch and assigned setup to Karl.',
      },
    ],
  },
  // Task 2: Use Case 2 from User Brief!
  {
    id: 'task-002',
    taskNumber: 2,
    product: 'FlexiVita',
    campaign: 'CBO FlexiVita Curiosity 1',
    campaignId: 'camp-flexi-curiosity',
    action: 'LAUNCH NEW CBO',
    owner: 'Yzah',
    ownerUid: 'yzah-03',
    status: 'MAKING',
    deadline: 'Today',
    nextAction: 'Yzah finish cuts & attach Drive link',
    market: 'CA',
    adAccount: 'CA AD 19',
    priority: 'P1',
    stage: 'Creative',
    creativeTypes: ['CURIOSITY ADS'],
    quantity: 8,
    quantityDone: 4,
    reasonTrigger: 'Launch New CBO Testing Curiosity Angle',
    winningReference: 'TikTok Viral Clip #8821',
    winningHook: 'The 30-second morning habit that keeps European grandmothers hiking',
    winningAngle: 'Curiosity blind test angle',
    whatToKeep: 'Curiosity hook structure',
    whatToChange: 'Modernized lifestyle visuals',
    format: '9:16 Video',
    folderUrl: 'https://drive.google.com/drive/folders/flexivita-curiosity-batch-2',
    creativeNotes: 'Hooks 1-4 rendered, editing hooks 5-8 now.',
    adSetName: '09/13/26 Curiosity',
    dailyBudget: 200,
    assignedSetupUser: 'Mark',
    createdBy: 'charles-01',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        at: '09/12/26 11:30 AM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Created Request',
        detail: 'Created 8 Curiosity Ads assigned to Yzah. Setup assigned to Mark.',
      },
    ],
  },
  // Task 3: Performance Review / Scale
  {
    id: 'task-003',
    taskNumber: 3,
    product: 'GlowVita',
    campaign: 'CBO GlowVita 2',
    campaignId: 'camp-glowvita-2',
    action: 'SCALE CAMPAIGN',
    owner: 'Charles',
    ownerUid: 'charles-01',
    status: 'LIVE',
    deadline: '10 PM',
    nextAction: 'Media buyer monitor ROAS & trigger next iteration',
    market: 'AUS',
    adAccount: 'AU AD 11',
    priority: 'P2',
    stage: 'Live',
    creativeTypes: ['WINNER ITERATIONS'],
    quantity: 6,
    quantityDone: 6,
    reasonTrigger: 'Campaign reached 2.4x ROAS over 48h',
    folderUrl: 'https://drive.google.com/drive/folders/glowvita-iterations-aus',
    adSetName: '09/08/26 Iterations',
    dailyBudget: 350,
    setupNotes: 'Scaled budget to €350/d. Tracking healthy.',
    assignedSetupUser: 'Christian',
    launchDate: '09/08/26',
    createdBy: 'charles-01',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  },
  // Task 4: Blocked task for Blockers page!
  {
    id: 'task-004',
    taskNumber: 4,
    product: 'SleepGlow',
    campaign: 'US - SleepGlow - Advantage+ Broad',
    action: 'LAUNCH WINNER ITERATIONS',
    owner: 'Yzah',
    ownerUid: 'yzah-03',
    status: 'CHANGES REQUIRED',
    deadline: 'Tomorrow 2 PM',
    nextAction: 'Yzah resolve feedback & re-export',
    market: 'US',
    adAccount: 'RL-02',
    priority: 'P2',
    stage: 'Review',
    creativeTypes: ['WINNER ITERATIONS', 'HOOK VARIATIONS'],
    quantity: 8,
    quantityDone: 6,
    reasonTrigger: 'Winner scaling iteration',
    winningReference: 'US AD 04 Tart Cherry Hook',
    winningHook: 'Why melatonin fails you / tart cherry comparison',
    whatToKeep: 'Voiceover & script',
    whatToChange: 'Safe zone text placement',
    folderUrl: 'https://drive.google.com/drive/folders/sleepglow-tart-cherry-revisions',
    feedback: 'Hook caption was cut off on 9:16 border in first 3 seconds. Please adjust safe-zone framing and re-export.',
    assignedSetupUser: 'Karl',
    createdBy: 'charles-01',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        at: '09/11/26 05:00 PM',
        uid: 'charles-01',
        userDisplayName: 'Charles',
        action: 'Changes Required',
        detail: 'Feedback sent to Yzah: Safe-zone framing issue on border.',
      },
    ],
  },
];

const INITIAL_SETTINGS: SettingsConfig = {
  defaultBatchQty: 8,
  adAccounts: ['CA AD 24', 'CA AD 19', 'AU AD 11', 'RL-01', 'RL-02', 'RL-03', 'RL-04', 'RL-05'],
  campaignActions: [
    'ADD NEW AD SET',
    'LAUNCH NEW CBO',
    'LAUNCH NEW ABO',
    'DUPLICATE WINNER',
    'LAUNCH NEW CREATIVE BATCH',
    'LAUNCH WINNER ITERATIONS',
    'LAUNCH NEW FUNNEL',
    'SCALE CAMPAIGN',
    'TRIM ADS',
    'PAUSE / KILL',
    'MOVE TO NEW AD ACCOUNT',
  ],
  creativeRequestTypes: [
    'SWIPES',
    'PLAYBOOK CONCEPTS',
    'SWIPES + PLAYBOOK',
    'CURIOSITY ADS',
    'WINNER ITERATIONS',
    'HOOK VARIATIONS',
    'VISUAL VARIATIONS',
    'ANGLE VARIATIONS',
    'CREATIVE REFRESH',
    'BRANDED SEARCH SWIPES',
    'SAME SUB-NICHE SWIPES',
    'NEW FUNNEL CONCEPT',
    'UGC',
    'STATIC',
    'VIDEO',
  ],
  products: ['FlexiVita', 'SleepGlow', 'GlowVita'],
};

type Listener<T> = (data: T) => void;

class OperationsStore {
  private campaigns: Campaign[] = [];
  private adSets: AdSet[] = [];
  private tasks: WorkTask[] = [];
  private settings: SettingsConfig = INITIAL_SETTINGS;
  private users: TeamUser[] = INITIAL_USERS;
  private nextTaskNumber = 5;

  private campaignListeners: Set<Listener<Campaign[]>> = new Set();
  private adSetListeners: Set<Listener<AdSet[]>> = new Set();
  private taskListeners: Set<Listener<WorkTask[]>> = new Set();
  private userListeners: Set<Listener<TeamUser[]>> = new Set();
  private settingListeners: Set<Listener<SettingsConfig>> = new Set();

  private channel: BroadcastChannel | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initClient();
    } else {
      this.campaigns = INITIAL_CAMPAIGNS;
      this.adSets = INITIAL_ADSETS;
      this.tasks = INITIAL_TASKS;
      this.settings = INITIAL_SETTINGS;
      this.users = INITIAL_USERS;
    }
  }

  private initClient() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const storedTasks = localStorage.getItem('media_ops_tasks_v1');
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks);
        const maxNum = this.tasks.reduce((max, t) => Math.max(max, t.taskNumber || 0), 0);
        this.nextTaskNumber = maxNum + 1;
      } else {
        this.tasks = INITIAL_TASKS;
        this.saveTasks();
      }

      const storedCampaigns = localStorage.getItem('media_ops_campaigns_v1');
      if (storedCampaigns) {
        this.campaigns = JSON.parse(storedCampaigns);
      } else {
        this.campaigns = INITIAL_CAMPAIGNS;
        this.saveCampaigns();
      }

      const storedAdSets = localStorage.getItem('media_ops_adsets_v1');
      if (storedAdSets) {
        this.adSets = JSON.parse(storedAdSets);
      } else {
        this.adSets = INITIAL_ADSETS;
        this.saveAdSets();
      }

      const storedSettings = localStorage.getItem('media_ops_settings_v1');
      if (storedSettings) {
        this.settings = JSON.parse(storedSettings);
      } else {
        this.settings = INITIAL_SETTINGS;
        this.saveSettings();
      }

      const storedUsers = localStorage.getItem('media_ops_users_v1');
      if (storedUsers) {
        const parsed: TeamUser[] = JSON.parse(storedUsers);
        this.users = parsed.map((u) => {
          const initMatch = INITIAL_USERS.find(
            (iu) => iu.email.toLowerCase() === u.email.toLowerCase() || iu.uid === u.uid
          );
          return {
            ...u,
            password: u.password || initMatch?.password || 'ops2026',
          };
        });
        this.saveUsers();
      } else {
        this.users = INITIAL_USERS;
        this.saveUsers();
      }

      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('media_buying_ops_sync');
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_ALL') {
            this.reloadFromStorage();
          }
        };
      }

      // Initialize Cloud Firestore Real-time Sync if configured
      this.initFirestoreSync();
    } catch (e) {
      console.warn('Storage init fallback:', e);
      this.campaigns = INITIAL_CAMPAIGNS;
      this.adSets = INITIAL_ADSETS;
      this.tasks = INITIAL_TASKS;
      this.settings = INITIAL_SETTINGS;
      this.users = INITIAL_USERS;
    }
  }

  // --- CLOUD FIRESTORE REAL-TIME SYNC ---
  private initFirestoreSync() {
    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;

    try {
      import('firebase/firestore').then(({ collection, onSnapshot, doc, setDoc }) => {
        // 1. Real-time tasks collection
        try {
          const tasksCol = collection(firestoreDb, 'tasks');
          onSnapshot(
            tasksCol,
            (snapshot) => {
              if (!snapshot.empty) {
                const remoteTasks = snapshot.docs.map((d) => d.data() as WorkTask);
                this.tasks = remoteTasks;
                this.saveTasks();
                const maxNum = this.tasks.reduce((max, t) => Math.max(max, t.taskNumber || 0), 0);
                this.nextTaskNumber = Math.max(this.nextTaskNumber, maxNum + 1);
                this.notifyAll();
              } else if (this.tasks.length > 0) {
                // Initial seed to new Firestore database
                this.tasks.forEach((t) => {
                  setDoc(doc(firestoreDb, 'tasks', t.id), t, { merge: true }).catch(() => {});
                });
              }
            },
            (err) => console.warn('Firestore tasks subscription:', err)
          );
        } catch (e) {
          console.warn('Tasks subscription error:', e);
        }

        // 2. Real-time campaigns collection
        try {
          const campsCol = collection(firestoreDb, 'campaigns');
          onSnapshot(
            campsCol,
            (snapshot) => {
              if (!snapshot.empty) {
                this.campaigns = snapshot.docs.map((d) => d.data() as Campaign);
                this.saveCampaigns();
                this.notifyAll();
              } else if (this.campaigns.length > 0) {
                this.campaigns.forEach((c) => {
                  setDoc(doc(firestoreDb, 'campaigns', c.id), c, { merge: true }).catch(() => {});
                });
              }
            },
            (err) => console.warn('Firestore campaigns subscription:', err)
          );
        } catch (e) {
          console.warn('Campaigns subscription error:', e);
        }

        // 3. Real-time adSets collection
        try {
          const adSetsCol = collection(firestoreDb, 'adSets');
          onSnapshot(
            adSetsCol,
            (snapshot) => {
              if (!snapshot.empty) {
                this.adSets = snapshot.docs.map((d) => d.data() as AdSet);
                this.saveAdSets();
                this.notifyAll();
              } else if (this.adSets.length > 0) {
                this.adSets.forEach((a) => {
                  setDoc(doc(firestoreDb, 'adSets', a.id), a, { merge: true }).catch(() => {});
                });
              }
            },
            (err) => console.warn('Firestore adSets subscription:', err)
          );
        } catch (e) {
          console.warn('AdSets subscription error:', e);
        }
      });
    } catch (err) {
      console.warn('Firestore setup error:', err);
    }
  }

  private syncTaskToFirestore(task: WorkTask) {
    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;
    import('firebase/firestore').then(({ doc, setDoc }) => {
      setDoc(doc(firestoreDb, 'tasks', task.id), task, { merge: true }).catch((err) => {
        console.warn('Firestore task write error:', err);
      });
    });
  }

  private syncCampaignToFirestore(campaign: Campaign) {
    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;
    import('firebase/firestore').then(({ doc, setDoc }) => {
      setDoc(doc(firestoreDb, 'campaigns', campaign.id), campaign, { merge: true }).catch((err) => {
        console.warn('Firestore campaign write error:', err);
      });
    });
  }

  private syncAdSetToFirestore(adSet: AdSet) {
    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;
    import('firebase/firestore').then(({ doc, setDoc }) => {
      setDoc(doc(firestoreDb, 'adSets', adSet.id), adSet, { merge: true }).catch((err) => {
        console.warn('Firestore adSet write error:', err);
      });
    });
  }

  public seedToFirestore() {
    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;
    import('firebase/firestore').then(({ doc, setDoc }) => {
      this.tasks.forEach((t) => setDoc(doc(firestoreDb, 'tasks', t.id), t, { merge: true }).catch(() => {}));
      this.campaigns.forEach((c) => setDoc(doc(firestoreDb, 'campaigns', c.id), c, { merge: true }).catch(() => {}));
      this.adSets.forEach((a) => setDoc(doc(firestoreDb, 'adSets', a.id), a, { merge: true }).catch(() => {}));
    });
  }

  private reloadFromStorage() {
    try {
      const storedTasks = localStorage.getItem('media_ops_tasks_v1');
      if (storedTasks) this.tasks = JSON.parse(storedTasks);

      const storedCampaigns = localStorage.getItem('media_ops_campaigns_v1');
      if (storedCampaigns) this.campaigns = JSON.parse(storedCampaigns);

      const storedAdSets = localStorage.getItem('media_ops_adsets_v1');
      if (storedAdSets) this.adSets = JSON.parse(storedAdSets);

      const storedSettings = localStorage.getItem('media_ops_settings_v1');
      if (storedSettings) this.settings = JSON.parse(storedSettings);

      const storedUsers = localStorage.getItem('media_ops_users_v1');
      if (storedUsers) this.users = JSON.parse(storedUsers);

      this.notifyAll();
    } catch (e) {
      console.error('Failed to reload from storage', e);
    }
  }

  private broadcast() {
    if (this.channel) {
      this.channel.postMessage({ type: 'SYNC_ALL' });
    }
  }

  private saveTasks() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_tasks_v1', JSON.stringify(this.tasks));
    }
    this.broadcast();
  }

  private saveCampaigns() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_campaigns_v1', JSON.stringify(this.campaigns));
    }
    this.broadcast();
  }

  private saveAdSets() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_adsets_v1', JSON.stringify(this.adSets));
    }
    this.broadcast();
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_settings_v1', JSON.stringify(this.settings));
    }
    this.broadcast();
  }

  private saveUsers() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_users_v1', JSON.stringify(this.users));
    }
    this.broadcast();
  }

  private notifyAll() {
    const tasksCopy = [...this.tasks];
    this.taskListeners.forEach((l) => l(tasksCopy));

    const campsCopy = [...this.campaigns];
    this.campaignListeners.forEach((l) => l(campsCopy));

    const adSetsCopy = [...this.adSets];
    this.adSetListeners.forEach((l) => l(adSetsCopy));

    const settsCopy = { ...this.settings };
    this.settingListeners.forEach((l) => l(settsCopy));

    const usrsCopy = [...this.users];
    this.userListeners.forEach((l) => l(usrsCopy));
  }

  public subscribeTasks(listener: Listener<WorkTask[]>): () => void {
    this.taskListeners.add(listener);
    listener([...this.tasks]);
    return () => this.taskListeners.delete(listener);
  }

  public subscribeCampaigns(listener: Listener<Campaign[]>): () => void {
    this.campaignListeners.add(listener);
    listener([...this.campaigns]);
    return () => this.campaignListeners.delete(listener);
  }

  public subscribeAdSets(listener: Listener<AdSet[]>): () => void {
    this.adSetListeners.add(listener);
    listener([...this.adSets]);
    return () => this.adSetListeners.delete(listener);
  }

  public subscribeSettings(listener: Listener<SettingsConfig>): () => void {
    this.settingListeners.add(listener);
    listener({ ...this.settings });
    return () => this.settingListeners.delete(listener);
  }

  public subscribeUsers(listener: Listener<TeamUser[]>): () => void {
    this.userListeners.add(listener);
    listener([...this.users]);
    return () => this.userListeners.delete(listener);
  }

  public addUser(user: TeamUser) {
    const existingIndex = this.users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...user };
    } else {
      this.users.push(user);
    }
    this.saveUsers();
    this.notifyAll();
  }

  public updateUserRole(uidOrEmail: string, role: UserRole) {
    const user = this.users.find(
      (u) => u.uid === uidOrEmail || u.email.toLowerCase() === uidOrEmail.toLowerCase()
    );
    if (user) {
      user.role = role;
      user.active = true;
      this.saveUsers();
      this.notifyAll();
    }
  }

  public toggleUserActive(uidOrEmail: string) {
    const user = this.users.find(
      (u) => u.uid === uidOrEmail || u.email.toLowerCase() === uidOrEmail.toLowerCase()
    );
    if (user) {
      user.active = !user.active;
      this.saveUsers();
      this.notifyAll();
    }
  }

  public removeUser(uidOrEmail: string) {
    this.users = this.users.filter(
      (u) => u.uid !== uidOrEmail && u.email.toLowerCase() !== uidOrEmail.toLowerCase()
    );
    this.saveUsers();
    this.notifyAll();
  }

  public updateUserPassword(uidOrEmail: string, newPassword: string) {
    const user = this.users.find(
      (u) => u.uid === uidOrEmail || u.email.toLowerCase() === uidOrEmail.toLowerCase()
    );
    if (user) {
      user.password = newPassword;
      this.saveUsers();
      this.notifyAll();
    }
  }

  public getUsers(): TeamUser[] {
    return [...this.users];
  }

  // --- ACTIONS BUILDER (§5, §6, §7) ---
  public createActionTask(params: {
    product: string;
    campaign: string;
    campaignId?: string;
    action: CampaignAction;
    market: Market;
    adAccount: string;
    priority: Priority;
    deadline: string;
    creativeTypes: string[];
    quantity: number;
    creativeAssignedTo?: string; // e.g. Yzah
    setupAssignedTo?: string; // e.g. Karl
    adSetName?: string;
    reasonTrigger?: string;
    winningReference?: string;
    winningHook?: string;
    winningAngle?: string;
    whatToKeep?: string;
    whatToChange?: string;
    format?: string;
    createdBy: string;
  }): WorkTask {
    const taskNumber = this.nextTaskNumber++;
    const nowIso = new Date().toISOString();

    // Auto-register campaign if it doesn't exist yet
    let campaignId = params.campaignId;
    let existingCamp = this.campaigns.find((c) => c.name.toLowerCase() === params.campaign.toLowerCase());
    let newCamp: Campaign | null = null;

    if (!existingCamp) {
      newCamp = {
        id: `camp-${Date.now().toString(36)}`,
        name: params.campaign.trim(),
        product: params.product.trim(),
        market: params.market,
        adAccount: params.adAccount.trim().toUpperCase(),
        status: 'LIVE',
        stage: params.action === 'LAUNCH NEW CBO' ? 'Initial Testing' : 'Winner Expansion',
        launchDate: 'Pending',
        createdAt: nowIso,
        history: [
          {
            at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            uid: params.createdBy,
            userDisplayName: 'Charles',
            action: 'Campaign Created',
            detail: `Created via action: ${params.action}`,
          },
        ],
      };
      this.campaigns = [newCamp, ...this.campaigns];
      this.saveCampaigns();
      campaignId = newCamp.id;
    } else {
      campaignId = existingCamp.id;
    }

    // Auto-register Ad Account if new
    if (params.adAccount && !this.settings.adAccounts.includes(params.adAccount.toUpperCase())) {
      this.settings.adAccounts = [params.adAccount.toUpperCase(), ...this.settings.adAccounts];
      this.saveSettings();
    }

    // Auto-register Product if new
    if (params.product && !this.settings.products.includes(params.product)) {
      this.settings.products = [params.product, ...this.settings.products];
      this.saveSettings();
    }

    const assignedCreative = params.creativeAssignedTo || 'Yzah';
    const suggestedAdSetName =
      params.adSetName || getSuggestedAdSetName(new Date(), params.creativeTypes);

    const newTask: WorkTask = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      taskNumber,
      product: params.product.trim(),
      campaign: params.campaign.trim(),
      campaignId,
      action: params.action,
      owner: assignedCreative,
      ownerUid: 'yzah-03',
      status: 'QUEUE',
      deadline: params.deadline || 'Today 6 PM',
      nextAction: `${assignedCreative} start creative production (${params.quantity || 8} variants)`,
      market: params.market,
      adAccount: params.adAccount.trim().toUpperCase(),
      priority: params.priority,
      stage: 'Creative',
      creativeTypes: params.creativeTypes.length > 0 ? params.creativeTypes : ['SWIPES + PLAYBOOK'],
      quantity: params.quantity || 8,
      quantityDone: 0,
      reasonTrigger: params.reasonTrigger || `Media buyer requested: ${params.action}`,
      winningReference: params.winningReference || '',
      winningHook: params.winningHook || '',
      winningAngle: params.winningAngle || '',
      whatToKeep: params.whatToKeep || '',
      whatToChange: params.whatToChange || '',
      format: params.format || '9:16 Video',
      folderUrl: '',
      creativeNotes: '',
      adSetName: suggestedAdSetName,
      dailyBudget: 150,
      setupNotes: '',
      assignedSetupUser: params.setupAssignedTo || 'Karl',
      funnelReady: false,
      pixelOk: false,
      trackingOk: false,
      launchDate: null,
      feedback: '',
      createdBy: params.createdBy,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          uid: params.createdBy,
          userDisplayName: 'Charles',
          action: 'Task Created',
          detail: `Action: ${params.action} (${params.creativeTypes.join(' + ')}) assigned to ${assignedCreative}`,
        },
      ],
    };

    this.tasks = [newTask, ...this.tasks];
    this.saveTasks();
    this.notifyAll();

    // Async real-time sync to Cloud Firestore
    this.syncTaskToFirestore(newTask);
    if (!existingCamp && newCamp) {
      this.syncCampaignToFirestore(newCamp);
    }

    return newTask;
  }

  // Update task attributes
  public updateTask(
    id: string,
    updates: Partial<WorkTask>,
    actor: { uid: string; displayName: string }
  ) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const current = this.tasks[idx];
    const newHistory = [...current.history];

    if (updates.status && updates.status !== current.status) {
      newHistory.push({
        at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
        uid: actor.uid,
        userDisplayName: actor.displayName,
        action: 'Status Changed',
        detail: `${current.status} -> ${updates.status}`,
      });
    }

    const updatedTask: WorkTask = {
      ...current,
      ...updates,
      stage: updates.status ? deriveStage(updates.status) : current.stage,
      nextAction: updates.status ? getNextAction({ ...current, ...updates }) : updates.nextAction || current.nextAction,
      updatedAt: new Date().toISOString(),
      history: newHistory,
    };

    this.tasks[idx] = updatedTask;
    this.saveTasks();
    this.notifyAll();

    // Async real-time sync to Cloud Firestore
    this.syncTaskToFirestore(updatedTask);
  }

  // Complete launch of ad set (§5 & §14)
  public launchAdSet(
    taskId: string,
    params: {
      adSetName: string;
      campaignName: string;
      launchDate: string; // MM/dd/yy or ISO
      dailyBudget: number;
      setupNotes: string;
    },
    actor: { uid: string; displayName: string }
  ) {
    const idx = this.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return;

    const task = this.tasks[idx];
    const launchDateStr = params.launchDate || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

    // 1. Create AdSet record
    const newAdSet: AdSet = {
      id: `adset-${Date.now().toString(36)}`,
      campaignId: task.campaignId || 'camp-default',
      campaignName: params.campaignName || task.campaign,
      name: params.adSetName || task.adSetName || 'New Ad Set',
      launchDate: launchDateStr,
      status: 'LIVE',
      creativeType: task.creativeTypes.join(' + '),
      assignedSetupUser: actor.displayName,
      notes: params.setupNotes,
      createdAt: new Date().toISOString(),
      launchedAt: launchDateStr,
    };
    this.adSets = [newAdSet, ...this.adSets];
    this.saveAdSets();
    this.syncAdSetToFirestore(newAdSet);

    // 2. Update Campaign status and history
    const campIdx = this.campaigns.findIndex((c) => c.name === (params.campaignName || task.campaign));
    if (campIdx !== -1) {
      const camp = this.campaigns[campIdx];
      camp.status = 'LIVE';
      camp.launchDate = launchDateStr;
      camp.history.push({
        at: launchDateStr,
        uid: actor.uid,
        userDisplayName: actor.displayName,
        action: 'Ad Set Launched',
        detail: `${newAdSet.name} launched on ${task.adAccount} (€${params.dailyBudget}/d).`,
      });
      this.campaigns[campIdx] = { ...camp };
      this.saveCampaigns();
      this.syncCampaignToFirestore(camp);
    }

    // 3. Mark task as LIVE
    this.updateTask(
      taskId,
      {
        status: 'LIVE',
        stage: 'Live',
        owner: 'Charles',
        adSetName: params.adSetName,
        launchDate: launchDateStr,
        dailyBudget: params.dailyBudget,
        setupNotes: params.setupNotes,
        nextAction: 'Media buyer monitor ROAS & trigger next iteration',
      },
      actor
    );

    // 4. Trigger Next-Day Automation check (§16)
    this.registerNextDayCreativeTrigger(task.campaign, newAdSet.id, task.product, task.market, task.adAccount);
  }

  // --- AUTOMATIC NEXT-DAY CREATIVE TRIGGER (§16) ---
  // When an ad set is launched, register or generate next-day creative task for Yzah
  public registerNextDayCreativeTrigger(
    campaignName: string,
    adSetId: string,
    product: string,
    market: Market,
    adAccount: string
  ): WorkTask | null {
    const automationKey = `${campaignName}_${adSetId}_NEXT_DAY_CREATIVE`;

    // Deduplication check: Avoid creating duplicates
    const alreadyExists = this.tasks.some((t) => t.automationKey === automationKey);
    if (alreadyExists) return null;

    const taskNumber = this.nextTaskNumber++;
    const nowIso = new Date().toISOString();

    const autoTask: WorkTask = {
      id: `task-auto-${Date.now().toString(36)}`,
      taskNumber,
      product,
      campaign: campaignName,
      action: 'LAUNCH NEW CREATIVE BATCH',
      owner: 'Yzah',
      ownerUid: 'yzah-03',
      status: 'QUEUE',
      deadline: 'Tomorrow 6 PM',
      nextAction: 'Yzah create next Swipe + Playbook batch',
      market,
      adAccount,
      priority: 'P1',
      stage: 'Creative',
      creativeTypes: ['SWIPES + PLAYBOOK'],
      quantity: 8,
      quantityDone: 0,
      reasonTrigger: '1 Day After Swipe Batch Launch (Automatic Trigger)',
      winningReference: 'Launched Batch',
      winningHook: 'Next iteration / concept angles',
      format: '9:16 Video',
      adSetName: getSuggestedAdSetName(new Date(Date.now() + 86400000), 'SWIPES + PLAYBOOK'),
      dailyBudget: 150,
      assignedSetupUser: 'Karl',
      automationKey,
      createdBy: 'SYSTEM_AUTOMATION',
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          uid: 'system',
          userDisplayName: 'Automation Engine',
          action: 'Automatic Next-Day Trigger Created',
          detail: `Triggered 1 day after ad set launch for ${campaignName}. Assigned to Yzah.`,
        },
      ],
    };

    this.tasks = [autoTask, ...this.tasks];
    this.saveTasks();
    this.syncTaskToFirestore(autoTask);

    // Log to campaign history
    const camp = this.campaigns.find((c) => c.name === campaignName);
    if (camp) {
      camp.history.push({
        at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
        uid: 'system',
        userDisplayName: 'Automation Engine',
        action: 'Automatic Creative Trigger',
        detail: `Next-day creative task generated for Yzah.`,
      });
      this.saveCampaigns();
      this.syncCampaignToFirestore(camp);
    }

    this.notifyAll();
    return autoTask;
  }

  public createCampaign(params: {
    name: string;
    product: string;
    market: Market;
    adAccount: string;
    status: CampaignStatus;
    stage: string;
  }): Campaign {
    const newCamp: Campaign = {
      id: `camp-${Date.now().toString(36)}`,
      name: params.name.trim(),
      product: params.product.trim(),
      market: params.market,
      adAccount: params.adAccount.trim().toUpperCase(),
      status: params.status,
      stage: params.stage || 'Initial Testing',
      launchDate: 'Pending',
      createdAt: new Date().toISOString(),
      history: [
        {
          at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          uid: 'charles-01',
          userDisplayName: 'Charles',
          action: 'Campaign Created',
          detail: `Created ${params.name} on ${params.adAccount}.`,
        },
      ],
    };

    this.campaigns = [newCamp, ...this.campaigns];
    this.saveCampaigns();
    this.notifyAll();
    return newCamp;
  }

  public updateCampaignStatus(id: string, status: CampaignStatus, actorName: string) {
    const idx = this.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return;

    this.campaigns[idx].status = status;
    this.campaigns[idx].history.push({
      at: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
      uid: 'user',
      userDisplayName: actorName,
      action: 'Status Changed',
      detail: `Campaign status updated to ${status}.`,
    });

    this.saveCampaigns();
    this.notifyAll();
  }

  public resetDemoData() {
    this.tasks = INITIAL_TASKS;
    this.campaigns = INITIAL_CAMPAIGNS;
    this.adSets = INITIAL_ADSETS;
    this.settings = INITIAL_SETTINGS;
    this.users = INITIAL_USERS;

    this.saveTasks();
    this.saveCampaigns();
    this.saveAdSets();
    this.saveSettings();
    this.saveUsers();
    this.notifyAll();
  }
}

export const store = new OperationsStore();
