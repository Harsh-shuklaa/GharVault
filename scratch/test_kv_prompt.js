import fs from 'fs';

async function testKeyValuePrompt() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');

  const prompt = `Identify this Indian document and extract:
1. Document Type (e.g. Voter ID, PAN Card, Aadhaar Card, Driving License):
2. Document Number / ID:
3. Person Name:
4. Father Name:
5. Date of Birth or Year:`;

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moondream',
      prompt,
      images: [base64Data],
      stream: false,
      options: {
        num_predict: 120,
        temperature: 0.1
      }
    })
  });

  const d = await res.json();
  console.log('--- Raw Response without format:json ---');
  console.log(d.response);
}

testKeyValuePrompt().catch(console.error);
