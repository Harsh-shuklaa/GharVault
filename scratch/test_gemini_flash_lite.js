import fs from 'fs';

async function testFullGeminiFlashLite() {
  const API_KEY = process.env.GEMINI_API_KEY;
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');

  const prompt = `You are an expert Indian Document Intelligence System for a secure family vault app called "Dastavej".
Analyze this official document image and extract details in valid JSON:
{
  "docType": "Voter ID Card",
  "docNumber": "Clean ID number",
  "holderName": "Name of person",
  "fatherOrSpouseName": "Father or husband name",
  "dob": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "category": "ID Cards or Medical & Health or Bank & Property or Education or Legal or Other",
  "summary": "Crisp 1-sentence summary"
}
Return ONLY valid JSON.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json'
      }
    })
  });

  const data = await res.json();
  const elapsed = (Date.now() - t0) / 1000;
  console.log(`Scan completed in ${elapsed}s!`);
  console.log('Result:\n', data.candidates?.[0]?.content?.parts?.[0]?.text || data);
}

testFullGeminiFlashLite().catch(console.error);
