import assert from 'assert';
import { detectHeuristicDuplicate } from '../src/routes/document.routes.js';

console.log('================================================================');
console.log('🧪 DASTAVEJ DUPLICATE DOCUMENT PREVENTION TEST SUITE');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}\n   Error: ${err.message}`);
    failed++;
  }
}

const mockFamilyMembers = [
  { _id: 'mem_1', name: 'Rahul Sharma', relationship: 'Self' },
  { _id: 'mem_2', name: 'Priya Sharma', relationship: 'Spouse' },
  { _id: 'mem_3', name: 'Sunita Sharma', relationship: 'Mother' },
];

const mockExistingDocs = [
  {
    _id: 'doc_101',
    title: 'Aadhaar Card — Rahul',
    category: 'ID Cards',
    documentNumber: '5492 1029 4812',
    sha256Hash: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
    assignedMemberId: { _id: 'mem_1', name: 'Rahul Sharma' },
    createdAt: new Date('2026-01-15'),
  },
  {
    _id: 'doc_102',
    title: 'Papa PAN Card',
    category: 'ID Cards',
    documentNumber: 'ABCPS1234D',
    sha256Hash: 'ffff0000111122223333444455556666777788889999aaaabbbbccccddddeeee',
    assignedMemberId: { _id: 'mem_3', name: 'Sunita Sharma' },
    createdAt: new Date('2026-02-10'),
  },
  {
    _id: 'doc_103',
    title: 'Plot 42 Registry Sale Deed',
    category: 'Bank & Property',
    documentNumber: 'REG-892/2026',
    sha256Hash: '9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff',
    assignedMemberId: { _id: 'mem_1', name: 'Rahul Sharma' },
    createdAt: new Date('2026-03-01'),
  },
];

// Test 1: Tier 1 - Exact SHA-256 File Match
test('Tier 1: Exact File Match via SHA-256 Hash', () => {
  const result = detectHeuristicDuplicate({
    fileSha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
    scanDocNumber: null,
    scanDocType: null,
    suggestedTitle: 'New Random Name.jpg',
    fileName: 'scanned_doc.jpg',
    matchedMemberId: 'mem_1',
    existingDocs: mockExistingDocs,
    familyMembers: mockFamilyMembers,
  });

  assert.strictEqual(result?.isDuplicate, true);
  assert.strictEqual(result?.matchType, 'EXACT_FILE');
  assert.strictEqual(result?.existingDocId, 'doc_101');
  assert.strictEqual(result?.assignedMemberName, 'Rahul Sharma');
});

// Test 2: Tier 2 - Document Number Match (Ignoring Spaces & Hyphens)
test('Tier 2: Normalized Document Number Match (Aadhaar with hyphens vs spaces)', () => {
  const result = detectHeuristicDuplicate({
    fileSha256: 'different_hash_from_new_camera_photo_12345',
    scanDocNumber: '5492-1029-4812', // Format with hyphens
    scanDocType: 'Aadhaar Card',
    suggestedTitle: 'Aadhaar Front.jpg',
    fileName: 'photo_aadhaar.jpg',
    matchedMemberId: null,
    existingDocs: mockExistingDocs,
    familyMembers: mockFamilyMembers,
  });

  assert.strictEqual(result?.isDuplicate, true);
  assert.strictEqual(result?.matchType, 'ID_NUMBER');
  assert.strictEqual(result?.existingDocId, 'doc_101');
  assert.strictEqual(result?.documentNumber, '5492-1029-4812');
});

// Test 3: Tier 2 - PAN Card Case-Insensitive Match
test('Tier 2: PAN Card Case-Insensitive Match', () => {
  const result = detectHeuristicDuplicate({
    fileSha256: 'new_hash_different_file',
    scanDocNumber: 'abcps1234d', // Lowercase
    scanDocType: 'PAN Card',
    suggestedTitle: 'PAN Card Scan',
    fileName: 'pan.pdf',
    matchedMemberId: null,
    existingDocs: mockExistingDocs,
    familyMembers: mockFamilyMembers,
  });

  assert.strictEqual(result?.isDuplicate, true);
  assert.strictEqual(result?.matchType, 'ID_NUMBER');
  assert.strictEqual(result?.existingDocId, 'doc_102');
});

// Test 4: Tier 3 - Fuzzy Title Match for Same Member
test('Tier 3: Heuristic Title Token Overlap (Plot Registry)', () => {
  const result = detectHeuristicDuplicate({
    fileSha256: 'another_unique_hash',
    scanDocNumber: null,
    scanDocType: 'Property Deed',
    suggestedTitle: 'Plot 42 Registry Document Copy',
    fileName: 'plot_42_registry.pdf',
    matchedMemberId: 'mem_1',
    existingDocs: mockExistingDocs,
    familyMembers: mockFamilyMembers,
  });

  assert.strictEqual(result?.isDuplicate, true);
  assert.strictEqual(result?.matchType, 'HEURISTIC_TITLE_MATCH');
  assert.strictEqual(result?.existingDocId, 'doc_103');
});

// Test 5: Negative Case - Brand New Document
test('Negative Case: Unique Document Passes Without Warning', () => {
  const result = detectHeuristicDuplicate({
    fileSha256: 'completely_unique_sha256_hash_987654321',
    scanDocNumber: 'DL0420220019283',
    scanDocType: 'Driving License',
    suggestedTitle: 'Priya Driving License',
    fileName: 'priya_dl.jpg',
    matchedMemberId: 'mem_2',
    existingDocs: mockExistingDocs,
    familyMembers: mockFamilyMembers,
  });

  assert.strictEqual(result, null);
});

console.log('\n================================================================');
console.log(`📊 DUPLICATE DETECTION REPORT: ${passed} / ${passed + failed} TESTS PASSED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 3 TIERS OF DUPLICATE PREVENTION VERIFIED 100% WORKING!\n');
}
