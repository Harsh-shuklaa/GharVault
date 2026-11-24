// Test optimized Ollama options
async function testFastOllama() {
  const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const base64Data = dummyBuffer.toString('base64');

  const t0 = Date.now();
  console.log('Sending compact prompt with num_predict: 80...');

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moondream',
      prompt: 'Extract details from this document image in JSON: {"docType": "", "docNumber": "", "holderName": "", "dob": "", "expiryDate": ""}',
      images: [base64Data],
      stream: false,
      format: 'json',
      options: {
        num_predict: 80,
        temperature: 0.1,
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await res.json();
  const elapsed = (Date.now() - t0) / 1000;
  console.log(`Completed in ${elapsed}s!`);
  console.log('Response:', data.response);
}

testFastOllama();
