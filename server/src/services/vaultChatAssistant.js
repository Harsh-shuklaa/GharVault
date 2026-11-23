import mongoose from 'mongoose';

/**
 * Heuristic fallback assistant when AI API is unavailable or offline
 */
export function fallbackVaultAssistant({ query = '', familyMembers = [], documents = [], currentUser = null }) {
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
  else if (q.includes('hospital') || q.includes('prescription') || q.includes('doctor') || q.includes('dr.') || q.includes('dawai') || q.includes('slip') || q.includes('parchi') || q.includes('parcha') || q.includes('apollo') || q.includes('max') || q.includes('medicine')) docTypeQuery = 'medical';
  else if (q.includes('insurance') || q.includes('mediclaim') || q.includes('policy') || q.includes('ayushman') || q.includes('abha')) docTypeQuery = 'insurance';
  else if (/\b(khasra|khatauni|jamabandi|fard|registry|bainama|bai-nama|chauhaddi|zameen|khet|plot|makan|property|deed|patta|allotment|land)\b/i.test(q)) docTypeQuery = 'property';
  else if (/\b(bijli|electricity|water|pani|bill|ca\s*no|consumer\s*no)\b/i.test(q)) docTypeQuery = 'bill';
  else if (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b)\b/i.test(q)) docTypeQuery = 'license';
  else if (/\b(rc|vehicle rc|car rc|bike rc|vehicle|car|bike)\b/i.test(q)) docTypeQuery = 'rc';
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

  // Find multi-doc matches scored by relevance
  const stopWords = ['hai', 'kya', 'aur', 'mai', 'bhi', 'kare', 'wale', 'wali', 'documents', 'document', 'dikhao', 'batao', 'number', 'naam', 'kiske', 'date'];
  const searchWords = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

  const scoreDocument = (d) => {
    const text = getDocFullText(d);
    let score = 0;
    const lowerTitle = (d.title || '').toLowerCase();
    const lowerCat = (d.category || '').toLowerCase();

    for (const w of searchWords) {
      if (lowerTitle.includes(w)) score += 5;
      else if (text.includes(w)) score += 2;
    }

    if (docTypeQuery === 'bill' && (lowerCat.includes('bill') || lowerTitle.includes('bill') || lowerTitle.includes('bijli') || d.ocrExtractedData?.utilityBillDetails)) score += 10;
    if (docTypeQuery === 'property') {
      const isProp = lowerCat.includes('property') || lowerCat.includes('bank') || lowerCat.includes('legal') ||
        text.includes('khasra') || text.includes('khatauni') || text.includes('registry') || text.includes('bainama') ||
        text.includes('sale deed') || text.includes('deed') || text.includes('zameen') || text.includes('plot') ||
        text.includes('khet') || text.includes('rakba') || text.includes('chauhaddi') || d.ocrExtractedData?.propertyDetails;
      if (isProp) score += 20;
    }
    if (docTypeQuery === 'medical' && (lowerCat.includes('medical') || text.includes('hospital') || text.includes('doctor') || d.ocrExtractedData?.medicalDetails)) score += 10;
    if (docTypeQuery === 'education' && (lowerCat.includes('education') || text.includes('university') || text.includes('college') || d.ocrExtractedData?.academicDetails)) score += 10;
    if (docTypeQuery === 'pan' && (lowerTitle.includes('pan') || lowerCat.includes('id'))) score += 10;
    if (docTypeQuery === 'aadhaar' && (lowerTitle.includes('aadhaar') || lowerTitle.includes('adhar'))) score += 10;

    return score;
  };

  matchedDocsList = candidateDocs
    .map(d => ({ doc: d, score: scoreDocument(d) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.doc);

  if (matchedDocsList.length === 0 && documents.length > 0) {
    matchedDocsList = documents
      .map(d => ({ doc: d, score: scoreDocument(d) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.doc);
  }

  matchedDoc = matchedDocsList[0] || null;

  if (matchedDoc || matchedDocsList.length > 0) {
    const primary = matchedDoc || matchedDocsList[0];
    const docNum = primary.documentNumber || '';
    const ocr = primary.ocrExtractedData || {};
    const med = ocr.medicalDetails || {};
    const acad = ocr.academicDetails || {};
    const prop = ocr.propertyDetails || {};
    const util = ocr.utilityBillDetails || {};

    const fullDocText = `${primary.title || ''} ${primary.documentNumber || ''} ${primary.notes || ''} ${ocr.summary || ''} ${ocr.rawText || ''}`;

    // Deep on-the-fly extraction for property fields
    const khasraRegex = /(?:खसरा\s*(?:संख्या|सं\.?|no\.?|number)?|khasra\s*(?:no\.?|number)?|survey\s*(?:no\.?|number)?|khasra)\s*(?:\([^)]*\))?[:\s#-]*([0-9]+(?:\/[0-9]+)?(?:[a-zA-Z])?)/i;
    const khasraFromText = fullDocText.match(khasraRegex);
    const slashNumMatch = fullDocText.match(/\b([0-9]{1,4}\/[0-9]{1,4}(?:[a-zA-Z])?)\b/);
    const docNumKhasra = docNum && (/khasra|\d+\/\d+/i.test(docNum) || /^[0-9]+(?:\/[0-9]+)?$/.test(docNum.trim()))
      ? docNum.replace(/khasra/gi, '').replace(/[#:\s]/g, '').trim()
      : null;
    const resolvedKhasra = prop.khasraNumber || (khasraFromText ? khasraFromText[1].trim() : null) || docNumKhasra || (slashNumMatch ? slashNumMatch[1].trim() : null);

    const khatauniRegex = /(?:खतौनी\s*(?:संख्या|सं\.?|no\.?|number)?|khatauni\s*(?:no\.?|number)?|khata\s*(?:no\.?|number)?)\s*(?:\([^)]*\))?[:\s#-]*([0-9\/-]+)/i;
    const khatauniFromText = fullDocText.match(khatauniRegex);
    const resolvedKhatauni = prop.khatauniNumber || (khatauniFromText ? khatauniFromText[1].trim() : null);

    const plotRegex = /(?:प्लाट|plot\s*(?:no\.?|number)?|flat\s*(?:no\.?|number)?|house\s*(?:no\.?|number)?|makan\s*no\.?)\s*(?:\([^)]*\))?[:\s#-]*([A-Za-z0-9\/-]+)/i;
    const plotFromText = fullDocText.match(plotRegex);
    const resolvedPlot = prop.plotOrHouseNumber || (plotFromText ? plotFromText[1].trim() : null);

    const rakbaRegex = /(?:रकबा|rakba|area|size|measuring)\s*(?:\([^)]*\))?[:\s]*([0-9]+(?:\.[0-9]+)?\s*(?:gaj|गज|sq\.?\s*yards?|sq\.?\s*ft|sq\.?\s*feet|bigha|बीघा|वर्ग\s*गज|acre|hectare|sqm))/i;
    const rakbaFromText = fullDocText.match(rakbaRegex) || fullDocText.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:gaj|sq\.?\s*yards?|sq\.?\s*ft|bigha|acre|hectare))\b/i);
    const resolvedArea = prop.area || (rakbaFromText ? rakbaFromText[1].trim() : null);

    const ownerRegex = /(?:क्रेता|खरीदार|owner|buyer|in favour of|naam)\s*(?:\([^)]*\))?[:\s]*([^\n,;]+)/i;
    const ownerFromText = fullDocText.match(ownerRegex);
    const resolvedOwner = prop.ownerName || (ownerFromText ? ownerFromText[1].trim() : null) || (targetMember ? targetMember.name : null);

    const locRegex = /(?:मौजा|mauza|गाँव|village|locality|तहसील|tehsil|जिला|district|location|shehar)[:\s]*([^\n,;]+)/i;
    const locFromText = fullDocText.match(locRegex);
    const resolvedLocality = prop.locality || (locFromText ? locFromText[1].trim() : null);

    let resolvedChauhaddi = prop.chauhaddi || null;
    if (!resolvedChauhaddi) {
      const northM = fullDocText.match(/(?:उत्तर|north|uttar)[:\s]*([^\n,;]+)/i);
      const southM = fullDocText.match(/(?:दक्षिण|south|dakshin)[:\s]*([^\n,;]+)/i);
      const eastM = fullDocText.match(/(?:पूरब|पूर्व|east|purav|poorav)[:\s]*([^\n,;]+)/i);
      const westM = fullDocText.match(/(?:पश्चिम|west|paschim)[:\s]*([^\n,;]+)/i);
      if (northM || southM || eastM || westM) {
        resolvedChauhaddi = {
          north: northM ? northM[1].trim() : null,
          south: southM ? southM[1].trim() : null,
          east: eastM ? eastM[1].trim() : null,
          west: westM ? westM[1].trim() : null,
        };
      }
    }

    let answer = `Aapke vault me **"${primary.title}"** mil gaya hai.`;

    if (docTypeQuery === 'property' || prop.khasraNumber || resolvedKhasra || resolvedPlot) {
      if (resolvedOwner) answer += `\n• **Owner (Kiske naam):** ${resolvedOwner}`;
      if (resolvedKhasra) answer += `\n• **Khasra Number:** ${resolvedKhasra}`;
      if (resolvedKhatauni) answer += `\n• **Khatauni / Khata:** ${resolvedKhatauni}`;
      if (resolvedPlot) answer += `\n• **Plot / Flat No.:** ${resolvedPlot}`;
      if (resolvedArea) answer += `\n• **Rakba (Area):** ${resolvedArea}`;
      if (resolvedLocality) answer += `\n• **Locality / Mauza:** ${resolvedLocality}`;
      if (resolvedChauhaddi) {
        const cParts = [
          resolvedChauhaddi.north && `Uttar: ${resolvedChauhaddi.north}`,
          resolvedChauhaddi.east && `Purav: ${resolvedChauhaddi.east}`,
          resolvedChauhaddi.south && `Dakshin: ${resolvedChauhaddi.south}`,
          resolvedChauhaddi.west && `Paschim: ${resolvedChauhaddi.west}`,
        ].filter(Boolean);
        if (cParts.length) answer += `\n• **Chauhaddi (Boundaries):** ${cParts.join(' | ')}`;
      }
      if (primary.notes && !resolvedArea && !resolvedChauhaddi) {
        answer += `\n• **Deed Details / Notes:** ${primary.notes}`;
      }
      if (!resolvedKhasra && !resolvedPlot && !resolvedArea) {
        if (docNum) answer += `\n• **Document Number:** ${docNum}`;
        if (primary.notes) answer += `\n• **Details:** ${primary.notes}`;
      }
    }

    if (util.serviceProvider || util.consumerNumber || util.billAmount) {
      if (util.serviceProvider) answer += `\n• **Service Provider:** ${util.serviceProvider}`;
      if (util.consumerNumber) answer += `\n• **Consumer / CA Number:** ${util.consumerNumber}`;
      if (util.billAmount) answer += `\n• **Bill Amount:** ${util.billAmount}`;
      if (util.billDueDate) answer += `\n• **Due Date:** ${util.billDueDate}`;
      if (util.meterNumber) answer += `\n• **Meter No.:** ${util.meterNumber}`;
    } else if (docTypeQuery === 'bill') {
      if (docNum) answer += `\n• **Consumer / Account No.:** ${docNum}`;
      if (primary.notes) answer += `\n• **Bill Details / Notes:** ${primary.notes}`;
    }

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

    const copyVal = resolvedKhasra || resolvedPlot || util.consumerNumber || docNum || med.medicines || null;

    return {
      answer,
      copyableValue: copyVal,
      sourceDocId: primary._id?.toString() || null,
      sourceDocTitle: primary.title,
      category: primary.category || null,
      suggestedAction: copyVal ? 'COPY_NUMBER' : 'VIEW_DOCUMENT',
      matchedDocs: matchedDocsList.map(d => ({
        id: d._id?.toString(),
        title: d.title,
        category: d.category,
        institutionOrDoctor: d.ocrExtractedData?.propertyDetails?.khasraNumber ? `Khasra #${d.ocrExtractedData.propertyDetails.khasraNumber}` : (d.ocrExtractedData?.utilityBillDetails?.serviceProvider || d.ocrExtractedData?.medicalDetails?.hospitalOrClinic || d.ocrExtractedData?.academicDetails?.institution || d.category),
        date: d.issueDate ? new Date(d.issueDate).toISOString().split('T')[0] : null,
      })),
      engine: 'heuristic_fallback',
    };
  }

  // Actionable contextual responses when no matching document is found
  if (docTypeQuery === 'property') {
    return {
      answer: `Aapke vault me abhi koi **Khasra, Registry ya Zameen** se juda document nahi mila.\n\n📌 **Khasra number dekhne ke liye:**\n1. Vault me apni **Registry (Bainama), Khatauni ya Khasra copy** upload karein.\n2. Hamara AI Scanner auto-extract karke Khasra number, Rakba aur Chauhaddi aapke vault me save kar dega!`,
      copyableValue: null,
      sourceDocId: null,
      sourceDocTitle: null,
      category: 'Bank & Property',
      suggestedAction: null,
      engine: 'heuristic_fallback',
    };
  }

  if (docTypeQuery === 'bill') {
    return {
      answer: `Aapke vault me abhi koi **Electricity, Water ya Gas Bill** upload nahi mila.\n\n📌 **Bijli Bill add karne ke liye:**\n1. Apna Bijli bill upload karein.\n2. AI auto-extract karke CA Consumer number, bill amount aur due date save kar dega!`,
      copyableValue: null,
      sourceDocId: null,
      sourceDocTitle: null,
      category: 'Other',
      suggestedAction: null,
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
            const prop = ocr.propertyDetails || {};
            const util = ocr.utilityBillDetails || {};

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

            if (prop.ownerName) extraInfo.push(`Property Owner: "${prop.ownerName}"`);
            if (prop.khasraNumber) extraInfo.push(`Khasra Number: "${prop.khasraNumber}"`);
            if (prop.plotOrHouseNumber) extraInfo.push(`Plot/House No: "${prop.plotOrHouseNumber}"`);
            if (prop.area) extraInfo.push(`Property Area/Rakba: "${prop.area}"`);
            if (prop.locality) extraInfo.push(`Locality/Village: "${prop.locality}"`);
            if (prop.chauhaddi) {
              const c = prop.chauhaddi;
              extraInfo.push(`Chauhaddi: [Uttar/North: "${c.north || ''}", Dakshin/South: "${c.south || ''}", Purav/East: "${c.east || ''}", Paschim/West: "${c.west || ''}"]`);
            }

            if (util.serviceProvider) extraInfo.push(`Bill Provider: "${util.serviceProvider}"`);
            if (util.consumerNumber) extraInfo.push(`Consumer/CA Number: "${util.consumerNumber}"`);
            if (util.billAmount) extraInfo.push(`Bill Amount: "${util.billAmount}"`);
            if (util.billDueDate) extraInfo.push(`Due Date: "${util.billDueDate}"`);

            if (emrg.bloodGroup) extraInfo.push(`Blood Group: "${emrg.bloodGroup}"`);
            if (emrg.tpaProvider) extraInfo.push(`Insurance TPA: "${emrg.tpaProvider}"`);
            if (emrg.tollFreeHelpLine) extraInfo.push(`Cashless Helpline: "${emrg.tollFreeHelpLine}"`);

            if (ocr.summary) extraInfo.push(`AI Summary: "${ocr.summary}"`);
            if (Array.isArray(ocr.executiveSummary) && ocr.executiveSummary.length > 0) {
              extraInfo.push(`Key Bullets: "${ocr.executiveSummary.join(' | ')}"`);
            }
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
   - For property deeds / land registry / Khasra-Khatauni / Bainama / Chauhaddi questions (e.g. "Khet ka khasra number kya hai?", "Raipur plot kiske naam hai?", "Registry ki chauhaddi batao"):
     - State owner name, Khasra/Khatauni number, plot/flat number, area/rakba (Gaj/Bigha/Sq Ft), locality/mauza, and all 4 boundary directions (Chauhaddi: Uttar/North, Dakshin/South, Purav/East, Paschim/West) in clean bullet points!
     - Set "copyableValue" to the Khasra number or deed number.
   - For utility bills / Bijli / Pani / Gas bill questions (e.g. "Bijli ke bill ka CA number do", "Electricity bill due date aur amount kya hai?"):
     - State service provider (UPPCL, BSES, Tata Power, etc.), Consumer/CA Number in bold, Bill Amount, and Due Date.
     - Set "copyableValue" to the Consumer / CA Number so the user can 1-tap copy it for quick online bill payment!
     - Set "suggestedAction" to "COPY_NUMBER".
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

    // Parallel Model Racing: Race top Flash models simultaneously for instant response
    const modelsToRace = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
    ];

    const abortControllers = modelsToRace.map(() => new AbortController());
    const overallTimeoutId = setTimeout(() => {
      abortControllers.forEach(c => {
        try { c.abort('Overall chat timeout'); } catch (e) {}
      });
    }, 25000);

    let result = null;
    let successfulModel = null;

    try {
      const racePromises = modelsToRace.map(async (modelName, idx) => {
        const controller = abortControllers[idx];
        const t0 = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText && rawText.trim()) {
            console.log(`[Vault AI] ⚡ Chat Race WON by: ${modelName} in ${Date.now() - t0}ms!`);
            abortControllers.forEach((c, cIdx) => {
              if (cIdx !== idx) {
                try { c.abort('Competitor model won'); } catch (e) {}
              }
            });
            return { model: modelName, data };
          }
        }

        const errStatus = response.status;
        if (errStatus === 429) {
          console.warn(`[Vault AI] Daily/RPM Quota limit reached on ${modelName} (429).`);
        } else {
          console.warn(`[Vault AI] ${modelName} returned status ${errStatus}`);
        }
        throw new Error(`${modelName} status ${errStatus}`);
      });

      const winner = await Promise.any(racePromises);
      result = winner.data;
      successfulModel = winner.model;
    } catch (raceErr) {
      console.warn('[Vault AI] Cloud chat models failed or timed out:', raceErr.message);
    } finally {
      clearTimeout(overallTimeoutId);
    }

    if (!result) {
      console.log('[Vault AI] Cloud models unavailable (quota/load). Responding seamlessly via local Heuristic Intelligence.');
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
      matchedDocs: Array.isArray(parsedData.matchedDocs) ? parsedData.matchedDocs : [],
      engine: successfulModel || 'gemini',
    };
  } catch (err) {
    console.error('[Vault AI Assistant Error]:', err);
    return fallbackVaultAssistant({ query, familyMembers, documents, currentUser });
  }
}
