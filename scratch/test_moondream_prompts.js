import fs from 'fs';

async function testPrompts() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');

  const prompts = [
    "What is the title, card number, elector name, and father name written on this document? List them clearly.",
    "Read all the text visible on this card line by line.",
    "Extract the details from this card: \nDocument Type:\nCard Number:\nName:\nFather's Name:\nDate of Birth:"
  ];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n=== Prompt ${i + 1} ===\n${prompts[i]}`);
    const t0 = Date.now();
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moondream',
        prompt: prompts[i],
        images: [base64Data],
        stream: false,
        options: {
          num_predict: 100,
          temperature: 0.1
        }
      })
    });
    const d = await res.json();
    console.log(`Time: ${(Date.now() - t0) / 1000}s`);
    console.log('Response:\n', d.response);
  }
}

testPrompts().catch(console.error);
