export function buildUtilityPrompt({ ocrText = '', memberListText = '' }) {
  return `You are a Utility Bill Intelligence Specialist for "Dastavej".
Extract information from this Indian Utility Bill (Electricity Bill, Water Bill, Piped Gas Bill, or Municipal Tax Bill).

${memberListText}

OCR EVIDENCE & TEXT:
"""
${(ocrText || '').slice(0, 3000)}
"""

STRICT UTILITY ANTI-HALLUCINATION RULES:
1. Do NOT confuse the Bill Issue Date with the Bill Due Date (Pay By Date).
2. Extract the exact Consumer CA Number, K-Number, or Connection ID with leading zeros preserved.
3. If meter number or previous/current reading is unreadable, return null.
4. Extract only the total payable amount before the due date.

Return ONLY valid JSON matching:
{
  "docType": "Electricity Bill | Water Bill | Piped Gas Bill | Utility Bill",
  "serviceProvider": "Utility provider name (e.g. UPPCL, BSES Yamuna, Tata Power, Delhi Jal Board, IGL) or null",
  "consumerNumber": "Consumer Account (CA) number or connection ID or null",
  "meterNumber": "Meter serial number or null",
  "registeredConsumerName": "Name of registered consumer or null",
  "holderName": "Name of registered consumer or null",
  "billAmount": "Total payable bill amount (e.g. ₹2,450) or null",
  "billingPeriod": "Billing month or cycle or null",
  "billDueDate": "Due date in YYYY-MM-DD or null",
  "previousReading": "Previous meter reading or null",
  "currentReading": "Current meter reading or null",
  "unitsConsumed": "Total units consumed or null",
  "extractionConfidence": {
    "consumerNumber": 0.95,
    "billAmount": 0.95,
    "billDueDate": 0.90
  },
  "summary": "Crisp 1-sentence summary in simple Hinglish."
}`;
}
