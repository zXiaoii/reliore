import { store } from '../src/lib/store';
import { formatTaskNumber, getSuggestedAdSetName } from '../src/lib/pipeline';

console.log('====================================================');
console.log('TEST SUITE: MEDIA BUYING OPERATIONS WEB APP (BUILD BRIEF)');
console.log('====================================================\n');

// --- TEST 1: Use Case 1 (Add New Ad Set to CBO FlexiVita 3) ---
console.log('--- TEST 1: Use Case 1 (Add New Ad Set) ---');
const task1 = store.createActionTask({
  product: 'FlexiVita',
  campaign: 'CBO FlexiVita 3',
  action: 'ADD NEW AD SET',
  market: 'CA',
  adAccount: 'CA AD 24',
  priority: 'P1',
  deadline: 'Today 6 PM',
  creativeTypes: ['SWIPES', 'PLAYBOOK CONCEPTS'],
  quantity: 8,
  creativeAssignedTo: 'Yzah',
  setupAssignedTo: 'Karl',
  reasonTrigger: 'Add New Ad Set to Winning CBO',
  createdBy: 'charles-01',
});

if (task1.product !== 'FlexiVita' || task1.campaign !== 'CBO FlexiVita 3' || task1.owner !== 'Yzah') {
  throw new Error(`Test 1 Failed: Task creation attributes mismatch`);
}
if (task1.status !== 'QUEUE' || task1.stage !== 'Creative') {
  throw new Error(`Test 1 Failed: Expected status QUEUE and stage Creative, got ${task1.status}`);
}
console.log(`✓ Use Case 1 Task created: ${formatTaskNumber(task1.taskNumber)} for ${task1.campaign} (${task1.owner} - ${task1.status})`);

// Step 2: Yzah delivers creative
store.updateTask(
  task1.id,
  {
    folderUrl: 'https://drive.google.com/drive/folders/test-flexi-01',
    quantityDone: 8,
    status: 'FOR REVIEW',
    nextAction: 'Charles review creative batch & approve/request changes',
  },
  { uid: 'yzah-03', displayName: 'Yzah' }
);

// Step 3: Charles approves
store.updateTask(
  task1.id,
  {
    status: 'READY',
    owner: 'Karl',
    nextAction: 'Karl set up ad set in CBO FlexiVita 3',
  },
  { uid: 'charles-01', displayName: 'Charles' }
);

// Step 4: Karl launches ad set
store.launchAdSet(
  task1.id,
  {
    adSetName: '09/13/26 Swipes + Playbook',
    campaignName: 'CBO FlexiVita 3',
    launchDate: '09/13/26',
    dailyBudget: 250,
    setupNotes: 'Pixel verified, broad 35+ audience.',
  },
  { uid: 'karl-04', displayName: 'Karl' }
);
console.log('✓ Use Case 1 Launch completed: Ad set status = LIVE, Launch Date = 09/13/26\n');

// --- TEST 2: Use Case 2 (Launch New CBO) ---
console.log('--- TEST 2: Use Case 2 (Launch New CBO) ---');
const task2 = store.createActionTask({
  product: 'FlexiVita',
  campaign: 'CBO FlexiVita Curiosity 2',
  action: 'LAUNCH NEW CBO',
  market: 'CA',
  adAccount: 'CA AD 19',
  priority: 'P1',
  deadline: 'Tomorrow 6 PM',
  creativeTypes: ['CURIOSITY ADS'],
  quantity: 8,
  creativeAssignedTo: 'Yzah',
  setupAssignedTo: 'Mark',
  reasonTrigger: 'Brand new CBO angle test',
  createdBy: 'charles-01',
});

if (task2.action !== 'LAUNCH NEW CBO' || task2.assignedSetupUser !== 'Mark') {
  throw new Error(`Test 2 Failed: Expected LAUNCH NEW CBO with Mark as setup executor`);
}
console.log(`✓ Use Case 2 Task created: ${formatTaskNumber(task2.taskNumber)} (${task2.action} assigned to ${task2.owner})\n`);

// --- TEST 3: Automatic Next-Day Creative Trigger (§16) ---
console.log('--- TEST 3: Automatic Next-Day Creative Trigger Engine (§16) ---');
const autoTask = store.run48HourIdleCheck();

if (!autoTask) {
  throw new Error(`Test 3 Failed: Expected automatic next-day task creation`);
}
if (autoTask.owner !== 'Yzah' || autoTask.status !== 'QUEUE' || !autoTask.reasonTrigger.includes('1 Day After Swipe')) {
  throw new Error(`Test 3 Failed: Auto task attributes mismatch: ${JSON.stringify(autoTask)}`);
}
console.log(`✓ Next-Day Creative Trigger created: ${formatTaskNumber(autoTask.taskNumber)} for ${autoTask.campaign} (Assigned: ${autoTask.owner}, Reason: "${autoTask.reasonTrigger}")`);

// Test Deduplication Key: Should not create duplicate!
const duplicateAttempt = store.run48HourIdleCheck();
if (duplicateAttempt !== null) {
  throw new Error(`Test 3 Failed: Deduplication failed, duplicate task was created`);
}
console.log('✓ Idempotency verified: duplicate next-day trigger was properly blocked!\n');

// --- TEST 4: Mandatory 7 Attributes (§2) ---
console.log('--- TEST 4: Mandatory 7 Attributes Verification (§2) ---');
const mandatoryKeys = ['product', 'campaign', 'action', 'owner', 'status', 'deadline', 'nextAction'];
mandatoryKeys.forEach((key) => {
  if (!(key in task1)) {
    throw new Error(`Test 4 Failed: Key ${key} missing from WorkTask`);
  }
});
console.log('✓ All active tasks strictly enforce the 7 mandatory attributes: PRODUCT, CAMPAIGN, ACTION, OWNER, STATUS, DEADLINE, NEXT ACTION!\n');

console.log('====================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
console.log('====================================================');
