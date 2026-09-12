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
    uid: 'danny-01',
    email: 'danny@operations.internal',
    displayName: 'Danny (CEO)',
    role: 'admin',
    active: true,
    password: 'danny2026',
  },
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
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  // --- #8167 - AUS | AD 3 - Danny - ADSC ---
  {
    id: 'camp-vitalith-3',
    name: 'MAIN CBO Vitalith 3',
    product: 'Vitalith',
    market: 'AUS',
    adAccount: '#8167 - AUS | AD 3 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/07/26',
    createdAt: '2026-09-07T10:00:00.000Z',
    history: [
      { at: '09/07/26 10:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO Vitalith 3 on #8167 - AUS | AD 3.' },
    ],
  },
  {
    id: 'camp-drycontrol',
    name: 'MAIN CBO DryControl',
    product: 'DryControl',
    market: 'AUS',
    adAccount: '#8167 - AUS | AD 3 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/12/26',
    createdAt: '2026-09-12T10:00:00.000Z',
    history: [
      { at: '09/12/26 10:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO DryControl on #8167 - AUS | AD 3.' },
    ],
  },
  // --- #8178 - AUS | AD 4 - Danny - ADSC ---
  {
    id: 'camp-revida-4',
    name: 'MAIN CBO Revida 4',
    product: 'Revida',
    market: 'AUS',
    adAccount: '#8178 - AUS | AD 4 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/07/26',
    createdAt: '2026-09-07T09:00:00.000Z',
    history: [
      { at: '09/07/26 09:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO Revida 4 on #8178 - AUS | AD 4.' },
    ],
  },
  {
    id: 'camp-heradem-4',
    name: 'MAIN CBO Heradem 4',
    product: 'Heradem',
    market: 'AUS',
    adAccount: '#8178 - AUS | AD 4 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/08/26',
    createdAt: '2026-09-08T09:00:00.000Z',
    history: [
      { at: '09/08/26 09:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO Heradem 4 on #8178 - AUS | AD 4.' },
    ],
  },
  {
    id: 'camp-lidlift',
    name: 'MAIN CBO Lidlift',
    product: 'Lidlift',
    market: 'AUS',
    adAccount: '#8178 - AUS | AD 4 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/07/26',
    createdAt: '2026-09-07T08:00:00.000Z',
    history: [
      { at: '09/07/26 08:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO Lidlift on #8178 - AUS | AD 4.' },
    ],
  },
  // --- 50647 aurmacy [GO DGTL] ---
  {
    id: 'camp-gutflush-go',
    name: 'MAIN CBO GUTFLUSH GO',
    product: 'Gutflush',
    market: 'AUS',
    adAccount: '50647 aurmacy [GO DGTL]',
    status: 'LIVE',
    stage: 'Initial Testing',
    launchDate: '09/13/26',
    createdAt: '2026-09-13T08:00:00.000Z',
    history: [
      { at: '09/13/26 08:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO GUTFLUSH GO on 50647 aurmacy [GO DGTL].' },
    ],
  },
  {
    id: 'camp-flexivita-go',
    name: 'MAIN CBO Flexivita GO',
    product: 'FlexiVita',
    market: 'AUS',
    adAccount: '50647 aurmacy [GO DGTL]',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/10/26',
    createdAt: '2026-09-10T09:00:00.000Z',
    history: [
      { at: '09/10/26 09:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO Flexivita GO on 50647 aurmacy [GO DGTL].' },
    ],
  },
  // --- #8179 - AUS | AD 5 - Danny - ADSC ---
  {
    id: 'camp-healvix',
    name: 'MAIN CBO Healvix',
    product: 'Healvix',
    market: 'AUS',
    adAccount: '#8179 - AUS | AD 5 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Initial Testing',
    launchDate: '09/13/26',
    createdAt: '2026-09-13T09:00:00.000Z',
    history: [
      { at: '09/13/26 09:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO Healvix on #8179 - AUS | AD 5.' },
    ],
  },
  // --- #8180 - AUS | AD 6 - Danny - ADSC ---
  {
    id: 'camp-omegamax-6',
    name: 'MAIN CBO OMEGAMAX 6',
    product: 'OmegaMax',
    market: 'AUS',
    adAccount: '#8180 - AUS | AD 6 - Danny - ADSC',
    status: 'LIVE',
    stage: 'Winner Expansion',
    launchDate: '09/10/26',
    createdAt: '2026-09-10T10:00:00.000Z',
    history: [
      { at: '09/10/26 10:00 AM', uid: 'danny-01', userDisplayName: 'Danny (CEO)', action: 'Campaign Created', detail: 'Launched MAIN CBO OMEGAMAX 6 on #8180 - AUS | AD 6.' },
    ],
  },
];

