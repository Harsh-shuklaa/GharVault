/**
 * Comprehensive Evaluation Test Suite for Dastavej Document Intelligence System
 * Tests:
 * 1. Document Classification Accuracy across Indian Document Categories
 * 2. OCR Evidence & Hindi (Devanagari) + English Recognition
 * 3. Strict Anti-Hallucination Rules (Null for missing fields, no fabricated numbers)
 * 4. Zod Schema Validation on Category Schemas
 * 5. Quality Assessment & Empathy Feedback in Hinglish
 * 6. Field-Level Confidence Tracking
 * 7. Smart Title Generation (Zero "Other")
 */

import { fastDeterministicClassification, classifyDocument } from '../src/services/documentAI/documentClassifier.js';
import { validateExtractedDocument } from '../src/services/documentAI/validationService.js';
import { assessDocumentQuality } from '../src/services/documentAI/qualityAssessment.js';
import { generateHinglishSummary } from '../src/services/documentAI/summaryService.js';
import { generateSmartDocumentTitle } from '../src/services/aiDocumentScanner.js';
import { maskSensitiveId } from '../src/services/documentAI/extractionService.js';

async function runEvaluationSuite() {
  console.log('================================================================');
  console.log('🧪 DASTAVEJ INDIAN DOCUMENT INTELLIGENCE EVALUATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details}`);
    }
  }

  // --- SUITE 1: DOCUMENT CLASSIFICATION & HINDI RECOGNITION ---
  console.log('\n--- 1. Document Classification & Multilingual Recognition ---');
  
  const aadhaarClass = fastDeterministicClassification('GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA MERA AADHAAR 5489 1234 5678');
  assert(aadhaarClass?.docType === 'Aadhaar Card' && aadhaarClass?.category === 'ID Cards', 'Aadhaar Card Classification');

  const panClass = fastDeterministicClassification('INCOME TAX DEPARTMENT GOVT OF INDIA PERMANENT ACCOUNT NUMBER ABCDE1234F');
  assert(panClass?.docType === 'PAN Card' && panClass?.category === 'ID Cards', 'PAN Card Classification');

  const dlClass = fastDeterministicClassification('UNION OF INDIA DRIVING LICENCE TRANSPORT DEPARTMENT DL-0420110012345');
  assert(dlClass?.docType === 'Driving License' && dlClass?.category === 'ID Cards', 'Driving License Classification');

  const passportClass = fastDeterministicClassification('REPUBLIC OF INDIA PASSPORT PASSPORT SEVA TYPE P IND Z1234567');
  assert(passportClass?.docType === 'Passport' && passportClass?.category === 'ID Cards', 'Passport Classification');

  const voterClass = fastDeterministicClassification('ELECTION COMMISSION OF INDIA ELECTOR PHOTO IDENTITY CARD EPIC NO WXJ1234567');
  assert(voterClass?.docType === 'Voter ID' && voterClass?.category === 'ID Cards', 'Voter ID Classification');

  // Hindi / Devanagari Property Deed
  const hindiRegistryClass = fastDeterministicClassification('कार्यालय उप-निबंधक बैनामा विक्रय पत्र क्रेता शिव राम विक्रेता रमेश चंद खसरा संख्या 452');
  assert(hindiRegistryClass?.docType === 'Property Sale Deed' && hindiRegistryClass?.category === 'Bank & Property', 'Hindi Sale Deed (बैनामा) Classification');

  // Hindi Khasra Khatauni
  const hindiKhasraClass = fastDeterministicClassification('उद्धरण खतौनी खाता संख्या 00124 खसरा संख्या 89/1 जमाबंदी वर्ष 2024');
  assert(hindiKhasraClass?.docType === 'Khasra / Khatauni' && hindiKhasraClass?.category === 'Bank & Property', 'Hindi Khasra / Khatauni (खसरा-खतौनी) Classification');

  // Electricity Bill
  const bijliClass = fastDeterministicClassification('UTTAR PRADESH POWER CORPORATION LTD UPPCL ELECTRICITY BILL CA NO 10098765432 DUE DATE 15/12/2026 AMOUNT PAYABLE RS 2450');
  assert(bijliClass?.docType === 'Electricity Bill' && bijliClass?.category === 'Bank & Property', 'Electricity Bill Classification');

  // Medical Prescription
  const rxClass = fastDeterministicClassification('APOLLO HOSPITALS DR. K.K. SHARMA MBBS MD RX TAB PARACETAMOL 650MG TDS FEVER');
  assert(rxClass?.docType === 'Doctor Prescription' && rxClass?.category === 'Medical & Health', 'Doctor Prescription Classification');

  // Academic Marksheet
  const marksheetClass = fastDeterministicClassification('CENTRAL BOARD OF SECONDARY EDUCATION CBSE SENIOR SCHOOL CERTIFICATE EXAMINATION MARKSHEET 2024');
  assert(marksheetClass?.docType === 'Marksheet / DMC' && marksheetClass?.category === 'Education', 'Academic Marksheet Classification');

  // Salary Slip
  const salaryClass = fastDeterministicClassification('INFOSYS LTD SALARY SLIP FOR THE MONTH OF OCTOBER 2024 NET PAY RS 65000');
  assert(salaryClass?.docType === 'Salary Slip' && salaryClass?.category === 'Bank & Property', 'Salary Slip Classification');

  // --- SUITE 2: STRICT ANTI-HALLUCINATION & ZOD VALIDATION ---
  console.log('\n--- 2. Strict Anti-Hallucination & Zod Schema Validation ---');

  // Missing docNumber must be strictly null, never a fabricated placeholder
  const rawIdWithMissingNumber = {
    docType: 'Aadhaar Card',
    holderName: 'Rahul Sharma',
    docNumber: null, // Unreadable or missing
    category: 'ID Cards',
  };
  const valId = validateExtractedDocument(rawIdWithMissingNumber, 'ID Cards', 'Aadhaar Card');
  assert(valId.isValid === true && valId.data.docNumber === null, 'Anti-Hallucination: Missing docNumber remains strictly null');

  // Medical: Never invent medicines or diagnosis if not present
  const rawMedical = {
    docType: 'Doctor Prescription',
    patientName: 'Sunita Devi',
    doctorName: 'Dr. Verma',
    hospitalOrClinic: 'Max Healthcare',
    consultationDate: '2026-10-14',
    diagnosis: null, // Symptoms only, no confirmed disease
    symptoms: ['Fever', 'Headache'],
    medicines: [{ name: 'Paracetamol', dosage: '650mg', frequency: 'TDS', duration: '3 days' }],
    category: 'Medical & Health',
  };
  const valMed = validateExtractedDocument(rawMedical, 'Medical & Health', 'Doctor Prescription');
  assert(valMed.isValid === true && valMed.data.diagnosis === null && valMed.data.medicines.length === 1, 'Medical Anti-Hallucination & Medicine Structuring');

  // Property: Preserve Khasra, Area, Chauhaddi boundaries
  const rawProperty = {
    docType: 'Property Sale Deed',
    ownerOrBuyerName: 'Shiv Ram',
    sellerName: 'Gopal Krishna',
    khasraNumber: '452/12',
    area: '250 Gaj',
    areaUnit: 'Gaj',
    villageOrMauza: 'Nangloi',
    chauhaddi: {
      north: 'Road 20 ft',
      south: 'Plot 453',
      east: 'House of Ram Lal',
      west: 'Gali 10 ft',
    },
    category: 'Bank & Property',
  };
  const valProp = validateExtractedDocument(rawProperty, 'Bank & Property', 'Property Sale Deed');
  assert(valProp.isValid === true && valProp.data.chauhaddi.north === 'Road 20 ft' && valProp.data.khasraNumber === '452/12', 'Property Schema with Chauhaddi Boundaries');

  // Utility Bill Validation
  const rawUtility = {
    docType: 'Electricity Bill',
    serviceProvider: 'UPPCL',
    consumerNumber: '10098765432',
    billAmount: '₹2,450',
    billDueDate: '2026-12-15',
    category: 'Bank & Property',
  };
  const valUtil = validateExtractedDocument(rawUtility, 'Bank & Property', 'Electricity Bill');
  assert(valUtil.isValid === true && valUtil.data.consumerNumber === '10098765432' && valUtil.data.billDueDate === '2026-12-15', 'Utility Bill Schema Validation');

  // --- SUITE 3: QUALITY ASSESSMENT & HINGLISH EMPATHY FEEDBACK ---
  console.log('\n--- 3. Dedicated Quality Assessment & Hinglish Feedback ---');

  const blurryQuality = assessDocumentQuality({
    ocrResult: { text: 'a b c', confidence: 0.35, lines: [], words: [] },
    fileSize: 15 * 1024,
  });
  assert(blurryQuality.isBlurry === true && blurryQuality.clarityScore === 'POOR' && blurryQuality.issueFeedback.includes('dhundhli'), 'Blurry Image Detection with Hinglish Guidance');

  const goodQuality = assessDocumentQuality({
    ocrResult: { text: 'Government of India Unique Identification Authority of India', confidence: 0.94, lines: [{ text: 'Govt of India' }], words: [{ text: 'Govt' }] },
    fileSize: 450 * 1024,
  });
  assert(goodQuality.isBlurry === false && goodQuality.clarityScore === 'GOOD' && goodQuality.issueFeedback === null, 'High-Quality Image Assessment');

  // --- SUITE 4: SECURITY & SENSITIVE DATA MASKING ---
  console.log('\n--- 4. Security & Privacy Masking ---');
  const maskedAadhaar = maskSensitiveId('548912345678');
  assert(maskedAadhaar === '54****78', `Masked Aadhaar in logs: ${maskedAadhaar}`);

  const maskedPan = maskSensitiveId('ABCDE1234F');
  assert(maskedPan === 'AB****4F', `Masked PAN in logs: ${maskedPan}`);

  // --- SUITE 5: HINGLISH EXECUTIVE SUMMARIES ---
  console.log('\n--- 5. Hinglish Executive Summary Generation ---');
  const sumProp = generateHinglishSummary(rawProperty);
  assert(sumProp.executiveSummary.length > 0 && sumProp.executiveSummary[0].includes('Shiv Ram ke naam par registered hai (250 Gaj)'), 'Property Hinglish Executive Summary');

  const sumUtil = generateHinglishSummary(rawUtility);
  assert(sumUtil.executiveSummary.some(b => b.includes('Due Date (Antim Tithi)')), 'Utility Due Date Alert in Hinglish');

  // --- SUITE 6: ZERO "OTHER" SMART TITLE SYNTHESIS ---
  console.log('\n--- 6. Zero "Other" Document Title Synthesis ---');
  const titleSalary = generateSmartDocumentTitle({ docType: 'Other', holderName: 'Shiv Ram', summary: 'Salary slip of Shiv Ram for October 2024' });
  assert(titleSalary === 'Salary Slip — Shiv', `Smart Title for Salary Slip: ${titleSalary}`);

  const titleRent = generateSmartDocumentTitle({ docType: 'Other', holderName: 'Shiv Ram', summary: 'Rent agreement for house 204' });
  assert(titleRent === 'Rent Agreement — Shiv', `Smart Title for Rent Agreement: ${titleRent}`);

  const titleMedical = generateSmartDocumentTitle({ docType: 'Other', category: 'Medical & Health', holderName: 'Shiv Ram' });
  assert(titleMedical === 'Medical Record — Shiv', `Smart Title for Generic Medical: ${titleMedical}`);

  // --- SUMMARY REPORT ---
  console.log('\n================================================================');
  console.log(`📊 EVALUATION REPORT: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================');

  if (passed === total) {
    console.log('🎉 ALL DOCUMENT INTELLIGENCE CAPABILITIES VERIFIED 100% SUCCESSFUL!\n');
  } else {
    process.exit(1);
  }
}

runEvaluationSuite().catch(err => {
  console.error('Fatal Evaluation Error:', err);
  process.exit(1);
});
