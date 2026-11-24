import { buildIdentityPrompt } from '../../prompts/document/identityPrompt.js';
import { buildMedicalPrompt } from '../../prompts/document/medicalPrompt.js';
import { buildPropertyPrompt } from '../../prompts/document/propertyPrompt.js';
import { buildUtilityPrompt } from '../../prompts/document/utilityPrompt.js';
import { buildEducationPrompt } from '../../prompts/document/educationPrompt.js';
import { buildFinancialPrompt } from '../../prompts/document/financialPrompt.js';
import { queryOllamaJSON } from './ollamaService.js';
import { validateExtractedDocument } from './validationService.js';
import { generateHinglishSummary } from './summaryService.js';

/**
 * Mask sensitive document numbers for safe logging (Aadhaar, PAN, Bank A/C)
 */
export function maskSensitiveId(val) {
  if (!val || typeof val !== 'string') return '';
  const clean = val.trim();
  if (clean.length <= 4) return '****';
  return clean.slice(0, 2) + '****' + clean.slice(-2);
}

/**
 * Execute category-specific extraction using Local Ollama
 */
export async function extractWithCategoryModel({
  category = 'ID Cards',
  docType = 'Document',
  ocrText = '',
  familyMembers = [],
  fileName = '',
}) {
  const memberListText = familyMembers.length > 0
    ? `Registered Family Members in this vault:\n${familyMembers.map(m => `- ID: "${m._id}", Name: "${m.name}" (${m.relationship || 'Member'})`).join('\n')}\nMatch rule: prioritize first name.`
    : '';

  let prompt = '';
  if (category === 'ID Cards') {
    prompt = buildIdentityPrompt({ ocrText, memberListText });
  } else if (category === 'Medical & Health') {
    prompt = buildMedicalPrompt({ ocrText, memberListText });
  } else if (category === 'Bank & Property') {
    if (/electricity|water|gas|utility|bill/i.test(docType)) {
      prompt = buildUtilityPrompt({ ocrText, memberListText });
    } else if (/deed|khasra|khatauni|bainama|registry/i.test(docType)) {
      prompt = buildPropertyPrompt({ ocrText, memberListText });
    } else {
      prompt = buildFinancialPrompt({ ocrText, memberListText });
    }
  } else if (category === 'Education') {
    prompt = buildEducationPrompt({ ocrText, memberListText });
  } else {
    prompt = buildIdentityPrompt({ ocrText, memberListText });
  }

  // Execute extraction via Local Ollama
  const ollamaRes = await queryOllamaJSON({
    prompt,
    taskType: 'text',
    timeoutMs: 20000,
    temperature: 0.1,
  });

  if (ollamaRes.success && ollamaRes.data) {
    const rawData = ollamaRes.data;
    const validated = validateExtractedDocument(rawData, category, docType);
    const summaryData = generateHinglishSummary(validated.data);

    // Safe masked log
    if (validated.data.docNumber) {
      console.log(`[Extraction Service] Successfully extracted ID (${maskSensitiveId(validated.data.docNumber)}) via Ollama ${ollamaRes.model}`);
    }

    return {
      success: true,
      data: {
        ...validated.data,
        ...summaryData,
      },
      aiEngine: `ollama_local (${ollamaRes.model})`,
      elapsedMs: ollamaRes.elapsedMs,
    };
  }

  return {
    success: false,
    error: ollamaRes.error || 'EXTRACTION_FAILED',
    message: ollamaRes.message || 'Could not extract via local model',
  };
}
