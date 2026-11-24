export function buildIdentityPrompt({ ocrText = '', memberListText = '' }) {
  return `You are an expert Indian Identity Document Intelligence Specialist for "Dastavej".
Extract information from this Indian official identity document (Aadhaar Card, PAN Card, Driving License, Passport, Voter ID, Birth Certificate, Ration Card).

${memberListText}

OCR EVIDENCE & TEXT:
"""
${(ocrText || '').slice(0, 3000)}
"""

STRICT ANTI-HALLUCINATION RULES:
1. Extract ONLY information physically present in the OCR evidence.
2. NEVER invent missing information. Return null for fields not clearly present.
3. NEVER guess numbers or digits. If Aadhaar/PAN/DL number is partially cut off or illegible, return null.
4. Keep leading zeros in all IDs (e.g. "012345").
5. Do NOT confuse the Holder's name with their Father's or Husband's name.
6. Do NOT confuse Date of Birth with Issue Date or Expiry Date.
7. Return null for address or gender if not explicitly stated on the document.

Return ONLY valid JSON matching:
{
  "docType": "Aadhaar Card | PAN Card | Driving License | Passport | Voter ID | Birth Certificate | Ration Card",
  "docNumber": "Clean ID number without spaces or dashes, or null",
  "docNumberType": "Aadhaar (UID) | PAN | DL Number | Passport Number | EPIC No | null",
  "holderName": "Full legal name of the card holder or null",
  "fatherOrSpouseName": "Father's or Spouse's name or null",
  "dob": "YYYY-MM-DD or null",
  "gender": "Male | Female | Transgender | Other | null",
  "issueDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "address": "Full residential address if printed, else null",
  "pincode": "6-digit Indian PIN code or null",
  "bloodGroup": "Blood group if printed on DL, else null",
  "extractionConfidence": {
    "holderName": 0.95,
    "docNumber": 0.95,
    "dob": 0.90
  },
  "summary": "Crisp 1-sentence summary in simple Hinglish."
}`;
}