const INITIAL_ADSETS: AdSet[] = [
  // Vitalith 3 (ad account #8167)
  { id: 'adset-120250536582690696', campaignId: 'camp-vitalith-3', campaignName: 'MAIN CBO Vitalith 3', name: '09/07/26', launchDate: '09/07/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-07T16:00:00.000Z', launchedAt: '2026-09-07T16:00:00.000Z' },
  { id: 'adset-120250600010230696', campaignId: 'camp-vitalith-3', campaignName: 'MAIN CBO Vitalith 3', name: '09/11/26 swipes 2', launchDate: '09/11/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-11T17:00:00.000Z', launchedAt: '2026-09-11T17:00:00.000Z' },
  // DryControl (ad account #8167)
  { id: 'adset-120250617426590696', campaignId: 'camp-drycontrol', campaignName: 'MAIN CBO DryControl', name: '09/12/26 swipes', launchDate: '09/12/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Christian', notes: '', createdAt: '2026-09-12T18:00:00.000Z', launchedAt: '2026-09-12T18:00:00.000Z' },
  // Revida 4 (ad account #8178)
  { id: 'adset-120249553142180232', campaignId: 'camp-revida-4', campaignName: 'MAIN CBO Revida 4', name: '09/07/26 SWIPES', launchDate: '09/07/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-07T17:00:00.000Z', launchedAt: '2026-09-07T17:00:00.000Z' },
  { id: 'adset-120249617010530232', campaignId: 'camp-revida-4', campaignName: 'MAIN CBO Revida 4', name: '09/11/26 SWIPES 2', launchDate: '09/11/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-11T16:00:00.000Z', launchedAt: '2026-09-11T16:00:00.000Z' },
  // Heradem 4 (ad account #8178)
  { id: 'adset-120249580624150232', campaignId: 'camp-heradem-4', campaignName: 'MAIN CBO Heradem 4', name: '09/08/26 SWIPES', launchDate: '09/08/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Mark', notes: '', createdAt: '2026-09-08T16:30:00.000Z', launchedAt: '2026-09-08T16:30:00.000Z' },
  { id: 'adset-120249636262790232', campaignId: 'camp-heradem-4', campaignName: 'MAIN CBO Heradem 4', name: '09/12/26 SWIPES 2', launchDate: '09/12/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Mark', notes: '', createdAt: '2026-09-12T15:30:00.000Z', launchedAt: '2026-09-12T15:30:00.000Z' },
  // Lidlift (ad account #8178)
  { id: 'adset-120249550857590232', campaignId: 'camp-lidlift', campaignName: 'MAIN CBO Lidlift', name: '09/07/26 SWIPES', launchDate: '09/07/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-07T16:00:00.000Z', launchedAt: '2026-09-07T16:00:00.000Z' },
  { id: 'adset-120249636114800232', campaignId: 'camp-lidlift', campaignName: 'MAIN CBO Lidlift', name: '09/12/26 SWIPES 2', launchDate: '09/12/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-12T14:00:00.000Z', launchedAt: '2026-09-12T14:00:00.000Z' },
  // GUTFLUSH GO (50647 aurmacy [GO DGTL])
  { id: 'adset-120254662478960045', campaignId: 'camp-gutflush-go', campaignName: 'MAIN CBO GUTFLUSH GO', name: '09/13/26 swipes', launchDate: '09/13/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Karl', notes: '', createdAt: '2026-09-13T13:00:00.000Z', launchedAt: '2026-09-13T13:00:00.000Z' },
  // Flexivita GO (50647 aurmacy [GO DGTL])
  { id: 'adset-120254607736930045', campaignId: 'camp-flexivita-go', campaignName: 'MAIN CBO Flexivita GO', name: '09/10/26 swipes', launchDate: '09/10/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Christian', notes: '', createdAt: '2026-09-10T15:00:00.000Z', launchedAt: '2026-09-10T15:00:00.000Z' },
  // Healvix (#8179)
  { id: 'adset-120251156014290564', campaignId: 'camp-healvix', campaignName: 'MAIN CBO Healvix', name: '09/13/26 swipes', launchDate: '09/13/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Mark', notes: '', createdAt: '2026-09-13T14:00:00.000Z', launchedAt: '2026-09-13T14:00:00.000Z' },
  // OMEGAMAX 6 (#8180)
  { id: 'adset-120248176536440618', campaignId: 'camp-omegamax-6', campaignName: 'MAIN CBO OMEGAMAX 6', name: '09/10/26 SWIPES', launchDate: '09/10/26', status: 'LIVE', creativeType: 'SWIPES', assignedSetupUser: 'Christian', notes: '', createdAt: '2026-09-10T16:30:00.000Z', launchedAt: '2026-09-10T16:30:00.000Z' },
];

