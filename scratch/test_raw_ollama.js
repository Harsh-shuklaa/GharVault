import fs from 'fs';

async function inspectRawOllama() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');

  console.log('Sending raw prompt to moondream...');
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moondream',
      prompt: 'Describe all the text you see in this image. Read every word, number, name and details carefully.',
      images: [base64Data],
      stream: false,
      options: {
        num_predict: 200,
        temperature: 0.1
      }
    })
  });

  const data = await res.json();
  console.log('--- Raw Response ---');
  console.log(data.response);
}

inspectRawOllama().catch(console.error);
