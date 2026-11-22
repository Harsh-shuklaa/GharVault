import mongoose from 'mongoose';
import User from '../models/User.js';
import Family from '../models/Family.js';
import { isConnected } from '../config/db.js';

/**
 * Clean & normalize string for fuzzy name matching
 */
function normalizeName(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

const COMMON_INDIAN_SUFFIXES = new Set([
  'kumar', 'kumari', 'singh', 'devi', 'prasad', 'lal', 'chand', 'ram', 'das', 'rao', 'babu'
]);

/**
 * Match an extracted name against family members with Indian name awareness
 */
function findBestMemberMatch(extractedName, members = []) {
  if (!extractedName || !members.length) return null;
  const normExtracted = normalizeName(extractedName);
  const extractedParts = normExtracted.split(/\s+/).filter(Boolean);
  if (!extractedParts.length) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const m of members) {
    const memberName = normalizeName(m.name);
    if (!memberName) continue;
    const memberParts = memberName.split(/\s+/).filter(Boolean);
    if (!memberParts.length) continue;

    // 1. Exact full name match (e.g. "Aditya Shukla" === "Aditya Shukla")
    if (normExtracted === memberName) {
      return { memberId: m._id, memberName: m.name, confidence: 1.0, score: 100 };
    }

    let score = 0;
    const extractedFirst = extractedParts[0];
    const memberFirst = memberParts[0];

    // 2. Primary Given Name Match (Critical in Indian naming)
    if (extractedFirst === memberFirst) {
      // e.g. "Aditya Kumar" vs "Aditya Shukla" -> same given name (+20 points)
      score += 20;
    } else if (memberParts.includes(extractedFirst) || extractedParts.includes(memberFirst)) {
      // Rearranged or middle name match (e.g. "Kumar Aditya" vs "Aditya Kumar")
      score += 10;
    } else {
      // Completely different first names (e.g. "Vinay" vs "Aditya") -> Heavy penalty
      score -= 15;
    }

    // 3. Match remaining tokens (surname / middle names)
    for (let i = 1; i < extractedParts.length; i++) {
      const part = extractedParts[i];
      if (memberParts.includes(part)) {
        // Generic suffix like "kumar", "singh" gives very little weight (+1)
        // Distinct surnames like "shukla", "agarwal", "chatterjee" give high weight (+6)
        score += COMMON_INDIAN_SUFFIXES.has(part) ? 1 : 6;
      }
    }

    // A candidate MUST have at least 10 points to qualify as a genuine match
    // (A generic suffix alone can never exceed 1 point, preventing "Vinay Kumar" from matching "Aditya Kumar")
    if (score >= 10 && score > highestScore) {
      highestScore = score;
      bestMatch = {
        memberId: m._id,
        memberName: m.name,
        confidence: Math.min(score / 25, 0.98),
        score,
      };
    }
  }

  return bestMatch;
}

/**
 * Heuristic fallback parser when AI is unavailable or offline
 */
function fallbackHeuristicScanner(fileName = '', originalText = '', members = []) {
  const text = (fileName + ' ' + (originalText || '')).toLowerCase();
  let docType = 'Other';
  let category = 'ID Cards';
  let docNumber = '';
  let expiryDate = null;
  let suggestedTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uidai')) {
    docType = 'Aadhaar Card';
    category = 'ID Cards';
    suggestedTitle = 'Aadhaar Card';
    // Look for 12 digit pattern in text
    const m = text.match(/\b([2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/);
    if (m) docNumber = m[1].replace(/[-\s]/g, ' ');
  } else if (text.includes('pan') || text.includes('incometax') || text.includes('nsdl')) {
    docType = 'PAN Card';
    category = 'ID Cards';
    suggestedTitle = 'PAN Card';
    const m = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
    if (m) docNumber = m[1].toUpperCase();
  } else if (text.includes('license') || text.includes('licence') || text.includes('dl') || text.includes('driving')) {
    docType = 'Driving License';
    category = 'Vehicle';
    suggestedTitle = 'Driving License';
    const m = text.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{7,12})\b/i);
    if (m) docNumber = m[1].toUpperCase();
  } else if (text.includes('passport')) {
    docType = 'Passport';
    category = 'ID Cards';
    suggestedTitle = 'Passport';
    const m = text.match(/\b([A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9])\b/i);
    if (m) docNumber = m[1].toUpperCase();
  } else if (text.includes('insurance') || text.includes('policy') || text.includes('health') || text.includes('mediclaim')) {
    docType = 'Health Insurance';
    category = 'Medical & Health';
    suggestedTitle = 'Health Insurance Policy';
  } else if (text.includes('rc') || text.includes('registration') || text.includes('vehicle')) {
    docType = 'Vehicle RC';
    category = 'Vehicle';
    suggestedTitle = 'Vehicle RC';
    const m = text.match(/\b([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4})\b/i);
    if (m) docNumber = m[1].toUpperCase();
  }

  // Only match member if their name is explicitly found in filename or text
  let matchedMember = null;
  if (text) {
    for (const m of members) {
      const fn = (m.name || '').toLowerCase().trim();
      if (fn && text.includes(fn)) {
        matchedMember = m;
        break;
      }
    }
  }

  return {
    docType,
    category,
    docNumber,
    holderName: matchedMember?.name || '',
    dob: null,
    expiryDate,
    suggestedTitle: matchedMember?.name ? `${docType} — ${matchedMember.name.split(' ')[0]}` : suggestedTitle,
    emergencyDetails: null,
    matchedMemberId: matchedMember?._id || null,
    matchedMemberName: matchedMember?.name || '',
    confidence: docNumber ? 0.75 : 0.5,
    aiEngine: 'heuristic_fallback',
  };
}

/**
 * Scan document using Google Gemini Multimodal Vision API
 */