const INITIAL_TASKS: WorkTask[] = [];

const INITIAL_SETTINGS: SettingsConfig = {
  defaultBatchQty: 8,
  adAccounts: [
    '#8167 - AUS | AD 3 - Danny - ADSC',
    '#8178 - AUS | AD 4 - Danny - ADSC',
    '50647 aurmacy [GO DGTL]',
    '#8179 - AUS | AD 5 - Danny - ADSC',
    '#8180 - AUS | AD 6 - Danny - ADSC',
    '#8977 - AUS | AD 13 - Danny - 6 - ADSC',
  ],
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
  products: [
    'Vitalith',
    'DryControl',
    'Revida',
    'Heradem',
    'Lidlift',
    'Gutflush',
    'FlexiVita',
    'Healvix',
    'OmegaMax',
  ],
};

type Listener<T> = (data: T) => void;

class OperationsStore {
  private campaigns: Campaign[] = [];
  private adSets: AdSet[] = [];
  private tasks: WorkTask[] = [];
  private settings: SettingsConfig = INITIAL_SETTINGS;
  private users: TeamUser[] = INITIAL_USERS;
  private nextTaskNumber = 1;

  public updateSettings(newSettings: SettingsConfig) {
    this.settings = newSettings;
    this.saveSettings();
    this.notifyAll();
    this.syncSettingsToFirestore();
  }

  private syncSettingsToFirestore() {
    if (!this.initialized || typeof window === 'undefined') return;
    import('firebase/firestore').then(({ setDoc, doc }) => {
      const { db } = initFirestoreInstance();
      if (db) {
        setDoc(doc(db, '_meta', 'settings'), this.settings, { merge: true }).catch(() => {});
      }
    });
  }

