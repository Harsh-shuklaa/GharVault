import { generateSmartDocumentTitle } from '../server/src/services/aiDocumentScanner.js';

export async function tryScanWithLocalOllama({ fileBuffer, mimeType = 'image/jpeg', fileName = '', familyMembers = [] }) {
  try {
    // 1. Fast health check to see if Ollama is running locally
    const tagsRes = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(1500),
    });
    if (!tagsRes.ok) return null;

    const data = await tagsRes.json();
    const visionModel = data.models?.find(m =>
      m.name.includes('moondream') ||
      m.name.includes('vl') ||
      m.name.includes('vision') ||
      m.name.includes('llava')
    );
    if (!visionModel) {
      console.log('[Ollama] Connected to Ollama, but no vision model found.');
      return null;
    }

    const modelName = visionModel.name;
    const base64Data = fileBuffer.toString('base64');

    const prompt = `You are an expert Indian Document Intelligence System for a secure family vault called "Dastavej".
Carefully read all visible text and details from this document image.
Extract the following information:
1. docType: (Aadhaar Card, PAN Card, Driving License, Passport, Vehicle RC, Health Insurance, Electricity Bill, Water Bill, Gas Bill, Property Sale Deed / Registry, Marksheet / DMC, Doctor Prescription, or Other).
2. docNumber: Clean primary ID number, PAN number (e.g. ABCDE1234F), 12-digit Aadhaar number, DL number, RC number, or Consumer CA number.
3. holderName: Full name of candidate, holder, or consumer.
4. dob: Date of birth (YYYY-MM-DD or null).
5. expiryDate: Expiry date or Bill Due Date (YYYY-MM-DD or null).
6. category: ID Cards, Medical & Health, Vehicle, Financial, Property & Legal, Education, or Personal.
7. summary: Crisp 1-sentence summary of the document.
8. rawText: All visible text read from the document.

Return ONLY valid JSON matching these keys.`;

    const genRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        images: [base64Data],
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(40000),
    });

    if (!genRes.ok) return null;
    const genData = await genRes.json();
    const rawOutput = (genData.response || '').trim();
    if (!rawOutput) return null;

    let parsed = {};
    try {
      parsed = JSON.parse(rawOutput);
    } catch (e) {
      const match = rawOutput.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const docType = parsed.docType || 'Document';
    const docNumber = (parsed.docNumber || '').trim();
    const holderName = (parsed.holderName || '').trim();

    // Match with family members
    let matchedMember = null;
    if (holderName && familyMembers.length > 0) {
      const cleanH = holderName.toLowerCase();
      matchedMember = familyMembers.find(m => cleanH.includes(m.name.toLowerCase().split(' ')[0]));
    }

    const smartTitle = generateSmartDocumentTitle({
      docType,
      holderName,
      matchedMemberName: matchedMember?.name,
      docNumber,
      category: parsed.category || 'ID Cards',
      originalFileName: fileName,
    });

    return {
      docType,
      category: parsed.category || 'ID Cards',
      docNumber,
      holderName,
      fatherOrSpouseName: parsed.fatherOrSpouseName || null,
      dob: parsed.dob || null,
      expiryDate: parsed.expiryDate || null,
      suggestedTitle: smartTitle,
      emergencyDetails: parsed.emergencyDetails || null,
      academicDetails: parsed.academicDetails || null,
      medicalDetails: parsed.medicalDetails || null,
      propertyDetails: parsed.propertyDetails || null,
      utilityBillDetails: parsed.utilityBillDetails || null,
      executiveSummary: parsed.summary ? [parsed.summary] : [],
      summary: parsed.summary || `${docType} for ${holderName || 'Family Member'}`,
      searchKeywords: [docType, docNumber, holderName].filter(Boolean),
      matchedMemberId: matchedMember?._id || null,
      matchedMemberName: matchedMember?.name || '',
      confidence: docNumber ? 0.95 : 0.85,
      qualityAssessment: {
        isBlurry: false,
        clarityScore: 'GOOD',
        issueFeedback: null,
      },
      aiEngine: `ollama_local (${modelName})`,
    };
  } catch (err) {
    console.warn('[Ollama Local Engine] Skipped/Failed:', err.message);
    return null;
  }
}

// Quick self-test with dummy buffer
async function run() {
  console.log('Testing tryScanWithLocalOllama...');
  const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const result = await tryScanWithLocalOllama({
    fileBuffer: dummyBuffer,
    fileName: 'sample_doc.png',
    familyMembers: [{ _id: 'u1', name: 'Sunil Sharma' }],
  });
  console.log('Ollama local scan result:', result);
}
run();
