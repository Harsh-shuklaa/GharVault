import { getOfficialRenewalInfo } from '../server/src/routes/notification.routes.js';

console.log('=== Running Smart Expiry & Renewal Sentinel Tests ===\n');

// Test 1: Driving License Renewal Info
const dlDoc = { title: 'Sunil Sharma Driving License', category: 'ID Cards', tags: ['DL', 'transport'] };
const dlInfo = getOfficialRenewalInfo(dlDoc);
console.log('Test 1 - DL Renewal:', dlInfo);
if (dlInfo.type !== 'DRIVING_LICENSE' || !dlInfo.url.includes('sarathi.parivahan.gov.in')) {
  throw new Error('Failed Test 1: DL Renewal mapping incorrect');
}
console.log('PASS: Test 1 Passed!\n');

// Test 2: Pollution Certificate (PUC)
const pucDoc = { title: 'Car Pollution Certificate (PUC)', category: 'Vehicle', tags: ['puc'] };
const pucInfo = getOfficialRenewalInfo(pucDoc);
console.log('Test 2 - PUC Renewal:', pucInfo);
if (pucInfo.type !== 'PUC' || !pucInfo.url.includes('vahan.parivahan.gov.in/puc')) {
  throw new Error('Failed Test 2: PUC Renewal mapping incorrect');
}
console.log('PASS: Test 2 Passed!\n');

// Test 3: Vehicle RC & Fitness
const rcDoc = { title: 'Honda City Vehicle RC & Fitness', category: 'Vehicle', tags: ['rc'] };
const rcInfo = getOfficialRenewalInfo(rcDoc);
console.log('Test 3 - Vehicle RC:', rcInfo);
if (rcInfo.type !== 'VEHICLE_RC' || !rcInfo.url.includes('vahan.parivahan.gov.in')) {
  throw new Error('Failed Test 3: RC Renewal mapping incorrect');
}
console.log('PASS: Test 3 Passed!\n');

// Test 4: Passport Renewal
const passDoc = { title: 'Republic of India Passport', category: 'ID Cards', tags: ['passport'] };
const passInfo = getOfficialRenewalInfo(passDoc);
console.log('Test 4 - Passport Renewal:', passInfo);
if (passInfo.type !== 'PASSPORT' || !passInfo.url.includes('passportindia.gov.in')) {
  throw new Error('Failed Test 4: Passport mapping incorrect');
}
console.log('PASS: Test 4 Passed!\n');

// Test 5: Health & Motor Insurance
const insDoc = { title: 'Star Health Family Mediclaim Policy', category: 'Medical & Health', tags: ['insurance'] };
const insInfo = getOfficialRenewalInfo(insDoc);
console.log('Test 5 - Insurance Renewal:', insInfo);
if (insInfo.type !== 'INSURANCE') {
  throw new Error('Failed Test 5: Insurance mapping incorrect');
}
console.log('PASS: Test 5 Passed!\n');

console.log('ALL SMART EXPIRY & RENEWAL TESTS PASSED! 🎯');