  public addProduct(product: string) {
    if (!this.settings.products.includes(product)) {
      this.settings.products = [product, ...this.settings.products];
      this.saveSettings();
      this.notifyAll();
      this.syncSettingsToFirestore();
    }
  }

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
      const storedTasks = localStorage.getItem('media_ops_tasks_v3');
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks);
        const maxNum = this.tasks.reduce((max, t) => Math.max(max, t.taskNumber || 0), 0);
        this.nextTaskNumber = maxNum + 1;
      } else {
        this.tasks = INITIAL_TASKS;
        this.saveTasks();
      }

      const storedCampaigns = localStorage.getItem('media_ops_campaigns_v3');
      if (storedCampaigns) {
        this.campaigns = JSON.parse(storedCampaigns);
      } else {
        this.campaigns = INITIAL_CAMPAIGNS;
        this.saveCampaigns();
      }

      const storedAdSets = localStorage.getItem('media_ops_adsets_v3');
      if (storedAdSets) {
        this.adSets = JSON.parse(storedAdSets);
      } else {
        this.adSets = INITIAL_ADSETS;
        this.saveAdSets();
      }

      const storedSettings = localStorage.getItem('media_ops_settings_v3');
      if (storedSettings) {
        this.settings = JSON.parse(storedSettings);
      } else {
        this.settings = INITIAL_SETTINGS;
        this.saveSettings();
      }

      const storedUsers = localStorage.getItem('media_ops_users_v3');
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
      import('firebase/firestore').then(async ({ collection, onSnapshot, doc, getDoc, setDoc, getDocs, deleteDoc }) => {
        try {
          const metaRef = doc(firestoreDb, '_meta', 'dataVersion');
          const metaSnap = await getDoc(metaRef);
          const currentVersion = metaSnap.exists() ? metaSnap.data()?.version : null;

          if (currentVersion !== 'aus_v4') {
            console.log('[Store] Firestore version mismatch. Migrating to aus_v4...');
            for (const colName of ['tasks', 'campaigns', 'adSets']) {
              const colRef = collection(firestoreDb, colName);
              const snapshot = await getDocs(colRef);
              const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
              await Promise.all(deletePromises);
            }

            this.tasks = INITIAL_TASKS;
            this.campaigns = INITIAL_CAMPAIGNS;
            this.adSets = INITIAL_ADSETS;
            this.saveTasks();
            this.saveCampaigns();
            this.saveAdSets();

            await Promise.all([
              ...this.tasks.map((t) => setDoc(doc(firestoreDb, 'tasks', t.id), t)),
              ...this.campaigns.map((c) => setDoc(doc(firestoreDb, 'campaigns', c.id), c)),
              ...this.adSets.map((a) => setDoc(doc(firestoreDb, 'adSets', a.id), a)),
            ]);

            await setDoc(metaRef, { version: 'aus_v4' });
            console.log('[Store] Migration to aus_v4 complete.');
            
            this.notifyAll();
          }
        } catch (err) {
          console.warn('Firestore version check/migration error:', err);
        }

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

  private deleteFromFirestore(collectionName: string, docId: string) {
    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;
    import('firebase/firestore').then(({ doc, deleteDoc }) => {
      deleteDoc(doc(firestoreDb, collectionName, docId)).catch((err) => {
        console.warn(`Firestore ${collectionName} delete error:`, err);
      });
    });
  }

  public deleteAllTasks() {
    this.tasks.forEach(t => this.deleteFromFirestore('tasks', t.id));
    this.tasks = [];
    this.saveTasks();
    this.notifyAll();
  }

  public deleteTask(taskId: string) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveTasks();
    this.deleteFromFirestore('tasks', taskId);
    this.notifyAll();
  }

  public deleteCampaign(campaignId: string) {
    this.campaigns = this.campaigns.filter((c) => c.id !== campaignId);
    this.saveCampaigns();
    this.deleteFromFirestore('campaigns', campaignId);
    this.notifyAll();
  }

  public deleteAdSet(adSetId: string) {
    this.adSets = this.adSets.filter((a) => a.id !== adSetId);
    this.saveAdSets();
    this.deleteFromFirestore('adSets', adSetId);
    this.notifyAll();
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
      const storedTasks = localStorage.getItem('media_ops_tasks_v3');
      if (storedTasks) this.tasks = JSON.parse(storedTasks);

      const storedCampaigns = localStorage.getItem('media_ops_campaigns_v3');
      if (storedCampaigns) this.campaigns = JSON.parse(storedCampaigns);

      const storedAdSets = localStorage.getItem('media_ops_adsets_v3');
      if (storedAdSets) this.adSets = JSON.parse(storedAdSets);

      const storedSettings = localStorage.getItem('media_ops_settings_v3');
      if (storedSettings) this.settings = JSON.parse(storedSettings);

      const storedUsers = localStorage.getItem('media_ops_users_v3');
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
      localStorage.setItem('media_ops_tasks_v3', JSON.stringify(this.tasks));
    }
    this.broadcast();
  }

  private saveCampaigns() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_campaigns_v3', JSON.stringify(this.campaigns));
    }
    this.broadcast();
  }

  private saveAdSets() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_adsets_v3', JSON.stringify(this.adSets));
    }
    this.broadcast();
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_settings_v3', JSON.stringify(this.settings));
    }
    this.broadcast();
  }

  private saveUsers() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('media_ops_users_v3', JSON.stringify(this.users));
    }
    this.broadcast();
  }

  private pendingNotify = false;

  private notifyAll() {
    if (this.pendingNotify) return;
    this.pendingNotify = true;
    setTimeout(() => {
      this.pendingNotify = false;
      console.log('[Store] notifyAll firing updates to React');
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
    }, 10);
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

  // --- ACTIONS BUILDER (Ã‚Â§5, Ã‚Â§6, Ã‚Â§7) ---
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

  // Complete launch of ad set (Ã‚Â§5 & Ã‚Â§14)
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
        detail: `${newAdSet.name} launched on ${task.adAccount} (Ã¢â€šÂ¬${params.dailyBudget}/d).`,
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

    // 4. Trigger Next-Day Automation check (Ã‚Â§16)
    this.registerNextDayCreativeTrigger(task.campaign, newAdSet.id, task.product, task.market, task.adAccount);
  }

  // --- AUTOMATIC NEXT-DAY CREATIVE TRIGGER (Ã‚Â§16) ---
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

  public async resetDemoData() {
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

    if (typeof window === 'undefined') return;
    const { db: firestoreDb } = initFirestoreInstance();
    if (!firestoreDb) return;
    
    try {
      const { collection, getDocs, deleteDoc, doc, setDoc } = await import('firebase/firestore');
      
      // Delete old data
      for (const colName of ['tasks', 'campaigns', 'adSets']) {
        const colRef = collection(firestoreDb, colName);
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }

      // Insert new data
      await Promise.all([
        ...INITIAL_TASKS.map((t) => setDoc(doc(firestoreDb, 'tasks', t.id), t)),
        ...INITIAL_CAMPAIGNS.map((c) => setDoc(doc(firestoreDb, 'campaigns', c.id), c)),
        ...INITIAL_ADSETS.map((a) => setDoc(doc(firestoreDb, 'adSets', a.id), a)),
      ]);
      
      console.log('[Store] Reset demo data complete.');
    } catch (e) {
      console.error('[Store] Error resetting demo data:', e);
    }
  }
}

export const store = new OperationsStore();

