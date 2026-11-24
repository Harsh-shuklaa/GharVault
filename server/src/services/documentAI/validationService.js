import { BaseDocumentSchema } from '../../schemas/document/commonSchema.js';
import { IdentityDocumentSchema } from '../../schemas/document/identitySchema.js';
import { MedicalDocumentSchema } from '../../schemas/document/medicalSchema.js';
import { PropertyDocumentSchema } from '../../schemas/document/propertySchema.js';
import { UtilityDocumentSchema } from '../../schemas/document/utilitySchema.js';
import { EducationDocumentSchema } from '../../schemas/document/educationSchema.js';
import { FinancialDocumentSchema } from '../../schemas/document/financialSchema.js';

/**
 * Validate and safely normalize extracted data against strict Zod category schemas
 */
export function validateExtractedDocument(rawExtracted = {}, category = 'Other', docType = '') {
  const normCat = category || 'Other';
  const normType = docType || rawExtracted.docType || 'Document';

  // Choose the dedicated schema
  let schemaToUse = BaseDocumentSchema;
  if (normCat === 'ID Cards') {
    schemaToUse = IdentityDocumentSchema;
  } else if (normCat === 'Medical & Health') {
    schemaToUse = MedicalDocumentSchema;
  } else if (normCat === 'Bank & Property') {
    if (/electricity|water|gas|utility|bill/i.test(normType)) {
      schemaToUse = UtilityDocumentSchema;
    } else if (/deed|khasra|khatauni|bainama|registry|property/i.test(normType)) {
      schemaToUse = PropertyDocumentSchema;
    } else {
      schemaToUse = FinancialDocumentSchema;
    }
  } else if (normCat === 'Education') {
    schemaToUse = EducationDocumentSchema;
  } else if (normCat === 'Legal') {
    schemaToUse = PropertyDocumentSchema;
  }

  try {
    const validated = schemaToUse.parse(rawExtracted);
    return {
      isValid: true,
      data: validated,
      errors: null,
    };
  } catch (zodErr) {
    console.warn('[Validation Service] Zod validation warning:', zodErr.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    // Safe fallback: populate defaults using safe parsing
    const safeResult = schemaToUse.safeParse(rawExtracted);
    return {
      isValid: safeResult.success,
      data: safeResult.success ? safeResult.data : rawExtracted,
      errors: zodErr.errors,
    };
  }
}
