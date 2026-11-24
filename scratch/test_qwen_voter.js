import fs from 'fs';
import { tryScanWithLocalOllama } from '../server/src/services/aiDocumentScanner.js';

async function testQwenOnVoterID() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  console.log('--- Calling tryScanWithLocalOllama using Qwen2.5-VL 3B ---');
  const t0 = Date.now();
  const result = await tryScanWithLocalOllama({
    fileBuffer,
    mimeType: 'image/jpeg',
    fileName: 'media_1795504300133_9d4826f8.jpg',
    familyMembers: [
      { _id: 'fam1', name: 'Shiv Ram', relationship: 'Self' },
      { _id: 'fam2', name: 'Vigha Prasad', relationship: 'Father' }
    ]
  });
  const elapsed = (Date.now() - t0) / 1000;

  console.log(`\nScan completed in ${elapsed}s!`);
  console.log('Result:\n', JSON.stringify(result, null, 2));
}

testQwenOnVoterID().catch(console.error);
