import { z } from 'zod';
import { BaseDocumentSchema } from './commonSchema.js';

export const UtilityDocumentSchema = BaseDocumentSchema.extend({
  serviceProvider: z.string().nullable().default(null),
  billType: z.enum([
    'Electricity Bill',
    'Water Bill',
    'Piped Gas Bill',
    'Utility Bill',
  ]).default('Electricity Bill'),
  consumerNumber: z.string().nullable().default(null),
  meterNumber: z.string().nullable().default(null),
  registeredConsumerName: z.string().nullable().default(null),
  billAmount: z.string().nullable().default(null),
  billingPeriod: z.string().nullable().default(null),
  billDueDate: z.string().nullable().default(null),
  previousReading: z.string().nullable().default(null),
  currentReading: z.string().nullable().default(null),
  unitsConsumed: z.string().nullable().default(null),
  category: z.literal('Bank & Property').default('Bank & Property'),
});

export default UtilityDocumentSchema;