export async function scanDocumentWithAI({ fileBuffer, mimeType, fileName, familyMembers = [], customApiKey = null }) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[AI Scanner] No GEMINI_API_KEY configured. Using intelligent heuristic scanner.');
    return fallbackHeuristicScanner(fileName, '', familyMembers);
  }

  try {
    let cleanMime = (mimeType || 'image/jpeg').toLowerCase();
    if (cleanMime === 'image/jpg') cleanMime = 'image/jpeg';

    const base64Data = fileBuffer.toString('base64');
    const memberListText = familyMembers.length > 0
      ? `\nRegistered Family Members in this vault:
${familyMembers.map((m) => `- Member ID: "${m._id}", Name: "${m.name}" (${m.relationship || 'Member'})`).join('\n')}

Important matching rule:
- Prioritize the Given Name (First Name). In Indian documents, surname variations are common (e.g., 'Aditya Kumar' on PAN card vs 'Aditya Shukla' in family records). This must match the member with the same first name ('Aditya Shukla'), NEVER someone with a completely different first name (like 'Vinay Kumar').
- Distinguish the Document Holder from the Father's Name printed on the card.`
      : '';

    const prompt = `You are an expert Indian Document Intelligence System for a secure family vault app called "Dastavej".
Analyze the attached Indian official document (could be an Aadhaar Card, PAN Card, Driving License, Passport, Vehicle RC, Health Insurance Policy/TPA card, Voter ID, Birth Certificate, or other family record).
${memberListText}

Extract the following information with maximum accuracy:
1. "docType": One of ['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Vehicle RC', 'Vehicle Insurance', 'Health Insurance', 'Voter ID', 'Birth Certificate', 'Property Deed', 'Education Certificate', 'Other']
2. "docNumber": The clean primary ID or Policy or Registration number without punctuation mistakes. 
   - Aadhaar: format as "XXXX XXXX XXXX" (12 digits, or masked "XXXX XXXX 1234" if masked).
   - PAN: 10 chars uppercase (e.g. "ABCDE1234F").
   - Driving License: State code + number (e.g. "DL-0420110012345").
   - Passport: e.g. "Z1234567".
   - Vehicle RC: e.g. "DL01AB1234".
   - Health Insurance: policy or member ID number.
3. "holderName": Full legal name of the person on the document (do NOT confuse with father's name or Government header).
4. "fatherOrSpouseName": Father's or spouse's name if clearly listed, else null.
5. "dob": Date of birth in YYYY-MM-DD format if found, else null.
6. "expiryDate": Expiry or valid-till date in YYYY-MM-DD format if applicable, else null.
7. "category": One of ['ID Cards', 'Medical & Health', 'Vehicle', 'Financial', 'Property & Legal', 'Education', 'Personal'].
8. "emergencyDetails": If this is a Health Insurance Card, Driving License, or Medical Report:
   - "bloodGroup": Blood group if printed (e.g. "O+", "B+", "AB+", "A-", etc.) or null.
   - "tpaProvider": Third Party Administrator (TPA) name (e.g. "Medi Assist", "Vidal Health", "Paramount", "Star Health") or null.
   - "policyNumber": Insurance policy number or null.
   - "tollFreeHelpLine": Hospital cashless helpline phone number or null.
   - "sumInsured": Sum insured amount if visible or null.

Return ONLY a valid JSON object matching these keys. Do NOT wrap in markdown \`\`\`json code blocks.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: cleanMime,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json',
      },
    };

    // Multimodal models in priority order (gemini-3.5-flash is currently live & active)
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
    ];

    let result = null;
    let successfulModel = null;

    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          result = await response.json();
          successfulModel = modelName;
          console.log(`[AI Scanner] Successfully scanned using model: ${modelName}`);
          break;
        } else {
          const errText = await response.text();
          console.warn(`[AI Scanner] Model ${modelName} returned status ${response.status}:`, errText.slice(0, 160));
        }
      } catch (reqErr) {
        console.warn(`[AI Scanner] Request to ${modelName} failed:`, reqErr.message);
      }
    }

    if (!result) {
      console.warn('[AI Scanner] All Gemini models failed or unavailable. Falling back to heuristic.');
      return fallbackHeuristicScanner(fileName, '', familyMembers);
    }

    const rawJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonText) {
      console.warn('[AI Scanner] No text content returned from Gemini.');
      return fallbackHeuristicScanner(fileName, '', familyMembers);
    }

    // Clean potential markdown quotes
    const cleanedText = rawJsonText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsedData = JSON.parse(cleanedText);

    // Auto-match with family members
    const matched = findBestMemberMatch(parsedData.holderName, familyMembers);

    const docType = parsedData.docType || 'Document';
    const holderFirstName = parsedData.holderName ? parsedData.holderName.split(' ')[0] : (matched?.memberName?.split(' ')[0] || '');
    const suggestedTitle = holderFirstName ? `${docType} — ${holderFirstName}` : docType;

    return {
      docType: parsedData.docType || 'Other',
      category: parsedData.category || 'ID Cards',
      docNumber: parsedData.docNumber || '',
      holderName: parsedData.holderName || '',
      fatherOrSpouseName: parsedData.fatherOrSpouseName || null,
      dob: parsedData.dob || null,
      expiryDate: parsedData.expiryDate || null,
      suggestedTitle,
      emergencyDetails: parsedData.emergencyDetails || null,
      matchedMemberId: matched?.memberId || null,
      matchedMemberName: matched?.memberName || '',
      confidence: matched ? 0.95 : 0.9,
      aiEngine: successfulModel || 'gemini',
    };
  } catch (error) {
    console.error('[AI Scanner Error]:', error);
    return fallbackHeuristicScanner(fileName, '', familyMembers);
  }
}
