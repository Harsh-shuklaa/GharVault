export function buildFinancialPrompt({ ocrText = '', memberListText = '' }) {
  return `You are a Financial & Transaction Document Specialist for "Dastavej".
Extract structured information from this Financial Record (Bank Passbook, Bank Statement, Cheque, Salary Slip, Tax Invoice, or Payment Receipt).

${memberListText}

OCR EVIDENCE & TEXT:
"""
${(ocrText || '').slice(0, 3000)}
"""

STRICT ANTI-HALLUCINATION RULES:
1. Keep leading zeros in Bank Account Numbers.
2. Mask or preserve exact IFSC codes (e.g. SBIN0001234).
3. Distinguish between Account Holder Name and Bank/Branch Name.
4. Return null for unreadable or missing values.

Return ONLY valid JSON matching:
{
  "docType": "Bank Passbook | Bank Statement | Bank Cheque | Salary Slip | Tax Invoice / Bill",
  "bankName": "Bank name (e.g. State Bank of India, HDFC Bank) or null",
  "accountNumber": "Account number with leading zeros or null",
  "holderName": "Full name of account holder or employee or null",
  "ifscCode": "11-character Indian IFSC code or null",
  "branchName": "Bank branch locality or null",
  "accountType": "Savings | Current | Salary | FD | null",
  "invoiceNumber": "Invoice or bill receipt number or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "totalAmount": "Total transaction or balance amount or null",
  "extractionConfidence": {
    "holderName": 0.95,
    "accountNumber": 0.90
  },
  "summary": "Crisp 1-sentence summary in simple Hinglish."
}`;
}
