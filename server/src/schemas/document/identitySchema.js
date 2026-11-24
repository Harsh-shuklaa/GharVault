import { z } from 'zod';
import { BaseDocumentSchema } from './commonSchema.js';

export const IdentityDocumentSchema = BaseDocumentSchema.extend({
  gender: z.enum(['Male', 'Female', 'Transgender', 'Other']).nullable().default(null),
  address: z.string().nullable().default(null),
  pincode: z.string().nullable().default(null),
  bloodGroup: z.string().nullable().default(null),
  nationality: z.string().nullable().default('Indian'),
  category: z.literal('ID Cards').default('ID Cards'),
});

export default IdentityDocumentSchema;
