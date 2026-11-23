import crypto from 'crypto';
import { fallbackHeuristicScanner } from '../server/src/services/aiDocumentScanner.js';
import { detectHeuristicDuplicate } from '../server/src/routes/document.routes.js';

console.log('=== Running Multi-Tier Heuristic Duplicate Tests ===\n');

// Mock existing docs
const bufferA = Buffer.from('Sample Document Content 12345');
const hashA = crypto.createHash('sha256').update(bufferA).digest('hex');

const existingDocs = [
  {
    _id: 'doc_existing_1',
    title: "Papa's PAN Card",
    documentNumber: 'ABCDE1234F',
    sha256Hash: hashA,
    assignedMemberId: { _id: 'u1', name: 'Sunil Sharma', relationship: 'Father' },
    createdAt: new Date('2026-01-12'),
  },
  {
    _id: 'doc_existing_2',
    title: 'Electricity Bill Jan 2026',
    documentNumber: 'CA99482910',
    sha256Hash: 'different_hash_0987',
    assignedMemberId: { _id: 'u1', name: 'Sunil Sharma', relationship: 'Father' },
    createdAt: new Date('2026-01-15'),
  },
  {
    _id: 'doc_existing_3',
    title: 'Vehicle Driving License',
    documentNumber: 'DL0420110012345',
    sha256Hash: 'hash_dl_333',
    assignedMemberId: { _id: 'u2', name: 'Aditya Sharma', relationship: 'Self' },
    createdAt: new Date('2026-02-01'),
  }
];

const familyMembers = [
  { _id: 'u1', name: 'Sunil Sharma', relationship: 'Father' },
  { _id: 'u2', name: 'Aditya Sharma', relationship: 'Self' }
];

// Test Tier 1: Exact SHA-256 Hash Match (100% Zero-AI)
const resTier1 = detectHeuristicDuplicate({
  fileSha256: hashA,
  scanDocNumber: 'RANDOM123',
  scanDocType: 'PAN Card',
  suggestedTitle: 'New Upload',
  fileName: 'photo_download.jpg',
  matchedMemberId: 'u1',
  existingDocs,
  familyMembers,
});
console.log('Tier 1 Result:', resTier1);
if (!resTier1 || resTier1.matchType !== 'EXACT_FILE' || resTier1.confidence !== 1.0) {
  throw new Error('Failed Tier 1: Exact SHA-256 match');
}
console.log('PASS: Tier 1 Passed!\n');

// Test Tier 2: Semantic Document ID Number Match (Offline Regex)
const resTier2 = detectHeuristicDuplicate({
  fileSha256: 'fresh_unique_hash_9999',
  scanDocNumber: 'abcde-1234f', // lowercase with hyphen
  scanDocType: 'PAN Card',
  suggestedTitle: 'Camera Capture',
  fileName: 'IMG_4821.jpg',
  matchedMemberId: 'u1',
  existingDocs,
  familyMembers,
});
console.log('Tier 2 Result:', resTier2);
if (!resTier2 || resTier2.matchType !== 'ID_NUMBER' || resTier2.documentNumber !== 'abcde-1234f') {
  throw new Error('Failed Tier 2: Semantic ID Number match');
}
console.log('PASS: Tier 2 Passed!\n');

// Test Tier 3: Heuristic Title & Filename Fuzzy Token Match
const resTier3 = detectHeuristicDuplicate({
  fileSha256: 'another_unique_hash_8888',
  scanDocNumber: '', // No ID number found
  scanDocType: 'Other',
  suggestedTitle: 'Papa PAN Card Final',
  fileName: 'papa_pan_card.jpg',
  matchedMemberId: 'u1',
  existingDocs,
  familyMembers,
});
console.log('Tier 3 Result:', resTier3);
if (!resTier3 || resTier3.matchType !== 'HEURISTIC_TITLE_MATCH') {
  throw new Error('Failed Tier 3: Heuristic title token match');
}
console.log('PASS: Tier 3 Passed!\n');

console.log('ALL HEURISTIC MULTI-TIER DUPLICATE TESTS PASSED! 🎯');
