import { z } from 'zod';
import { BaseDocumentSchema } from './commonSchema.js';

export const FinancialDocumentSchema = BaseDocumentSchema.extend({
  bankName: z.string().nullable().default(null),
  accountNumber: z.string().nullable().default(null),
  ifscCode: z.string().nullable().default(null),
  branchName: z.string().nullable().default(null),
  accountType: z.string().nullable().default(null),
  invoiceNumber: z.string().nullable().default(null),
  invoiceDate: z.string().nullable().default(null),
  totalAmount: z.string().nullable().default(null),
  category: z.enum(['Bank & Property', 'Legal', 'Other']).default('Bank & Property'),
});

export default FinancialDocumentSchema;
