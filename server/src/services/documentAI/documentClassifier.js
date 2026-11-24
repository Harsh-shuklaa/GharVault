import { buildClassificationPrompt } from '../../prompts/document/classificationPrompt.js';
import { queryOllamaJSON } from './ollamaService.js';

/**
 * Fast Deterministic OCR Evidence Pattern Matcher
 * Detects Indian documents without waiting for an LLM when text contains definitive markers
 */
export function fastDeterministicClassification(ocrText = '', fileName = '') {
  const combined = `${fileName} ${ocrText}`.replace(/[_-]/g, ' ').toLowerCase();

  // 1. Identity Documents
  if (/\b(aadhaar|uidai|mera aadhaar|unique identification authority of india)\b/i.test(combined)) {
    return { docType: 'Aadhaar Card', category: 'ID Cards', confidence: 0.98, method: 'deterministic_ocr' };
  }
  if (/\b(income tax department|permanent account number|govt of india income tax|\bpan\b)\b/i.test(combined) && !/parchi|parcha/i.test(combined)) {
    return { docType: 'PAN Card', category: 'ID Cards', confidence: 0.98, method: 'deterministic_ocr' };
  }
  if (/\b(driving licen[cs]e|transport department|form 7|union of india driving)\b/i.test(combined) && !/medical licen[cs]e/i.test(combined)) {
    return { docType: 'Driving License', category: 'ID Cards', confidence: 0.95, method: 'deterministic_ocr' };
  }
  if (/\b(republic of india passport|passport seva|given name|type p|country code ind)\b/i.test(combined)) {
    return { docType: 'Passport', category: 'ID Cards', confidence: 0.98, method: 'deterministic_ocr' };
  }
  if (/\b(election commission of india|elector photo identity card|voter|epic no)\b/i.test(combined)) {
    return { docType: 'Voter ID', category: 'ID Cards', confidence: 0.95, method: 'deterministic_ocr' };
  }
  if (/\b(birth certificate|janm praman|municipal corporation.*birth)\b/i.test(combined)) {
    return { docType: 'Birth Certificate', category: 'ID Cards', confidence: 0.95, method: 'deterministic_ocr' };
  }
  if (/\b(ration card|rashan card|nfsa|food and civil supplies)\b/i.test(combined)) {
    return { docType: 'Ration Card', category: 'ID Cards', confidence: 0.95, method: 'deterministic_ocr' };
  }

  // 2. Medical Documents
  const isMedCandidate = /\b(prescription|rx|dr\.|doctor|clinic|hospital|patient|diagnosis|mediclaim|ayushman|discharge summary|lab report|pathology)\b/i.test(combined);
  if (isMedCandidate) {
    let docType = 'Medical Record';
    if (/\b(discharge summary|discharge slip)\b/i.test(combined)) docType = 'Hospital Discharge Summary';
    else if (/\b(lab report|blood test|pathology report|test report)\b/i.test(combined)) docType = 'Medical Lab Report';
    else if (/\b(prescription|parchi|parcha|doctor|rx)\b/i.test(combined)) docType = 'Doctor Prescription';
    else if (/\b(insurance|mediclaim|tpa|policy|ayushman)\b/i.test(combined)) docType = 'Health Insurance';

    return { docType, category: 'Medical & Health', confidence: 0.92, method: 'deterministic_ocr' };
  }

  // 3. Property & Legal
  if (/(?:\b(sale deed|bainama|bai-nama|registry|krayakarta|vikreta)\b|(?:बैनामा|रजिस्ट्री|क्रेता|विक्रेता|विक्रय\s*पत्र))/i.test(combined)) {
    return { docType: 'Property Sale Deed', category: 'Bank & Property', confidence: 0.94, method: 'deterministic_ocr' };
  }
  if (/(?:\b(khasra|khatauni|jamabandi|fard)\b|(?:खसरा|खतौनी|जमाबंदी|फर्द))/i.test(combined)) {
    return { docType: 'Khasra / Khatauni', category: 'Bank & Property', confidence: 0.94, method: 'deterministic_ocr' };
  }
  if (/(?:\b(rent agreement|lease agreement|tenancy agreement|kirayanama|kiraya)\b|(?:किरायानामा|किराया))/i.test(combined)) {
    return { docType: 'Rent Agreement', category: 'Legal', confidence: 0.94, method: 'deterministic_ocr' };
  }

  // 4. Utility Bills
  if (/\b(electricity|bijli|power|bses|uppcl|tata power|consumer no|meter no|units consumed|due date)\b/i.test(combined) && /\b(bill|payable|due)\b/i.test(combined)) {
    const isWater = /water|jal board/i.test(combined);
    const isGas = /gas|igl|indane/i.test(combined);
    const docType = isWater ? 'Water Bill' : (isGas ? 'Piped Gas Bill' : 'Electricity Bill');
    return { docType, category: 'Bank & Property', confidence: 0.95, method: 'deterministic_ocr' };
  }

  // 5. Education
  if (/\b(marksheet|mark sheet|grade sheet|semester|dmc|board of secondary|university|degree|diploma|cgpa)\b/i.test(combined) && !/vehicle/i.test(combined)) {
    const docType = /degree/i.test(combined) ? 'Education Degree' : (/diploma/i.test(combined) ? 'Diploma' : 'Marksheet / DMC');
    return { docType, category: 'Education', confidence: 0.92, method: 'deterministic_ocr' };
  }

  // 6. Financial
  if (/\b(salary slip|payslip|pay slip|net pay|gross pay|basic pay)\b/i.test(combined)) {
    return { docType: 'Salary Slip', category: 'Bank & Property', confidence: 0.95, method: 'deterministic_ocr' };
  }
  if (/\b(passbook|bank statement|account statement|ifsc)\b/i.test(combined)) {
    const docType = /passbook/i.test(combined) ? 'Bank Passbook' : 'Bank Statement';
    return { docType, category: 'Bank & Property', confidence: 0.94, method: 'deterministic_ocr' };
  }

  // 7. Vehicle
  if (/\b(registration certificate|vehicle rc|car rc|bike rc|chassis no|engine no)\b/i.test(combined) && !/parchi/i.test(combined)) {
    return { docType: 'Vehicle RC', category: 'Other', confidence: 0.94, method: 'deterministic_ocr' };
  }

  return null;
}

