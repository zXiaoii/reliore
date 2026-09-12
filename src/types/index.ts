export type Priority = 'P1' | 'P2' | 'P3';
export type Market = 'UK' | 'CA' | 'US' | 'AUS';

export type CampaignAction =
  | 'ADD NEW AD SET'
  | 'LAUNCH NEW CBO'
  | 'LAUNCH NEW ABO'
  | 'DUPLICATE WINNER'
  | 'LAUNCH NEW CREATIVE BATCH'
  | 'LAUNCH WINNER ITERATIONS'
  | 'LAUNCH NEW FUNNEL'
  | 'SCALE CAMPAIGN'
  | 'TRIM ADS'
  | 'PAUSE / KILL'
  | 'MOVE TO NEW AD ACCOUNT';

export type CreativeRequestType =
  | 'SWIPES'
  | 'PLAYBOOK CONCEPTS'
  | 'SWIPES + PLAYBOOK'
  | 'CURIOSITY ADS'
  | 'WINNER ITERATIONS'
  | 'HOOK VARIATIONS'
  | 'VISUAL VARIATIONS'
  | 'ANGLE VARIATIONS'
  | 'CREATIVE REFRESH'
  | 'BRANDED SEARCH SWIPES'
  | 'SAME SUB-NICHE SWIPES'
  | 'NEW FUNNEL CONCEPT'
  | 'UGC'
  | 'STATIC'
  | 'VIDEO';

export type CampaignStatus = 'LIVE' | 'WATCH' | 'SCALE' | 'KILL' | 'PAUSE';

export type WorkStatus =
  | 'QUEUE'
  | 'MAKING'
  | 'FOR REVIEW'
  | 'CHANGES REQUIRED'
  | 'APPROVED'
  | 'READY'
  | 'IN_SETUP'
  | 'QA'
  | 'LIVE'
  | 'BLOCKED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type UserRole = 'media_buyer' | 'creative' | 'setup' | 'admin' | null;

export interface TeamUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
}

export interface HistoryEntry {
  at: string; // ISO string
  uid: string;
  userDisplayName?: string;
  action: string;
  detail: string;
}

export interface Campaign {
  id: string;
  name: string; // e.g. "CBO FlexiVita 3"
  product: string; // e.g. "FlexiVita"
  market: Market; // e.g. "CA"
  adAccount: string; // e.g. "CA AD 24"
  status: CampaignStatus; // LIVE | WATCH | SCALE | KILL | PAUSE
  stage: string; // e.g. "Winner Expansion", "Initial Testing", "Scale Phase"
  launchDate: string; // e.g. "09/10/26"
  createdAt: string;
  history: HistoryEntry[];
}

export interface AdSet {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string; // e.g. "09/13/26 Swipes + Playbook"
  launchDate: string; // Authoritative database date
  status: 'QUEUE' | 'IN_SETUP' | 'QA' | 'LIVE' | 'PAUSED';
  creativeType: string; // e.g. "SWIPES + PLAYBOOK"
  assignedSetupUser: string; // e.g. "Karl"
  notes?: string;
  createdAt: string;
  launchedAt?: string;
}

export interface WorkTask {
  id: string;
  taskNumber: number; // e.g. 1 -> T-001

  // Core 7 Mandatory Attributes (§2)
  product: string;
  campaign: string;
  campaignId?: string;
  action: CampaignAction;
  owner: string; // Display name of current owner (e.g. Yzah, Karl, Charles)
  ownerUid: string;
  status: WorkStatus;
  deadline: string; // e.g. "Today 6 PM"
  nextAction: string; // e.g. "Hand to Karl for Setup"

  // Context & Metadata
  market: Market;
  adAccount: string; // e.g. "CA AD 24"
  priority: Priority;
  stage: 'Creative' | 'Setup' | 'Live' | 'Review' | 'Blocked';

  // Creative Brief & Output Specs (§18)
  creativeTypes: string[]; // e.g. ["SWIPES", "PLAYBOOK CONCEPTS"]
  quantity: number; // default 8
  quantityDone: number;
  reasonTrigger: string; // e.g. "1 Day After Swipe Batch Launch", "Winner Expansion", "+1 Day Trigger"
  referenceUrl?: string;
  winningReference?: string; // e.g. "CA AD14 Creative 03"
  winningHook?: string; // e.g. "Why melatonin fails you / tart cherry comparison"
  winningAngle?: string;
  whatToKeep?: string; // e.g. "Hook, Offer, Core copy"
  whatToChange?: string; // e.g. "Visual execution, safe-zone framing"
  format?: string; // "9:16 Video", "Static", etc.
  folderUrl?: string; // Google Drive folder URL
  creativeNotes?: string;

  // Setup & Launch Specs (§5 & §14)
  adSetName?: string; // e.g. "09/13/26 Swipes + Playbook"
  dailyBudget?: number; // EUR
  setupNotes?: string;
  assignedSetupUser?: string; // e.g. "Karl"
  funnelReady?: boolean;
  pixelOk?: boolean;
  trackingOk?: boolean;
  launchDate?: string | null; // Authoritative launch date

  // Media Buyer & Review (§19)
  feedback?: string; // Red alert feedback if changes needed
  automationKey?: string; // Deduplication key (e.g. "campId_adsetId_NEXT_DAY_CREATIVE")
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export interface SettingsConfig {
  defaultBatchQty: number;
  adAccounts: string[];
  campaignActions: string[];
  creativeRequestTypes: string[];
  products: string[];
}
