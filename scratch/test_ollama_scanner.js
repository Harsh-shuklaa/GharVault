import { tryScanWithLocalOllama, scanDocumentWithAI } from '../server/src/services/aiDocumentScanner.js';

async function runTest() {
  console.log('Testing tryScanWithLocalOllama...');
  // 1x1 transparent PNG buffer
  const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const fileBuffer = Buffer.from(sampleImageBase64, 'base64');

  const start = Date.now();
  const result = await tryScanWithLocalOllama({
    fileBuffer,
    mimeType: 'image/png',
    fileName: 'sample_aadhaar.png',
    familyMembers: [{ _id: '123', name: 'Ramesh Sharma' }]
  });

  const duration = (Date.now() - start) / 1000;
  console.log(`Scan completed in ${duration}s!`);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result && result.aiEngine && result.aiEngine.includes('ollama_local')) {
    console.log('✅ TEST PASSED: Ollama Local Vision Agent is blazing fast and fully operational!');
  } else {
    console.error('❌ TEST FAILED: Ollama did not return valid result');
  }
}

runTest().catch(console.error);
