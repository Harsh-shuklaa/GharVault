import fs from 'fs';

async function testWarmQwen() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');

  console.log('Sending image to warm Qwen2.5-VL 3B...');
  const t0 = Date.now();
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5vl:3b',
      prompt: 'Extract details from this Indian Voter ID card: Card Number, Elector Name, Father Name in JSON: {"docType": "Voter ID", "docNumber": "", "holderName": "", "fatherName": ""}',
      images: [base64Data],
      stream: false,
      format: 'json',
      options: {
        num_predict: 80,
        temperature: 0.1
      }
    }),
    signal: AbortSignal.timeout(90000)
  });

  const d = await res.json();
  const elapsed = (Date.now() - t0) / 1000;
  console.log(`Completed in ${elapsed}s!`);
  console.log('Response:\n', d.response);
}

testWarmQwen().catch(console.error);
