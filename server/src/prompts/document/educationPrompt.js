export function buildEducationPrompt({ ocrText = '', memberListText = '' }) {
  return `You are an Academic Credentials Specialist for "Dastavej".
Extract structured educational qualifications from this Indian Academic Document (Degree, Diploma, Semester Marksheet/DMC, Class 10/12 Certificate, or Competition/Award Certificate).

${memberListText}

OCR EVIDENCE & TEXT:
"""
${(ocrText || '').slice(0, 3000)}
"""

CRITICAL EDUCATION ANTI-HALLUCINATION RULES:
1. NEVER calculate percentage or CGPA unless explicitly printed on the document. Return null if not stated.
2. Distinguish between Student Name and Father/Mother Name.
3. Extract exact Roll Number and Registration/Enrollment Number.
4. If passing year is unclear, return null.

Return ONLY valid JSON matching:
{
  "docType": "Education Degree | Marksheet / DMC | Diploma | Competition Certificate",
  "institution": "School, college, or institute name or null",
  "universityOrBoard": "University or examination board (e.g. CBSE, Delhi University, AKTU) or null",
  "studentName": "Full name of candidate/student or null",
  "holderName": "Full name of candidate/student or null",
  "rollNumber": "Roll number or seat number or null",
  "registrationNumber": "Enrollment or registration number or null",
  "courseOrDegree": "Degree or class (e.g. B.Tech, BCA, Class 10, Class 12) or null",
  "semesterOrYear": "Semester or year (e.g. 6th Semester, Final Year) or null",
  "passingYear": "Year of passing (e.g. 2024) or null",
  "totalMarks": "Total marks obtained or null",
  "percentage": "Percentage if explicitly printed, else null",
  "cgpa": "CGPA if explicitly printed, else null",
  "certificateTitle": "Specific title of certificate or award or null",
  "extractionConfidence": {
    "studentName": 0.95,
    "rollNumber": 0.90,
    "courseOrDegree": 0.90
  },
  "summary": "Crisp 1-sentence summary in simple Hinglish."
}`;
}
