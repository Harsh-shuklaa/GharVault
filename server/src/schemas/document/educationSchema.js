import { z } from 'zod';
import { BaseDocumentSchema } from './commonSchema.js';

export const SubjectMarkSchema = z.object({
  subject: z.string(),
  marksObtained: z.string().nullable().default(null),
  maxMarks: z.string().nullable().default(null),
  grade: z.string().nullable().default(null),
});

export const EducationDocumentSchema = BaseDocumentSchema.extend({
  institution: z.string().nullable().default(null),
  universityOrBoard: z.string().nullable().default(null),
  studentName: z.string().nullable().default(null),
  rollNumber: z.string().nullable().default(null),
  registrationNumber: z.string().nullable().default(null),
  courseOrDegree: z.string().nullable().default(null),
  semesterOrYear: z.string().nullable().default(null),
  passingYear: z.string().nullable().default(null),
  subjectWiseMarks: z.array(SubjectMarkSchema).nullable().default(null),
  totalMarks: z.string().nullable().default(null),
  percentage: z.string().nullable().default(null),
  cgpa: z.string().nullable().default(null),
  certificateTitle: z.string().nullable().default(null),
  category: z.literal('Education').default('Education'),
});

export default EducationDocumentSchema;
