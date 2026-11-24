/**
 * Unified Modular Indian Document Intelligence Pipeline
 * Integrates:
 * 1. Image Preprocessing (orientation, format, adaptive compression)
 * 2. Tesseract OCR with English + Hindi Devanagari support
 * 3. Dedicated Image Quality Assessment (Blur, glare, cut-off feedback)
 * 4. 2-Stage Document Classifier (Deterministic Fast Regex + Ollama LLM)
 * 5. Category-Specific Extraction (Identity, Medical, Property, Utility, Education, Financial)
 * 6. Zod Schema Validation & Strict Anti-Hallucination rules
 * 7. Hinglish Summary Generator
 * 8. Smart Document Title Synthesizer
 */

import { adaptivelyPreprocessImage, validateImageBuffer } from './imagePreprocessing.js';
import { extractTextWithOcr } from './ocrService.js';
import { assessDocumentQuality } from './qualityAssessment.js';
import { classifyDocument } from './documentClassifier.js';
import { extractWithCategoryModel } from './extractionService.js';
import { generateSmartDocumentTitle } from '../aiDocumentScanner.js';
import { getOllamaStatus } from './ollamaService.js';

export async function processDocumentWithIntelligence({
  fileBuffer,
  mimeType = 'image/jpeg',
  fileName = '',
  familyMembers = [],
  cloudFallbackApiKey = null,
}) {
  const t0 = Date.now();

  // 1. Image Validation & Preprocessing
  const validation = validateImageBuffer(fileBuffer, mimeType);
  if (!validation.isValid && !fileName.toLowerCase().endsWith('.pdf')) {
    console.warn('[DocAI Pipeline] Image validation failed:', validation.error);
  }
  const preprocessed = adaptivelyPreprocessImage(fileBuffer);
  const activeBuffer = preprocessed.buffer;

  // 2. OCR Extraction (English + Hindi Devanagari)
  const ocrResult = await extractTextWithOcr(activeBuffer);
  const ocrText = ocrResult.text || '';

  // 3. Document Quality Assessment
  const quality = assessDocumentQuality({
    imageBuffer: activeBuffer,
    ocrResult,
    fileSize: activeBuffer.length,
    fileName,
  });

  // 4. Document Classification
  const classification = await classifyDocument({
    ocrText,
    fileName,
    preferLocalAI: true,
  });

  const category = classification.category || 'Other';
  const docType = classification.docType || 'Document';

  // 5. Category-Specific Extraction
  let extractionResult = null;
  const ollamaStatus = await getOllamaStatus();

  // Only query local LLM if OCR found readable text (>= 10 chars) to prevent unnecessary CPU load
  if (ocrText.trim().length >= 10 && ollamaStatus.isRunning && (ollamaStatus.hasTextModel || ollamaStatus.hasVisionModel)) {
    extractionResult = await extractWithCategoryModel({
      category,
      docType,
      ocrText,
      familyMembers,
      fileName,
    });
  }

  // If local model succeeded, use its structured data
  if (extractionResult?.success && extractionResult.data) {
    const data = extractionResult.data;

    // Auto-match family member
    let matchedMember = null;
    const holder = data.holderName || data.patientName || data.ownerOrBuyerName || data.studentName || '';
    if (holder && familyMembers.length > 0) {
      const cleanH = holder.toLowerCase();
      matchedMember = familyMembers.find(m => cleanH.includes(m.name.toLowerCase().split(' ')[0]));
    }

    const smartTitle = generateSmartDocumentTitle({
      docType: data.docType || docType,
      holderName: holder,
      matchedMemberName: matchedMember?.name,
      docNumber: data.docNumber,
      category,
      originalFileName: fileName,
      summary: data.summary,
    });

    return {
      docType: data.docType || docType,
      category,
      docNumber: data.docNumber || '',
      docNumberType: data.docNumberType || null,
      holderName: holder,
      fatherOrSpouseName: data.fatherOrSpouseName || null,
      dob: data.dob || null,
      expiryDate: data.expiryDate || null,
      issueDate: data.issueDate || null,
      suggestedTitle: smartTitle,
      executiveSummary: data.executiveSummary || (data.summary ? [data.summary] : []),
      summary: data.summary || `${docType} for ${holder || 'Family Member'}`,
      searchKeywords: [docType, category, holder, data.docNumber].filter(Boolean),
      matchedMemberId: matchedMember?._id || null,
      matchedMemberName: matchedMember?.name || '',
      confidence: classification.confidence || 0.9,
      qualityAssessment: quality,
      extractionConfidence: data.extractionConfidence || {},
      evidence: ocrResult.lines?.slice(0, 5) || [],
      ocrText: ocrText.slice(0, 1000),
      aiEngine: extractionResult.aiEngine,
      totalPipelineMs: Date.now() - t0,
    };
  }

  // 6. Graceful Heuristic + OCR Hybrid Fallback (Zero Hallucination, Deterministic)
  console.log('[DocAI Pipeline] Using local OCR + Deterministic Extraction.');
  
  let detectedDocNum = '';
  let detectedDob = null;

  // Regex patterns on verified OCR text
  if (category === 'ID Cards' || docType.includes('Aadhaar')) {
    const m = ocrText.match(/\b([2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/);
    if (m) detectedDocNum = m[1].replace(/[-\s]/g, ' ');
  } else if (docType.includes('PAN')) {
    const m = ocrText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
    if (m) detectedDocNum = m[1].toUpperCase();
  } else if (docType.includes('Driving License')) {
    const m = ocrText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{7,12})\b/i);
    if (m) detectedDocNum = m[1].toUpperCase();
  } else if (docType.includes('Passport')) {
    const m = ocrText.match(/\b([A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9])\b/i);
    if (m) detectedDocNum = m[1].toUpperCase();
  } else if (docType.includes('Voter')) {
    const m = ocrText.match(/\b([A-Z]{3}[0-9]{7})\b/i);
    if (m) detectedDocNum = m[1].toUpperCase();
  } else if (/bill/i.test(docType)) {
    const m = ocrText.match(/(?:consumer|ca|खाता)[^0-9]*([0-9]{8,16})/i);
    if (m) detectedDocNum = m[1];
  }

  const dobMatch = ocrText.match(/\b(?:dob|d\.o\.b\.?|date of birth|birth date|born|janm)[:\s]*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][12][90]\d{2})\b/i) ||
    ocrText.match(/\b([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.](?:19\d{2}|20[0-2]\d))\b/);
  if (dobMatch) detectedDob = dobMatch[1].replace(/[\.\-]/g, '/');

  // Match Member from OCR text
  let matchedMember = null;
  for (const m of familyMembers) {
    const fn = (m.name || '').toLowerCase().trim();
    if (fn && ocrText.toLowerCase().includes(fn)) {
      matchedMember = m;
      break;
    }
  }

  const smartTitle = generateSmartDocumentTitle({
    docType,
    holderName: matchedMember?.name || '',
    matchedMemberName: matchedMember?.name || '',
    docNumber: detectedDocNum,
    category,
    originalFileName: fileName,
    summary: ocrText,
  });

  return {
    docType,
    category,
    docNumber: detectedDocNum,
    docNumberType: detectedDocNum ? `${docType} Number` : null,
    holderName: matchedMember?.name || '',
    fatherOrSpouseName: null,
    dob: detectedDob,
    expiryDate: null,
    issueDate: null,
    suggestedTitle: smartTitle,
    executiveSummary: [`${docType} identified via Tesseract OCR`],
    summary: `${docType} for ${matchedMember?.name || 'Family Member'}`,
    searchKeywords: [docType, category, matchedMember?.name, detectedDocNum].filter(Boolean),
    matchedMemberId: matchedMember?._id || null,
    matchedMemberName: matchedMember?.name || '',
    confidence: detectedDocNum ? 0.90 : classification.confidence,
    qualityAssessment: quality,
    extractionConfidence: {
      docNumber: detectedDocNum ? 0.95 : 0.4,
      holderName: matchedMember ? 0.90 : 0.5,
    },
    evidence: ocrResult.lines?.slice(0, 5) || [],
    ocrText: ocrText.slice(0, 1000),
    aiEngine: 'local_ocr_deterministic',
    totalPipelineMs: Date.now() - t0,
  };
}
