export function buildClassificationPrompt({ ocrText = '', fileName = '' }) {
  return `You are an Indian Document Classifier for the secure vault "Dastavej".
Analyze the text and metadata extracted from an Indian document and identify its type and category.

DOCUMENT METADATA & OCR TEXT:
Filename: ${fileName}
Extracted Text:
"""
${(ocrText || '').slice(0, 2000)}
"""

TASK:
Classify the document into one of the following categories:
- "ID Cards": Aadhaar Card, PAN Card, Driving License, Passport, Voter ID, Birth Certificate, Ration Card, Domicile Certificate, Caste Certificate.
- "Medical & Health": Doctor Prescription, Medical Lab Report, Hospital Discharge Summary, Health Insurance Policy.
- "Bank & Property": Property Sale Deed (Bainama), Khasra-Khatauni, Land Registry, Rent Agreement, Bank Passbook, Bank Statement, Salary Slip, Electricity Bill, Water Bill, Piped Gas Bill.
- "Education": Degree, Semester Marksheet/DMC, Diploma, Certificate of Merit/Competition.
- "Legal": Affidavit, Will, Court Order, Marriage Certificate, Death Certificate.
- "Other": Vehicle RC, Vehicle Insurance, Warranty Card, Miscellaneous.

ANTI-HALLUCINATION RULES:
1. Base your classification ONLY on visible text evidence.
2. If text is completely unreadable or insufficient to identify, return "docType": "Document", "category": "Other", "confidence": 0.3.
3. If multiple documents appear in one photo, set "isMultipleDocuments": true.

Return ONLY a valid JSON object:
{
  "docType": "Specific Document Name (e.g. Aadhaar Card, PAN Card, Doctor Prescription, Property Sale Deed, Electricity Bill, Marksheet, etc.)",
  "category": "One of ['ID Cards', 'Medical & Health', 'Bank & Property', 'Education', 'Legal', 'Other']",
  "confidence": 0.95,
  "language": "Hindi | English | Mixed",
  "isMultipleDocuments": false
}`;
}
