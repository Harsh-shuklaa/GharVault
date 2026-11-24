import { z } from 'zod';
import { BaseDocumentSchema } from './commonSchema.js';

export const ChauhaddiSchema = z.object({
  north: z.string().nullable().default(null),
  south: z.string().nullable().default(null),
  east: z.string().nullable().default(null),
  west: z.string().nullable().default(null),
}).nullable().default(null);

export const PropertyDocumentSchema = BaseDocumentSchema.extend({
  propertyType: z.string().nullable().default(null), // Residential Plot, Agricultural Land, Commercial Shop, Flat, etc.
  ownerOrBuyerName: z.string().nullable().default(null),
  sellerName: z.string().nullable().default(null),
  khasraNumber: z.string().nullable().default(null),
  khatauniNumber: z.string().nullable().default(null),
  deedNumber: z.string().nullable().default(null),
  bahiNumber: z.string().nullable().default(null),
  zildNumber: z.string().nullable().default(null),
  registrationDate: z.string().nullable().default(null),
  plotOrHouseNumber: z.string().nullable().default(null),
  area: z.string().nullable().default(null),
  areaUnit: z.string().nullable().default(null), // Gaj, Sq. Yards, Bigha, Acre, etc.
  villageOrMauza: z.string().nullable().default(null),
  tehsil: z.string().nullable().default(null),
  district: z.string().nullable().default(null),
  saleConsideration: z.string().nullable().default(null),
  stampDuty: z.string().nullable().default(null),
  chauhaddi: ChauhaddiSchema,
  category: z.literal('Bank & Property').default('Bank & Property'),
});

export default PropertyDocumentSchema;
