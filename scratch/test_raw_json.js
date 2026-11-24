import fs from 'fs';

async function testRawJson() {
  const buf = fs.readFileSync('C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg');
  const base64Data = buf.toString('base64');
  
  const prompt = `Extract Indian document details in JSON format:
{
  "docType": "Aadhaar Card or PAN Card or Driving License or Passport or Vehicle RC or Health Insurance or Electricity Bill or Marksheet or Other",
  "docNumber": "ID number, PAN, Aadhaar, or Policy No",
  "holderName": "Full name of person",
  "dob": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "category": "ID Cards or Medical or Vehicle or Financial or Property or Education or Personal",
  "summary": "Crisp 1-sentence summary"
}
Output valid JSON only.`;

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moondream',
      prompt,
      images: [base64Data],
      stream: false,
      format: 'json',
      options: { num_predict: 120, temperature: 0.1 }
    })
  });

  const data = await res.json();
  console.log('RAW RESPONSE:');
  console.log(data.response);
}

testRawJson();
