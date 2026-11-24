import fs from 'fs';

async function testTranscription() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');

  const p = `Read and transcribe the text visible on this card:
Card Name:
Card Number:
Elector Name:
Father's Name:`;

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moondream',
      prompt: p,
      images: [base64Data],
      stream: false,
      options: {
        num_predict: 120,
        temperature: 0.1
      }
    })
  });

  const d = await res.json();
  console.log('Result:\n', d.response);
}

testTranscription().catch(console.error);
