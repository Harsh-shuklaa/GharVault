import fs from 'fs';
import { tryScanWithLocalOllama, scanDocumentWithAI } from '../server/src/services/aiDocumentScanner.js';

async function testUserImage() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  
  if (!fs.existsSync(imagePath)) {
    console.error('File does not exist at:', imagePath);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  console.log(`Loaded image: ${fileBuffer.length} bytes`);

  const t0 = Date.now();
  console.log('--- Calling tryScanWithLocalOllama ---');
  const result = await tryScanWithLocalOllama({
    fileBuffer,
    mimeType: 'image/jpeg',
    fileName: 'voter_id_shiv_ram.jpg',
    familyMembers: [
      { _id: 'fam1', name: 'Shiv Ram', relationship: 'Self' },
      { _id: 'fam2', name: 'Vigha Prasad', relationship: 'Father' }
    ]
  });
  const t1 = Date.now();

  console.log(`\nScan took ${(t1 - t0) / 1000}s`);
  console.log('Result:', JSON.stringify(result, null, 2));
}

testUserImage().catch(console.error);
