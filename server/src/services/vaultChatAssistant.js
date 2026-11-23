import mongoose from 'mongoose';

/**
 * Heuristic fallback assistant when AI API is unavailable or offline
 */
function fallbackVaultAssistant({ query = '', familyMembers = [], documents = [], currentUser = null }) {
  const q = query.toLowerCase().trim();

  // 1. Resolve target member from query
  let targetMember = null;

  if (q.includes('papa') || q.includes('father') || q.includes('pitaji') || q.includes('dad')) {
    targetMember = familyMembers.find(m => (m.relationship || '').toLowerCase().includes('father'));
  } else if (q.includes('mummy') || q.includes('mother') || q.includes('mataji') || q.includes('mom') || q.includes('maa')) {
    targetMember = familyMembers.find(m => (m.relationship || '').toLowerCase().includes('mother'));
  } else if (q.includes('mera') || q.includes('meri') || q.includes('mere') || q.includes('my')) {
    targetMember = currentUser ? familyMembers.find(m => m._id?.toString() === currentUser._id?.toString()) : null;
  }

  // If not resolved by relation, check if any member name is mentioned
  if (!targetMember) {
    for (const m of familyMembers) {
      const fn = (m.name || '').toLowerCase().split(' ')[0];
      if (fn && q.includes(fn)) {
        targetMember = m;
        break;
      }
    }
  }

  // 2. Identify target category or document type
  let docTypeQuery = '';
  if (q.includes('pan')) docTypeQuery = 'pan';
  else if (q.includes('aadhaar') || q.includes('adhar') || q.includes('uidai')) docTypeQuery = 'aadhaar';
  else if (q.includes('passport')) docTypeQuery = 'passport';
  else if (q.includes('license') || q.includes('licence') || q.includes('dl') || q.includes('driving')) docTypeQuery = 'license';
  else if (q.includes('insurance') || q.includes('mediclaim') || q.includes('policy')) docTypeQuery = 'insurance';
  else if (q.includes('rc') || q.includes('vehicle') || q.includes('car') || q.includes('bike')) docTypeQuery = 'rc';

  // 3. Search matching documents
  let matchedDoc = null;

  const candidateDocs = documents.filter(d => {
    if (!targetMember) return true;
    const memberIdStr = targetMember._id?.toString();
    return d.assignedMemberId?.toString() === memberIdStr || (d.title || '').toLowerCase().includes(targetMember.name.toLowerCase());
  });

  if (docTypeQuery) {
    matchedDoc = candidateDocs.find(d => {
      const text = `${d.title} ${d.category} ${d.notes || ''}`.toLowerCase();
      return text.includes(docTypeQuery);
    });
  }

  // Fallback to searching without member restriction if none found
  if (!matchedDoc && docTypeQuery) {
    matchedDoc = documents.find(d => {
      const text = `${d.title} ${d.category} ${d.notes || ''}`.toLowerCase();
      return text.includes(docTypeQuery);
    });
  }

  // If still not found, check generic keyword match
  if (!matchedDoc) {
    matchedDoc = documents.find(d => {
      const words = q.split(/\s+/).filter(w => w.length > 2);
      const text = `${d.title} ${d.category} ${d.notes || ''}`.toLowerCase();
      return words.some(w => text.includes(w));
    });
  }

  if (matchedDoc) {
    const memberName = targetMember ? targetMember.name : (matchedDoc.assignedMemberId ? 'family member' : 'family');
    const docNum = matchedDoc.documentNumber || '';
    let answer = `Aapke vault me **"${matchedDoc.title}"** mil gaya hai.`;

    if (docNum) {
      answer += ` Iska document number **${docNum}** hai.`;
    }

    if (matchedDoc.expiryDate) {
      const exp = new Date(matchedDoc.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      answer += ` Yeh document **${exp}** ko expire ho raha hai.`;
    }

    if (matchedDoc.notes) {
      answer += `\n\n📌 Notes: ${matchedDoc.notes}`;
    }

    return {
      answer,
      copyableValue: docNum || null,
      sourceDocId: matchedDoc._id?.toString() || null,
      sourceDocTitle: matchedDoc.title,
      category: matchedDoc.category || null,
      suggestedAction: docNum ? 'COPY_NUMBER' : 'VIEW_DOCUMENT',
      engine: 'heuristic_fallback',
    };
  }

  return {
    answer: `Mujhe aapke vault me is se related koi document nahi mila. Aap document upload karke dobara pooch sakte hain!`,
    copyableValue: null,
    sourceDocId: null,
    sourceDocTitle: null,
    category: null,
    suggestedAction: null,
    engine: 'heuristic_fallback',
  };
}

/**
 * Ask Vault AI using Google Gemini 3.5 Flash
 */
export async function askVaultAI({
  query,
  familyMembers = [],
  documents = [],
  currentUser = null,
  customApiKey = null,
}) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Vault AI Assistant] No GEMINI_API_KEY. Using heuristic fallback.');
    return fallbackVaultAssistant({ query, familyMembers, documents, currentUser });
  }

  try {
    // 1. Prepare Members Context
    const membersContext = familyMembers.length > 0
      ? familyMembers
          .map(m => `- ID: ${m._id}, Name: "${m.name}", Relationship: "${m.relationship || 'Member'}", Blood Group: "${m.bloodGroup || 'N/A'}"`)
          .join('\n')
      : 'No family members recorded.';

    // 2. Prepare Documents Context
    const docsContext = documents.length > 0
      ? documents
          .map(d => {
            const expStr = d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : 'None';
            const memberObj = familyMembers.find(m => m._id?.toString() === d.assignedMemberId?.toString());
            const memberName = memberObj ? `${memberObj.name} (${memberObj.relationship || 'Member'})` : 'Entire Family (Joint)';
            return `[Document ID: ${d._id}]
- Title: "${d.title}"
- Category: "${d.category}"
- Assigned To: "${memberName}"
- Document / Policy Number: "${d.documentNumber || 'N/A'}"
- Expiry Date: "${expStr}"
- Notes / Details: "${(d.notes || '').replace(/\n/g, ' ')}"
- Sensitive / MPIN: ${d.isSensitive ? 'Yes' : 'No'}`;
          })
          .join('\n\n')
      : 'No documents uploaded yet in this vault.';

    const systemPrompt = `You are "Dastavej Vault AI" (दस्तावेज़ एआई), an ultra-smart, private and secure family document assistant for an Indian family vault app.
Your mission is to instantly answer the user's question accurately based ONLY on the family documents and family members catalog provided below.

Registered Family Members:
${membersContext}

Vault Documents:
${docsContext}

Current Logged-in User: "${currentUser?.name || 'Member'}" (ID: ${currentUser?._id || 'N/A'})

User Question: "${query}"

Strict Instructions:
1. Speak in friendly, natural, professional Hinglish (a warm blend of Hindi and English like spoken in India). If the user asked in pure English, reply in crisp English.
2. Answer directly and concisely:
   - For document number questions (e.g. "Papa ka PAN number kya hai?"): State the number clearly in bold, and populate the "copyableValue" field with the clean exact string so the user can 1-tap copy it.
   - For expiry questions (e.g. "Car insurance kab expire ho rahi hai?"): Give the exact date, whether it is expired or expiring soon, and policy number.
   - For medical / helpline questions (e.g. "Mediclaim hospital helpline kya hai?"): Extract the toll-free number or TPA from notes / details.
3. Understand Indian relationships accurately:
   - "Papa" / "Pitaji" / "Father" / "Dad" maps to relationship "Father".
   - "Mummy" / "Maa" / "Mother" / "Mom" maps to relationship "Mother".
   - "Bhai" / "Brother", "Behen" / "Sister", "Dada", "Dadi", "Chacha", "Beta", "Beti", etc.
   - If user asks about their own document ("Mera PAN", "Mera Aadhaar", "My driving license"), match the Current Logged-in User.
4. If a document is marked "Sensitive / MPIN: Yes", provide the answer but remind them gently if necessary.
5. If the requested information or document is NOT in the catalog:
   - Politely inform in Hinglish that this document has not been uploaded yet in the vault.
   - Set "copyableValue" to null.
6. Return ONLY a valid JSON object matching these exact keys. Do NOT wrap in markdown \`\`\`json blocks.

JSON Schema:
{
  "answer": "Direct conversational Hinglish answer with clear markdown bolding and bullet points if needed",
  "copyableValue": "Exact string to copy with 1-tap (e.g. 'ABCDE1234F', '1234 5678 9012', '1800-425-2255'), or null",
  "sourceDocId": "MongoDB ID of the document where info was found, or null",
  "sourceDocTitle": "Title of the source document, or null",
  "category": "Category of the document, or null",
  "suggestedAction": "COPY_NUMBER | CALL_HELPLINE | RENEW_EXPIRY | VIEW_DOCUMENT | null"
}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json',
      },
    };

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
          break;
        } else {
          const errText = await response.text();
          console.warn(`[Vault AI] Model ${modelName} returned status ${response.status}:`, errText.slice(0, 160));
        }
      } catch (reqErr) {
        console.warn(`[Vault AI] Request to ${modelName} failed:`, reqErr.message);
      }
    }

    if (!result) {
      console.warn('[Vault AI] All Gemini models failed or unavailable. Using heuristic fallback.');
      return fallbackVaultAssistant({ query, familyMembers, documents, currentUser });
    }

    const rawJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) {
      return fallbackVaultAssistant({ query, familyMembers, documents, currentUser });
    }

    const cleanedText = rawJsonText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return {
      answer: parsedData.answer || 'Details nikaal li gayi hain.',
      copyableValue: parsedData.copyableValue || null,
      sourceDocId: parsedData.sourceDocId || null,
      sourceDocTitle: parsedData.sourceDocTitle || null,
      category: parsedData.category || null,
      suggestedAction: parsedData.suggestedAction || null,
      engine: successfulModel || 'gemini',
    };
  } catch (err) {
    console.error('[Vault AI Assistant Error]:', err);
    return fallbackVaultAssistant({ query, familyMembers, documents, currentUser });
  }
}