/**
 * 2-Stage Hybrid Document Classifier
 * Combines fast deterministic regex with LLM intelligence for ambiguous documents
 */
export async function classifyDocument({ ocrText = '', fileName = '', preferLocalAI = true }) {
  // Stage 1: Fast Deterministic Match (Instant 0ms, 100% reliable)
  const fastMatch = fastDeterministicClassification(ocrText, fileName);
  if (fastMatch && fastMatch.confidence >= 0.90) {
    return {
      ...fastMatch,
      language: /[\u0900-\u097F]/.test(ocrText) ? 'Hindi / Mixed' : 'English',
      isMultipleDocuments: false,
    };
  }

  // Stage 2: Ollama Local LLM Classifier
  if (preferLocalAI && ocrText.length > 20) {
    try {
      const prompt = buildClassificationPrompt({ ocrText, fileName });
      const ollamaRes = await queryOllamaJSON({
        prompt,
        taskType: 'text',
        timeoutMs: 15000,
        temperature: 0.1,
      });

      if (ollamaRes.success && ollamaRes.data?.category) {
        return {
          docType: ollamaRes.data.docType || 'Document',
          category: ollamaRes.data.category || 'Other',
          confidence: ollamaRes.data.confidence || 0.85,
          language: ollamaRes.data.language || 'English',
          isMultipleDocuments: !!ollamaRes.data.isMultipleDocuments,
          method: `ollama (${ollamaRes.model})`,
        };
      }
    } catch (e) {
      console.warn('[Classifier] Ollama classification fallback:', e.message);
    }
  }

  // Default fallback if text is sparse or ambiguous
  return {
    docType: 'Family Document',
    category: 'Other',
    confidence: 0.5,
    language: 'English',
    isMultipleDocuments: false,
    method: 'fallback_heuristic',
  };
}
