import { z } from 'zod';
import { BaseDocumentSchema } from './commonSchema.js';

export const MedicineItemSchema = z.object({
  name: z.string(),
  dosage: z.string().nullable().default(null),
  frequency: z.string().nullable().default(null),
  duration: z.string().nullable().default(null),
});

export const MedicalDocumentSchema = BaseDocumentSchema.extend({
  patientName: z.string().nullable().default(null),
  doctorName: z.string().nullable().default(null),
  hospitalOrClinic: z.string().nullable().default(null),
  consultationDate: z.string().nullable().default(null),
  diagnosis: z.string().nullable().default(null),
  symptoms: z.array(z.string()).nullable().default(null),
  medicines: z.array(MedicineItemSchema).nullable().default(null),
  recommendedTests: z.array(z.string()).nullable().default(null),
  reportFindings: z.array(z.string()).nullable().default(null),
  followUpDate: z.string().nullable().default(null),
  emergencyDetails: z.object({
    bloodGroup: z.string().nullable().default(null),
    tpaProvider: z.string().nullable().default(null),
    policyNumber: z.string().nullable().default(null),
    tollFreeHelpLine: z.string().nullable().default(null),
    allergies: z.string().nullable().default(null),
    emergencyContactPhone: z.string().nullable().default(null),
    sumInsured: z.string().nullable().default(null),
  }).nullable().default(null),
  category: z.literal('Medical & Health').default('Medical & Health'),
});

export default MedicalDocumentSchema;
