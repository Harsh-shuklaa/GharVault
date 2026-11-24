export function buildMedicalPrompt({ ocrText = '', memberListText = '' }) {
  return `You are a Medical Document Intelligence Specialist for the family vault "Dastavej".
Analyze the attached Medical Document (Doctor Prescription, Clinic Slip, Diagnostic Lab Report, Hospital Discharge Summary, or Health Insurance Card).

${memberListText}

OCR EVIDENCE & TEXT:
"""
${(ocrText || '').slice(0, 3000)}
"""

CRITICAL MEDICAL ANTI-HALLUCINATION RULES:
1. NEVER invent medical advice, diagnoses, or medicines.
2. NEVER convert vague symptoms into confirmed diseases (e.g., if "fever" is mentioned, do NOT diagnose "Typhoid" unless explicitly written).
3. Extract medicines only if clearly readable. If dosage is illegible, set dosage to null.
4. Distinguish between Doctor's name and Patient's name clearly.
5. If consultation date is missing or illegible, return null.

Return ONLY valid JSON matching:
{
  "docType": "Doctor Prescription | Medical Lab Report | Hospital Discharge Summary | Health Insurance",
  "patientName": "Full name of patient or insured or null",
  "holderName": "Full legal name of patient or null",
  "doctorName": "Doctor full name with Dr. prefix or null",
  "hospitalOrClinic": "Hospital, clinic, nursing home or lab name or null",
  "consultationDate": "YYYY-MM-DD or null",
  "diagnosis": "Chief complaint, disease or primary reason for visit or null",
  "symptoms": ["List of symptoms mentioned, or empty array"],
  "medicines": [
    {
      "name": "Medicine name (e.g. Paracetamol)",
      "dosage": "e.g. 650mg or null",
      "frequency": "e.g. TDS, twice daily, OD or null",
      "duration": "e.g. 5 days or null"
    }
  ],
  "recommendedTests": ["Lab tests or scans recommended, or empty array"],
  "reportFindings": ["Key test findings or observations if diagnostic report, or empty array"],
  "followUpDate": "YYYY-MM-DD or null",
  "emergencyDetails": {
    "bloodGroup": "e.g. B+ or null",
    "tpaProvider": "TPA / Insurance provider name or null",
    "policyNumber": "Policy number or cashless card number or null",
    "tollFreeHelpLine": "Emergency toll-free hospital helpline or null",
    "allergies": "Known drug/food allergies or null",
    "emergencyContactPhone": "Emergency contact number or null",
    "sumInsured": "Sum insured amount or null"
  },
  "extractionConfidence": {
    "patientName": 0.95,
    "doctorName": 0.90,
    "diagnosis": 0.85
  },
  "summary": "Crisp 1-sentence summary in simple Hinglish."
}`;
}
