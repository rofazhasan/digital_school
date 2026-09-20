import assert from 'assert';
import { DayMode, ChallengeCategory, ChallengePriority } from '@prisma/client';

// Simulated pure business logic assertions for mode restrictions
function validateMutationAllowed(dayMode: DayMode, isLocked: boolean, isEditingExistingParams: boolean, emergencyReason?: string) {
  if (isLocked || dayMode === DayMode.LOCKED) {
    if (!emergencyReason) {
      throw new Error('DAY_LOCKED: Day plan is immutable.');
    }
    return { allowed: true, audited: true };
  }

  if (dayMode === DayMode.STRICT) {
    if (isEditingExistingParams && !emergencyReason) {
      throw new Error('DAY_STRICT: Strict mode preserves commitment integrity.');
    }
    return { allowed: true, audited: Boolean(emergencyReason) };
  }

  return { allowed: true, audited: false };
}

console.log('🧪 RUNNING MODE RESTRICTION & IMMUTABILITY LOGIC TESTS\n');

// 1. Normal mode allows edits without audit requirement
const normalRes = validateMutationAllowed(DayMode.NORMAL, false, true);
assert.strictEqual(normalRes.allowed, true);
assert.strictEqual(normalRes.audited, false);
console.log('  ✓ Normal mode allows mutations freely.');

// 2. Strict mode rejects editing parameters without reason
assert.throws(() => {
  validateMutationAllowed(DayMode.STRICT, false, true);
}, /DAY_STRICT/);
console.log('  ✓ Strict mode throws error on unauthorized parameter mutation.');

// 3. Strict mode allows editing if emergency reason is provided
const strictWithReason = validateMutationAllowed(DayMode.STRICT, false, true, 'Illness emergency');
assert.strictEqual(strictWithReason.allowed, true);
assert.strictEqual(strictWithReason.audited, true);
console.log('  ✓ Strict mode allows mutation with logged emergency reason.');

// 4. Locked mode rejects any mutation without reason
assert.throws(() => {
  validateMutationAllowed(DayMode.LOCKED, true, false);
}, /DAY_LOCKED/);
console.log('  ✓ Locked mode completely rejects mutations.');

// 5. Locked mode requires override reason
const lockedOverride = validateMutationAllowed(DayMode.LOCKED, true, true, 'Official reschedule override');
assert.strictEqual(lockedOverride.allowed, true);
assert.strictEqual(lockedOverride.audited, true);
console.log('  ✓ Locked mode emergency override requires audit.');

console.log('\n🎉 ALL MODE RESTRICTION LOGIC TESTS PASSED!');
