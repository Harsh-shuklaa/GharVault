import { fallbackVaultAssistant } from '../server/src/services/vaultChatAssistant.js';

console.log('=== Running Dastavej Vault AI Khasra Tests ===\n');

// Mock Family Members
const familyMembers = [
  { _id: 'mem_1', name: 'Rajesh Sharma', relationship: 'Father', bloodGroup: 'O+' },
  { _id: 'mem_2', name: 'Sunita Sharma', relationship: 'Mother', bloodGroup: 'B+' },
  { _id: 'mem_3', name: 'Ankit Sharma', relationship: 'Son', bloodGroup: 'O+' },
];

// Test Case A: Full property details pre-extracted
const docA = {
  _id: 'doc_1',
  title: 'Mauza Rampur Agricultural Land Registry',
  category: 'Bank & Property',
  documentNumber: 'Khasra #312/4',
  assignedMemberId: 'mem_1',
  ocrExtractedData: {
    propertyDetails: {
      ownerName: 'Rajesh Sharma',
      khasraNumber: '312/4',
      khatauniNumber: '0089',
      plotOrHouseNumber: 'Plot 4A',
      area: '2.5 Bigha',
      locality: 'Mauza Rampur',
      chauhaddi: {
        north: 'Rasta Pukhta',
        south: 'Nahar',
        east: 'Khet Suresh Kumar',
        west: 'Chak Road'
      }
    }
  }
};

const resA = fallbackVaultAssistant({
  query: 'Khet ka Khasra number aur plot ki chauhaddi kya hai?',
  familyMembers,
  documents: [docA]
});

console.log('[Test A: Pre-extracted PropertyDetails]');
console.log('Answer:\n', resA.answer);
console.log('Copyable:', resA.copyableValue);
console.log('Action:', resA.suggestedAction);
console.log('Engine:', resA.engine);
if (resA.copyableValue !== '312/4' || !resA.answer.includes('312/4')) {
  console.error('FAIL: Test A failed to resolve Khasra number!');
  process.exit(1);
}
console.log('PASS: Test A passed!\n---\n');

// Test Case B: No propertyDetails object, Khasra and Chauhaddi in notes & title
const docB = {
  _id: 'doc_2',
  title: 'Khasra 145/2 Land Sale Deed',
  category: 'Legal',
  documentNumber: 'DEED-9921',
  notes: 'Khasra No: 145/2, Plot 18, Rakba: 200 sq yards, Mauza: Raipur. Chauhaddi - Uttar: Road, Purav: Plot 19, Dakshin: Gali, Paschim: Suresh Field.',
  ocrExtractedData: {}
};

const resB = fallbackVaultAssistant({
  query: 'Khet ka Khasra number aur plot ki chauhaddi kya hai?',
  familyMembers,
  documents: [docB]
});

console.log('[Test B: Khasra in Title & Notes]');
console.log('Answer:\n', resB.answer);
console.log('Copyable:', resB.copyableValue);
if (resB.copyableValue !== '145/2' || !resB.answer.includes('145/2')) {
  console.error('FAIL: Test B failed to extract Khasra from notes/title!');
  process.exit(1);
}
console.log('PASS: Test B passed!\n---\n');

// Test Case C: Khasra in documentNumber ("520/1") with pure Hindi OCR text
const docC = {
  _id: 'doc_3',
  title: 'Kagaz Registry',
  category: 'Bank & Property',
  documentNumber: '520/1',
  ocrExtractedData: {
    rawText: 'पंजीकरण विलेख: क्रेता: राजेश शर्मा, खसरा संख्या: 520/1, रकबा: 150 वर्ग गज, चौहद्दी: उत्तर: रास्ता'
  }
};

const resC = fallbackVaultAssistant({
  query: 'Papa ka Khasra number batao',
  familyMembers,
  documents: [docC]
});

console.log('[Test C: Khasra in rawText & docNumber]');
console.log('Answer:\n', resC.answer);
console.log('Copyable:', resC.copyableValue);
if (resC.copyableValue !== '520/1' || !resC.answer.includes('520/1')) {
  console.error('FAIL: Test C failed!');
  process.exit(1);
}
console.log('PASS: Test C passed!\n---\n');

// Test Case D: No property document in vault
const docD = {
  _id: 'doc_4',
  title: 'Aadhaar Card Rajesh',
  category: 'ID Cards',
  documentNumber: '1234 5678 9012'
};

const resD = fallbackVaultAssistant({
  query: 'Khet ka Khasra number aur plot ki chauhaddi kya hai?',
  familyMembers,
  documents: [docD]
});

console.log('[Test D: No Property Document in Vault]');
console.log('Answer:\n', resD.answer);
if (!resD.answer.includes('Registry') || !/upload/i.test(resD.answer)) {
  console.error('FAIL: Test D should provide helpful upload instructions!');
  process.exit(1);
}
console.log('PASS: Test D passed!\n---\n');

console.log('ALL KHASRA VAULT AI TESTS PASSED SUCCESSFULLY! 🎯');
