import { z } from 'zod';

export const QualityAssessmentSchema = z.object({
  isBlurry: z.boolean().default(false),
  clarityScore: z.enum(['GOOD', 'FAIR', 'POOR']).default('GOOD'),
  isCropped: z.boolean().default(false),
  isGlarePresent: z.boolean().default(false),
  isRotated: z.boolean().default(false),
  isTextReadable: z.boolean().default(true),
  issueFeedback: z.string().nullable().default(null),
});

export const OcrEvidenceItemSchema = z.object({
  field: z.string(),
  value: z.any(),
  sourceText: z.string().nullable().default(null),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const BaseDocumentSchema = z.object({
  docType: z.string().min(1).default('Document'),
  docNumber: z.string().nullable().default(null),
  docNumberType: z.string().nullable().default(null),
  holderName: z.string().nullable().default(null),
  fatherOrSpouseName: z.string().nullable().default(null),
  dob: z.string().nullable().default(null),
  issueDate: z.string().nullable().default(null),
  expiryDate: z.string().nullable().default(null),
  category: z.enum([
    'ID Cards',
    'Medical & Health',
    'Bank & Property',
    'Education',
    'Legal',
    'Other',
  ]).default('Other'),
  executiveSummary: z.array(z.string()).default([]),
  summary: z.string().default(''),
  searchKeywords: z.array(z.string()).default([]),
  qualityAssessment: QualityAssessmentSchema.default({}),
  extractionConfidence: z.record(z.string(), z.number().min(0).max(1)).default({}),
  evidence: z.array(OcrEvidenceItemSchema).default([]),
});

export default BaseDocumentSchema;
