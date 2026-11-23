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
  else if (q.includes('hospital') || q.includes('prescription') || q.includes('doctor') || q.includes('dr.') || q.includes('dawai') || q.includes('slip') || q.includes('apollo') || q.includes('max')) docTypeQuery = 'medical';
  else if (q.includes('university') || q.includes('college') || q.includes('degree') || q.includes('marksheet') || q.includes('dmc') || q.includes('sem') || q.includes('bca') || q.includes('mca') || q.includes('certificate') || q.includes('innovator')) docTypeQuery = 'education';

  // 3. Search matching documents
  let matchedDoc = null;
  let matchedDocsList = [];

  const candidateDocs = documents.filter(d => {
    if (!targetMember) return true;
    const memberIdStr = targetMember._id?.toString();
    return d.assignedMemberId?.toString() === memberIdStr || (d.title || '').toLowerCase().includes(targetMember.name.toLowerCase());
  });

  const getDocFullText = (d) => {
    const ocr = d.ocrExtractedData || {};
    return `${d.title} ${d.category} ${d.notes || ''} ${ocr.summary || ''} ${JSON.stringify(ocr)}`.toLowerCase();
  };

  // Find multi-doc matches for hospital, university, or course queries
  const searchWords = q.split(/\s+/).filter(w => w.length > 2 && !['hai', 'kya', 'aur', 'mai', 'bhi', 'kare', 'wale', 'wali', 'documents', 'document', 'dikhao', 'batao'].includes(w));
  
  matchedDocsList = candidateDocs.filter(d => {
    const text = getDocFullText(d);
    return searchWords.some(w => text.includes(w));
  });

  if (matchedDocsList.length === 0 && searchWords.length > 0) {
    matchedDocsList = documents.filter(d => {
      const text = getDocFullText(d);
      return searchWords.some(w => text.includes(w));
    });
  }

  matchedDoc = matchedDocsList[0] || null;

  if (matchedDoc || matchedDocsList.length > 0) {
    const primary = matchedDoc || matchedDocsList[0];
    const docNum = primary.documentNumber || '';
    const ocr = primary.ocrExtractedData || {};
    const med = ocr.medicalDetails || {};
    const acad = ocr.academicDetails || {};

    let answer = `Aapke vault me **"${primary.title}"** mil gaya hai.`;

    if (med.hospitalOrClinic || med.doctorName) {
      answer += `\n• **Hospital / Doctor:** ${med.hospitalOrClinic || ''} ${med.doctorName ? `(${med.doctorName})` : ''}`.trim();
    }
    if (med.diagnosis) {
      answer += `\n• **Diagnosis / Condition:** ${med.diagnosis}`;
    }
    if (med.medicines) {
      answer += `\n• **Prescribed Medicines (Dawai):** ${med.medicines}`;
    }
    if (acad.institution || acad.courseOrDegree) {
      answer += `\n• **Institution / Degree:** ${acad.institution || ''} — ${acad.courseOrDegree || ''} ${acad.semesterOrYear ? `(${acad.semesterOrYear})` : ''}`.trim();
    }
    if (acad.marksOrGrade) {
      answer += `\n• **Score / CGPA:** ${acad.marksOrGrade}`;
    }

    if (matchedDocsList.length > 1) {
      answer += `\n\nIs query se match hote huye kul **${matchedDocsList.length} documents** vault me mile hain. Aap neeche diye cards par click karke direct open kar sakte hain.`;
    }

    return {
      answer,
      copyableValue: docNum || med.medicines || null,
      sourceDocId: primary._id?.toString() || null,
      sourceDocTitle: primary.title,
      category: primary.category || null,
      suggestedAction: docNum ? 'COPY_NUMBER' : 'VIEW_DOCUMENT',
      matchedDocs: matchedDocsList.map(d => ({
        id: d._id?.toString(),
        title: d.title,
        category: d.category,
        institutionOrDoctor: d.ocrExtractedData?.medicalDetails?.hospitalOrClinic || d.ocrExtractedData?.academicDetails?.institution || d.category,
        date: d.issueDate ? new Date(d.issueDate).toISOString().split('T')[0] : null,
      })),
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

    // 2. Prepare Documents Context with Deep Semantic Metadata
    const docsContext = documents.length > 0
      ? documents
          .map(d => {
            const expStr = d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : 'None';
            const memberObj = familyMembers.find(m => m._id?.toString() === d.assignedMemberId?.toString());
            const memberName = memberObj ? `${memberObj.name} (${memberObj.relationship || 'Member'})` : 'Entire Family (Joint)';

            const ocr = d.ocrExtractedData || {};
            const acad = ocr.academicDetails || {};
            const med = ocr.medicalDetails || {};
            const emrg = ocr.emergencyDetails || {};

            let extraInfo = [];
            if (med.doctorName) extraInfo.push(`Doctor: "${med.doctorName}"`);
            if (med.hospitalOrClinic) extraInfo.push(`Hospital/Clinic/Lab: "${med.hospitalOrClinic}"`);
            if (med.diagnosis) extraInfo.push(`Diagnosis/Bimari: "${med.diagnosis}"`);
            if (med.medicines) extraInfo.push(`Prescribed Medicines/Dawai: "${med.medicines}"`);

            if (acad.institution) extraInfo.push(`University/Board: "${acad.institution}"`);
            if (acad.courseOrDegree) extraInfo.push(`Course/Degree: "${acad.courseOrDegree}"`);
            if (acad.semesterOrYear) extraInfo.push(`Semester/Year: "${acad.semesterOrYear}"`);
            if (acad.certificateTitle) extraInfo.push(`Certificate/Award Title: "${acad.certificateTitle}"`);
            if (acad.marksOrGrade) extraInfo.push(`Marks/CGPA: "${acad.marksOrGrade}"`);

            if (emrg.bloodGroup) extraInfo.push(`Blood Group: "${emrg.bloodGroup}"`);
            if (emrg.tpaProvider) extraInfo.push(`Insurance TPA: "${emrg.tpaProvider}"`);
            if (emrg.tollFreeHelpLine) extraInfo.push(`Cashless Helpline: "${emrg.tollFreeHelpLine}"`);

            if (ocr.summary) extraInfo.push(`AI Summary: "${ocr.summary}"`);
            const extraStr = extraInfo.length > 0 ? '\n- Deep Metadata: ' + extraInfo.join(' | ') : '';

            return `[Document ID: ${d._id}]
- Title: "${d.title}"
- Category: "${d.category}"
- Assigned To: "${memberName}"
- Document / Policy Number: "${d.documentNumber || 'N/A'}"
- Expiry Date: "${expStr}"
- Notes / Details: "${(d.notes || '').replace(/\n/g, ' ')}"
- Sensitive / MPIN: ${d.isSensitive ? 'Yes' : 'No'}${extraStr}`;
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
   - For hospital / doctor / prescription / medicine questions (e.g. "Max Hospital ke latest documents do", "Dr. ne kaunsi dawai likhi thi?", "Apollo hospital ki prescription"):
     - State the doctor name, hospital, illness/diagnosis, and exact medicines with dosage in clean bullet points!
     - Populate "matchedDocs" with all documents from that hospital or doctor so user can click to open each one.
   - For university / degree / marksheet / certificate questions (e.g. "Delhi University ke saare documents do", "6th sem DMC marks", "Innovators certificate"):
     - State the university name, course (BCA/MCA/B.Tech), semester, marks/CGPA, or certificate award.
     - Populate "matchedDocs" with all matching educational documents or certificates.
   - For expiry questions (e.g. "Car insurance kab expire ho rahi hai?"): Give the exact date, whether it is expired or expiring soon, and policy number.
   - For medical / helpline questions (e.g. "Mediclaim hospital helpline kya hai?"): Extract the toll-free number or TPA.
3. Understand Indian relationships accurately:
   - "Papa" / "Pitaji" / "Father" / "Dad" maps to relationship "Father".
   - "Mummy" / "Maa" / "Mother" / "Mom" maps to relationship "Mother".
   - "Bhai" / "Brother", "Behen" / "Sister", "Dada", "Dadi", "Chacha", "Beta", "Beti", etc.
   - If user asks about their own document ("Mera PAN", "Mera Aadhaar", "My marksheet", "Meri dawai"), match the Current Logged-in User.
4. If a document is marked "Sensitive / MPIN: Yes", provide the answer but remind them gently if necessary.
5. If the requested information or document is NOT in the catalog:
   - Politely inform in Hinglish that this document has not been uploaded yet in the vault.
   - Set "copyableValue" to null.
6. Return ONLY a valid JSON object matching these exact keys. Do NOT wrap in markdown \`\`\`json blocks.

JSON Schema:
{
  "answer": "Direct conversational Hinglish answer with clear markdown bolding and bullet points if needed",
  "copyableValue": "Exact string to copy with 1-tap (e.g. 'ABCDE1234F', '1234 5678 9012', '1800-425-2255', 'Paracetamol 650mg'), or null",
  "sourceDocId": "MongoDB ID of the primary document where info was found, or null",
  "sourceDocTitle": "Title of the primary source document, or null",
  "category": "Category of the document, or null",
  "suggestedAction": "COPY_NUMBER | CALL_HELPLINE | RENEW_EXPIRY | VIEW_DOCUMENT | null",
  "matchedDocs": [
    {
      "id": "document_id_string",
      "title": "Document Title",
      "category": "Education | Medical & Health | ID Cards",
      "institutionOrDoctor": "Hospital or University or Doctor name",
      "date": "Optional Date string"
    }
  ]
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
