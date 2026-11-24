import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

import { scanDocumentWithAI } from '../server/src/services/aiDocumentScanner.js';

async function testPipeline() {
  const imagePath = 'C:/Users/lenovo/.gemini/antigravity/brain/8e283486-caec-46c6-8e96-d614843d8c2e/.user_uploaded/media_1795504300133_9d4826f8.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  console.log('Testing scanDocumentWithAI...');
  const t0 = Date.now();
  const res = await scanDocumentWithAI({
    fileBuffer,
    mimeType: 'image/jpeg',
    fileName: 'media_1795504300133_9d4826f8.jpg',
    familyMembers: [{ _id: '1', name: 'Shiv Ram' }],
    customApiKey: process.env.GEMINI_API_KEY
  });
  console.log(`Scan completed in ${(Date.now() - t0) / 1000}s!`);
  console.log('Result:\n', JSON.stringify(res, null, 2));
}

testPipeline().catch(console.error);
