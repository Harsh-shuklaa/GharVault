export function buildPropertyPrompt({ ocrText = '', memberListText = '' }) {
  return `You are an Indian Land & Property Legal Document Specialist for "Dastavej".
Extract structured property details from this Indian Property Document (Sale Deed / Registry / Bainama / बैनामा, Khasra / Khatauni, Jamabandi, Fard, or Plot Deed).

${memberListText}

OCR EVIDENCE & TEXT:
"""
${(ocrText || '').slice(0, 3000)}
"""

CRITICAL PROPERTY ANTI-HALLUCINATION RULES:
1. Preserve original Hindi legal terminology (Khasra, Khatauni, Chauhaddi, Mauza, Tehsil, Bahi, Zild).
2. NEVER confuse Buyer (Krayakarta / क्रेता / Purchaser) with Seller (Vikreta / विक्रेता / Vendor).
3. NEVER confuse Witnesses (Gawah) or Deed Writer (Katib) with the actual Property Owner.
4. If a boundary (Purav, Paschim, Uttar, Dakshin) is illegible or not listed, return null for that boundary.
5. Do NOT calculate property rights or ownership if document is incomplete. Return null.

Return ONLY valid JSON matching:
{
  "docType": "Property Sale Deed | Khasra / Khatauni | Land Registry | Rent Agreement",
  "propertyType": "Residential Plot | Agricultural Land | Commercial Shop | Flat / Apartment | null",
  "ownerOrBuyerName": "Full name of buyer or owner or null",
  "holderName": "Full name of buyer or owner or null",
  "sellerName": "Full name of seller or vendor or null",
  "khasraNumber": "Khasra number (e.g. 452/1) or null",
  "khatauniNumber": "Khatauni or Jamabandi number or null",
  "deedNumber": "Deed / Wasika / Registry number or null",
  "bahiNumber": "Bahi number or null",
  "zildNumber": "Zild / Jild number or null",
  "registrationDate": "YYYY-MM-DD or null",
  "plotOrHouseNumber": "Plot / Flat / House number or null",
  "area": "Area measurement (e.g. 200 Gaj, 1800 Sq. Ft, 2 Bigha) or null",
  "areaUnit": "Gaj | Sq. Yards | Sq. Ft | Bigha | Acre | Hectare | null",
  "villageOrMauza": "Mauza / Village name or null",
  "tehsil": "Tehsil name or null",
  "district": "District name or null",
  "saleConsideration": "Sale amount / Consideration in ₹ or null",
  "stampDuty": "Stamp duty paid amount or null",
  "chauhaddi": {
    "north": "Uttar boundary / adjacent plot / road or null",
    "south": "Dakshin boundary or null",
    "east": "Purav boundary or null",
    "west": "Paschim boundary or null"
  },
  "extractionConfidence": {
    "ownerOrBuyerName": 0.95,
    "khasraNumber": 0.90,
    "area": 0.90
  },
  "summary": "Crisp 1-sentence summary in simple Hinglish."
}`;
}
