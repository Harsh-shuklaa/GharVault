import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

import { scanDocumentWithAI } from '../server/src/services/aiDocumentScanner.js';

async function testFullScan() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  console.log('Running scanDocumentWithAI...');
  const res = await scanDocumentWithAI({
    fileBuffer,
    mimeType: 'image/jpeg',
    fileName: 'media_1795504300133_9d4826f8.jpg',
    familyMembers: [
      { _id: 'mem1', name: 'Shiv Ram', relationship: 'Self' },
      { _id: 'mem2', name: 'Vigha Prasad', relationship: 'Father' }
    ]
  });

  console.log('\n--- Final Scan Result ---');
  console.log(JSON.stringify(res, null, 2));
}

testFullScan().catch(console.error);
