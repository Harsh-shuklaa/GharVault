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
 * Generates an intelligent, human-readable document title adhering to:
 * [Document Type] [Optional Context/Last4] — [Member First Name]
 * Examples:
 * - "PAN Card — Aditya"
 * - "Aadhaar Card — Harsh"
 * - "Star Health Mediclaim (2026) — Aditya"
 * - "Vehicle RC (1234) — Harsh"
 */
export function generateSmartDocumentTitle(params = {}) {
  const extracted = params.extractedData || params.ocrData || {};
  const docType = params.docType || extracted.docType;
  const holderName = params.holderName || extracted.holderName || '';
  const matchedMemberName = params.matchedMemberName || params.assignedMemberName || extracted.matchedMemberName || '';
  const docNumber = params.docNumber || extracted.docNumber || '';
  const emergencyDetails = params.emergencyDetails || extracted.emergencyDetails || null;
  const academicDetails = params.academicDetails || extracted.academicDetails || null;
  const medicalDetails = params.medicalDetails || extracted.medicalDetails || null;
  const propertyDetails = params.propertyDetails || extracted.propertyDetails || null;
  const utilityBillDetails = params.utilityBillDetails || extracted.utilityBillDetails || null;
  const category = params.category || extracted.category || '';
  const originalFileName = params.originalFileName || '';

  let cleanType = (docType || 'Document').trim();

  // 1. Property Sale Deed & Khasra-Khatauni Title logic
  if (propertyDetails) {
    if (propertyDetails.khasraNumber) {
      cleanType = `Sale Deed (Khasra ${propertyDetails.khasraNumber})`;
    } else if (propertyDetails.plotOrHouseNumber) {
      cleanType = `Property Deed (${propertyDetails.plotOrHouseNumber})`;
    } else if (propertyDetails.area) {
      cleanType = `Sale Deed (${propertyDetails.area})`;
    } else if (propertyDetails.propertyType) {
      cleanType = `${propertyDetails.propertyType} Deed`;
    } else {
      cleanType = 'Property Sale Deed';
    }
  }

  // 2. Utility Bill Title logic (Electricity, Water, Gas)
  if (utilityBillDetails) {
    const prov = utilityBillDetails.serviceProvider || '';
    const bType = utilityBillDetails.billType || 'Electricity Bill';
    const amt = utilityBillDetails.billAmount ? ` (${utilityBillDetails.billAmount})` : '';
    cleanType = prov ? `${prov} ${bType}${amt}` : `${bType}${amt}`;
  }

  // 3. Academic Certificate / Degree / Semester DMC Title logic
  if (academicDetails) {
    if (academicDetails.certificateTitle) {
      cleanType = academicDetails.certificateTitle.trim();
    } else if (academicDetails.semesterOrYear && academicDetails.courseOrDegree) {
      cleanType = `${academicDetails.semesterOrYear} DMC (${academicDetails.courseOrDegree})`;
    } else if (academicDetails.courseOrDegree) {
      cleanType = `${academicDetails.courseOrDegree} Degree`;
    }
  }

  // 4. Doctor Prescription / Clinic Slip / Medical Report Title logic
  if (medicalDetails) {
    if (medicalDetails.doctorName && medicalDetails.hospitalOrClinic) {
      cleanType = `Prescription (${medicalDetails.doctorName} • ${medicalDetails.hospitalOrClinic})`;
    } else if (medicalDetails.doctorName) {
      cleanType = `Prescription (${medicalDetails.doctorName})`;
    } else if (medicalDetails.hospitalOrClinic) {
      cleanType = `Medical Slip (${medicalDetails.hospitalOrClinic})`;
    } else if (medicalDetails.diagnosis) {
      cleanType = `Medical Report (${medicalDetails.diagnosis})`;
    }
  }

  // 5. Normalize common standard types
  const isPrescriptionOrSlip = /prescription|parchi|parcha|rx|dawai|doctor|clinic/i.test(cleanType + ' ' + originalFileName);
  const isMedicalContext = /medical|hospital|clinic|doctor|prescription|parchi|parcha|ayushman|abha|mediclaim|health|insurance/i.test(cleanType + ' ' + originalFileName);

  if (/aadhaar|adhar|uidai/i.test(cleanType) || /aadhaar|adhar/i.test(originalFileName)) {
    cleanType = 'Aadhaar Card';
  } else if (/pan\b|incometax|nsdl/i.test(cleanType) || /\bpan\b/i.test(originalFileName)) {
    cleanType = 'PAN Card';
  } else if (!isMedicalContext && (/\b(driving licen[cs]e|driver licen[cs]e|driving)\b/i.test(cleanType) || (/\b(driving licen[cs]e|driving)\b/i.test(originalFileName)))) {
    cleanType = 'Driving License';
  } else if (/passport/i.test(cleanType) || /passport/i.test(originalFileName)) {
    cleanType = 'Passport';
  } else if (/ayushman|abha/i.test(cleanType) || /ayushman|abha/i.test(originalFileName)) {
    cleanType = 'Ayushman / ABHA Card';
  } else if (!medicalDetails && (/insurance|mediclaim|health|medical|hospital/i.test(cleanType) || category === 'Medical & Health' || /insurance|health|mediclaim/i.test(originalFileName))) {
    if (emergencyDetails?.tpaProvider && emergencyDetails.tpaProvider !== 'Health Insurance TPA') {
      cleanType = `${emergencyDetails.tpaProvider} Mediclaim`;
    } else {
      cleanType = 'Health Insurance';
    }
  } else if (!isMedicalContext && (/\b(vehicle\s*rc|car\s*rc|bike\s*rc)\b/i.test(cleanType) || (category === 'Vehicle' && !isMedicalContext) || (/\b(rc|vehicle)\b/i.test(originalFileName) && !/parchi|parcha|march|research/i.test(originalFileName)))) {
    cleanType = 'Vehicle RC';
  } else if (!propertyDetails && (/\b(sale deed|bainama|bai-nama|registry)\b/i.test(cleanType) || /\b(registry|bainama|sale_deed)\b/i.test(originalFileName))) {
    cleanType = 'Property Sale Deed';
  } else if (!propertyDetails && (/\b(khasra|khatauni|jamabandi|fard)\b/i.test(cleanType) || /\b(khasra|khatauni)\b/i.test(originalFileName))) {
    cleanType = 'Khasra-Khatauni';
  } else if (!utilityBillDetails && (/\b(electricity bill|bijli bill|power bill)\b/i.test(cleanType) || /\b(bijli|electricity_bill)\b/i.test(originalFileName))) {
    cleanType = 'Electricity Bill';
  } else if (/voter|epic/i.test(cleanType) || /voter/i.test(originalFileName)) {
    cleanType = 'Voter ID';
  } else if (/birth/i.test(cleanType) || /birth/i.test(originalFileName)) {
    cleanType = 'Birth Certificate';
  } else if (!academicDetails && (/marksheet|degree|diploma|certificate/i.test(cleanType) || /marksheet|degree/i.test(originalFileName))) {
    cleanType = 'Education Certificate';
  }

  // Extract clean First Name of member
  const rawName = (matchedMemberName || holderName || '').trim();
  let firstName = '';
  if (rawName) {
    const rawFirst = rawName.split(/[\s_.-]+/)[0];
    if (rawFirst && rawFirst.length > 1) {
      firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
    }
  }

  // Contextual Short Differentiator
  let contextSuffix = '';
  const cleanDoc = (docNumber || '').trim();

  if (cleanType === 'Vehicle RC' && cleanDoc) {
    const last4 = cleanDoc.replace(/[^0-9]/g, '').slice(-4);
    if (last4) contextSuffix = ` (${last4})`;
  } else if (cleanType === 'Passport' && cleanDoc) {
    contextSuffix = ` (${cleanDoc.slice(0, 1).toUpperCase()}${cleanDoc.slice(-3)})`;
  } else if (cleanType.includes('Mediclaim') || cleanType === 'Health Insurance') {
    const polNum = emergencyDetails?.policyNumber || cleanDoc;
    if (polNum && polNum.length >= 4) {
      const polShort = polNum.replace(/[^A-Za-z0-9]/g, '').slice(-4);
      if (polShort) contextSuffix = ` (${polShort})`;
    }
  }

  // Assemble Title
  if (firstName) {
    return `${cleanType}${contextSuffix} — ${firstName}`;
  } else if (contextSuffix) {
    return `${cleanType}${contextSuffix}`;
  }
  return cleanType;
}

/**
 * Heuristic fallback parser when AI is unavailable or offline
 */
export function fallbackHeuristicScanner(fileName = '', originalText = '', members = []) {
  const text = (fileName + ' ' + (originalText || '')).toLowerCase();
  let docType = 'Other';
  let category = 'ID Cards';
  let docNumber = '';
  let expiryDate = null;
  let suggestedTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  const isMedicalCandidate = /\b(prescription|hospital|clinic|doctor|dr\.|medicine|dawai|parchi|parcha|discharge|medical|mediclaim|ayushman|abha|opd|rx|health|lab report|blood test|tablet)\b/i.test(text);

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
  } else if (isMedicalCandidate || text.includes('insurance') || text.includes('policy') || text.includes('health') || text.includes('mediclaim') || text.includes('ayushman') || text.includes('abha')) {
    docType = text.includes('ayushman') || text.includes('abha') ? 'Ayushman / ABHA Health Card' : (text.includes('prescription') || text.includes('parchi') || text.includes('parcha') || text.includes('doctor') || text.includes('dr.') ? 'Doctor Prescription' : (text.includes('insurance') || text.includes('mediclaim') ? 'Health Insurance' : 'Medical Record'));
    category = 'Medical & Health';
    suggestedTitle = docType;
    const m = text.match(/\b([A-Z0-9\/-]{7,24})\b/i);
    if (m) docNumber = m[1].toUpperCase();
  } else if (!isMedicalCandidate && (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b)\b/i.test(text) && !/\b(medical licen[cs]e|council licen[cs]e|doctor licen[cs]e)\b/i.test(text))) {
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
  } else if (!isMedicalCandidate && (/\b(vehicle\s*rc|car\s*rc|bike\s*rc|\brc\b)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text))) {
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

  // Extract emergency medical details for Medical & Health or Driving License
  let emergencyDetails = null;
  const bgExplicitMatch = text.match(/(?:blood\s*group|blood|bg)[:\s]*([ABOab0]{1,2}\s*[+-]|(?:A|B|AB|O)\s*(?:POS(?:ITIVE)?|NEG(?:ATIVE)?))/i);
  const bgMatch = bgExplicitMatch || text.match(/\b(A|B|AB|O)\s*([+-]|POS(?:ITIVE)?|NEG(?:ATIVE)?)(?!\w)/i);
  let bloodGroup = null;
  if (bgMatch) {
    const rawBg = (bgMatch[1] + (bgMatch[2] || '')).toUpperCase().replace(/\s+/g, '');
    if (rawBg.includes('NEG') || rawBg.includes('-')) {
      bloodGroup = rawBg.replace(/NEG(?:ATIVE)?|-/g, '') + '-';
    } else {
      bloodGroup = rawBg.replace(/POS(?:ITIVE)?|\+/g, '') + '+';
    }
  }
  
  const tpaMatch = text.match(/\b(Medi\s*Assist|Star\s*Health|Care\s*Health|HDFC\s*ERGO|Niva\s*Bupa|Vidal\s*Health|Paramount|United\s*India|New\s*India|National\s*Insurance|Bajaj\s*Allianz|ICICI\s*Lombard|Max\s*Bupa|Ayushman\s*Bharat|ABHA)\b/i);
  const tpaProvider = tpaMatch ? tpaMatch[1] : null;

  const hlMatch = text.match(/\b(1800[-\s]?\d{3}[-\s]?\d{3,4}|(?:\+91|0)?[6-9]\d{9})\b/);
  const tollFreeHelpLine = hlMatch ? hlMatch[1] : null;

  const allergyMatch = text.match(/\b(?:allergy|allergic\s*to|chronic|condition|diabetic|asthma|hypertension)[:\s]*([^\n,.;]+)/i);
  const allergies = allergyMatch ? allergyMatch[1].trim() : null;

  if (category === 'Medical & Health' || bloodGroup || tpaProvider) {
    emergencyDetails = {
      bloodGroup: bloodGroup || null,
      tpaProvider: tpaProvider || (category === 'Medical & Health' ? 'Health Insurance TPA' : null),
      policyNumber: docNumber || null,
      tollFreeHelpLine: tollFreeHelpLine || null,
      allergies: allergies || null,
      emergencyContactPhone: null,
    };
  }

  // Academic & Degree Extraction in Heuristic
  let academicDetails = null;
  const isCivilOrVehicleCert = /\b(registration certificate|vehicle rc|vehicle|birth certificate|death certificate|caste certificate|income certificate|medical certificate)\b/i.test(text);
  const isAcademic = !isCivilOrVehicleCert && category !== 'Vehicle' && (text.includes('degree') || text.includes('marksheet') || text.includes('dmc') || text.includes('semester') || /\bsem\b/i.test(text) || /\b(bca|mca|btech|b\.tech|mtech|mbbs|ba|bcom|bsc|ma|mcom|msc)\b/i.test(text) || text.includes('university') || text.includes('college') || text.includes('innovator') || (text.includes('certificate') && (text.includes('merit') || text.includes('hackathon') || text.includes('course') || text.includes('training') || text.includes('education') || text.includes('student'))));
  
  if (isAcademic) {
    category = 'Education';
    let courseOrDegree = null;
    if (text.includes('bca')) courseOrDegree = 'BCA';
    else if (text.includes('mca')) courseOrDegree = 'MCA';
    else if (text.includes('btech') || text.includes('b.tech')) courseOrDegree = 'B.Tech';
    else if (text.includes('10th') || text.includes('matric')) courseOrDegree = 'Class 10';
    else if (text.includes('12th') || text.includes('inter')) courseOrDegree = 'Class 12';

    let semesterOrYear = null;
    const semMatch = text.match(/\b([1-8](?:st|nd|rd|th)?\s*(?:sem|semester))\b/i);
    if (semMatch) semesterOrYear = semMatch[1].toUpperCase();

    let certificateTitle = null;
    if (text.includes('innovator')) certificateTitle = 'Innovators Certificate';
    else if (text.includes('hackathon')) certificateTitle = 'Hackathon Winner';
    else if (text.includes('merit')) certificateTitle = 'Certificate of Merit';

    let institution = null;
    const instMatch = text.match(/\b(delhi\s*university|aktu|cbse|iit|nit|ignou|du)\b/i);
    if (instMatch) institution = instMatch[1].toUpperCase();

    docType = certificateTitle ? certificateTitle : (semesterOrYear ? `${semesterOrYear} Marksheet` : (courseOrDegree ? `${courseOrDegree} Degree` : 'Education Certificate'));

    academicDetails = {
      institution,
      courseOrDegree,
      semesterOrYear,
      certificateTitle,
      marksOrGrade: null,
    };
  }

  // Doctor Prescription & Medical Slips Extraction in Heuristic
  let medicalDetails = null;
  const isPrescription = text.includes('dr.') || text.includes('doctor') || text.includes('prescription') || text.includes('clinic') || text.includes('hospital') || text.includes('dawai') || text.includes('rx') || text.includes('tablet') || text.includes('apollo') || text.includes('max') || text.includes('fortis') || text.includes('paracetamol');

  if (isPrescription) {
    category = 'Medical & Health';
    docType = text.includes('lab') || text.includes('blood test') || text.includes('report') ? 'Medical Lab Report' : 'Doctor Prescription';

    let doctorName = null;
    const drMatch = text.match(/\b(dr\.?\s+[a-z]+(?:\s+[a-z]+)?)\b/i);
    if (drMatch) doctorName = drMatch[1];

    let hospitalOrClinic = null;
    const hospMatch = text.match(/\b(apollo|max\s*hospital|max\s*healthcare|fortis|aiims|dr\.?\s*lal\s*pathlabs|pathlabs|medanta)\b/i);
    if (hospMatch) hospitalOrClinic = hospMatch[1];

    let diagnosis = null;
    const diagMatch = text.match(/\b(fever|viral|typhoid|dengue|cough|cold|infection|thyroid|diabetes|bp|migraine|arthritis)\b/i);
    if (diagMatch) diagnosis = diagMatch[1];

    const medMatch = text.match(/\b(paracetamol|dolo|azithromycin|pantocid|amoxicillin|augmentin|crocin|combiflam)\b/gi);
    const medicines = medMatch ? medMatch.join(', ') : null;

    medicalDetails = {
      doctorName,
      hospitalOrClinic,
      diagnosis,
      medicines,
      consultationDate: null,
    };
  }

  // Property Sale Deed, Khasra-Khatauni, Land Registry Extraction in Heuristic
  let propertyDetails = null;
  const isPropertyDoc = /\b(registry|bainama|bai-nama|sale deed|khasra|khatauni|jamabandi|fard|plot|land|rakba|chauhaddi|mauza|pargana|tehsil)\b/i.test(text);

  if (isPropertyDoc) {
    category = 'Bank & Property';
    docType = text.includes('khasra') || text.includes('khatauni') || text.includes('jamabandi') || text.includes('fard') ? 'Khasra / Khatauni' : 'Property Sale Deed';

    const khasraMatch = text.match(/(?:खसरा\s*(?:संख्या|सं\.?|no\.?|number)?|khasra\s*(?:no\.?|number)?|survey\s*(?:no\.?|number)?|khasra)\s*(?:\([^)]*\))?[:\s]*([0-9\/-]+)/i);
    const khatauniMatch = text.match(/(?:खतौनी\s*(?:संख्या|सं\.?|no\.?|number)?|khatauni\s*(?:no\.?|number)?|khata\s*(?:no\.?|number)?)\s*(?:\([^)]*\))?[:\s]*([0-9\/-]+)/i);
    const plotMatch = text.match(/(?:प्लाट|plot\s*(?:no\.?|number)?|flat\s*(?:no\.?|number)?|house\s*(?:no\.?|number)?|makan\s*no\.?)\s*(?:\([^)]*\))?[:\s]*([A-Za-z0-9\/-]+)/i);
    const rakbaMatch = text.match(/(?:रकबा|rakba|area|size|measuring)\s*(?:\([^)]*\))?[:\s]*([0-9]+(?:\.[0-9]+)?\s*(?:gaj|गज|sq\.?\s*yards?|sq\.?\s*ft|bigha|बीघा|वर्ग\s*गज|acre|hectare|sqm))/i) ||
      text.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:gaj|गज|sq\.?\s*yards?|sq\.?\s*ft|bigha|बीघा))\b/i);

    const northMatch = text.match(/(?:उत्तर|north|uttar)[:\s]*([^\n,;]+)/i);
    const southMatch = text.match(/(?:दक्षिण|south|dakshin)[:\s]*([^\n,;]+)/i);
    const eastMatch = text.match(/(?:पूरब|पूर्व|east|purav|poorav)[:\s]*([^\n,;]+)/i);
    const westMatch = text.match(/(?:पश्चिम|west|paschim)[:\s]*([^\n,;]+)/i);

    const ownerMatch = text.match(/(?:क्रेता|खरीदार|krayakarta|buyer|owner|purchaser|in favour of)\s*(?:\([^)]*\))?[:\s]*([^\n,;]+)/i);
    const sellerMatch = text.match(/(?:विक्रेता|बेचने\s*वाला|vikreta|seller|vendor|executed by)\s*(?:\([^)]*\))?[:\s]*([^\n,;]+)/i);
    const deedMatch = text.match(/(?:पंजीकरण|रजिस्ट्री|bahi|book|deed|zild|reg(?:istration)?\s*no\.?)\s*(?:संख्या|सं\.?|no\.?)?[:\s]*([A-Za-z0-9\/-]+)/i);
    const localityMatch = text.match(/(?:मौजा|mauza|गाँव|village|locality|तहसील|tehsil|जिला|district)\s*(?:\([^)]*\))?[:\s]*([^\n,;]+)/i);

    const cleanKhasra = khasraMatch ? khasraMatch[1].trim() : null;
    const cleanPlot = plotMatch ? plotMatch[1].trim() : null;
    if (cleanKhasra) docNumber = `Khasra #${cleanKhasra}`;
    else if (cleanPlot) docNumber = `Plot #${cleanPlot}`;

    propertyDetails = {
      propertyType: text.includes('khet') || text.includes('krishi') || text.includes('agricultural') ? 'Agricultural Land' : 'Residential Plot',
      ownerName: ownerMatch ? ownerMatch[1].trim() : (matchedMember?.name || null),
      sellerName: sellerMatch ? sellerMatch[1].trim() : null,
      khasraNumber: cleanKhasra,
      khatauniNumber: khatauniMatch ? khatauniMatch[1].trim() : null,
      plotOrHouseNumber: cleanPlot,
      area: rakbaMatch ? rakbaMatch[1].trim() : null,
      locality: localityMatch ? localityMatch[1].trim() : null,
      registrationDate: null,
      deedNumber: deedMatch ? deedMatch[1].trim() : null,
      stampDutyOrAmount: null,
      chauhaddi: (northMatch || southMatch || eastMatch || westMatch) ? {
        north: northMatch ? northMatch[1].trim() : null,
        south: southMatch ? southMatch[1].trim() : null,
        east: eastMatch ? eastMatch[1].trim() : null,
        west: westMatch ? westMatch[1].trim() : null,
      } : null,
    };
  }

  // Utility Bills (Electricity, Water, Gas) Extraction in Heuristic
  let utilityBillDetails = null;
  const isUtilityBill = /\b(electricity|bijli|power|uppcl|bses|tata power|jal board|water bill|piped gas|igl|indane|bill)\b/i.test(text) &&
    /\b(consumer|ca\s*no|k\s*no|due date|units|meter|payable|amount)\b/i.test(text);

  if (isUtilityBill) {
    category = 'Financial';
    const isWater = text.includes('water') || text.includes('jal');
    const isGas = text.includes('gas') || text.includes('igl') || text.includes('indane');
    docType = isWater ? 'Water Bill' : (isGas ? 'Piped Gas Bill' : 'Electricity Bill');

    const caMatch = text.match(/(?:उपभोक्ता\s*(?:खाता|संख्या)?|खाता\s*संख्या|consumer\s*(?:account|number|no\.?|id)?|ca\s*(?:number|no\.?|id)?|k\s*(?:number|no\.?))\s*(?:\([^)]*\))?[:\s]*([A-Za-z0-9\/-]+)/i);
    const amtMatch = text.match(/(?:देय\s*राशि|कुल\s*देय|total\s*payable|amount\s*payable|bill\s*amount|amount|deya\s*rashi)[:\s]*(?:₹|rs\.?)?\s*([0-9,]+(?:\.[0-9]{2})?)/i) ||
      text.match(/(?:₹|rs\.?)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    const dueDateMatch = text.match(/(?:अंतिम\s*(?:भुगतान\s*)?तिथि|देय\s*तिथि|due\s*date|antim\s*tithi|pay\s*by)[:\s]*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][12][90]\d{2})/i);
    const mtrMatch = text.match(/(?:मीटर\s*(?:संख्या|सं\.?|no\.?|number)?|meter\s*(?:no\.?|number)?)[:\s]*([A-Za-z0-9-]+)/i);

    let provider = null;
    const provMatch = text.match(/\b(uppcl|bses|tata\s*power|delhi\s*jal\s*board|igl|indane|mahadiscom|torrent|adani\s*electricity)\b/i);
    if (provMatch) provider = provMatch[1].toUpperCase();

    const cleanAmt = amtMatch ? `₹${amtMatch[1].replace(/,/g, '')}` : null;
    const cleanDueDate = dueDateMatch ? dueDateMatch[1].replace(/[\.\-]/g, '/') : null;
    let cleanCa = caMatch ? caMatch[1].trim() : null;
    if (cleanCa && ['no', 'id', 'num', 'number'].includes(cleanCa.toLowerCase())) {
      const fallbackCa = text.match(/(?:ca|consumer|खाता)[^0-9]*([0-9]{8,16})/i);
      cleanCa = fallbackCa ? fallbackCa[1].trim() : null;
    }

    if (cleanDueDate) {
      try {
        const parts = cleanDueDate.split('/');
        if (parts.length === 3) {
          expiryDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        }
      } catch (e) {}
    }

    if (cleanCa) docNumber = cleanCa;

    utilityBillDetails = {
      serviceProvider: provider || 'Electricity Board',
      billType: docType,
      consumerNumber: cleanCa,
      meterNumber: mtrMatch ? mtrMatch[1].trim() : null,
      billAmount: cleanAmt,
      billDueDate: cleanDueDate,
      billingCycle: null,
      registeredName: matchedMember?.name || null,
    };
  }

  // 3-Bullet Executive Summary
  let executiveSummary = [];
  if (propertyDetails) {
    const pOwner = propertyDetails.ownerName || matchedMember?.name || 'Family Member';
    const pArea = propertyDetails.area ? ` (${propertyDetails.area})` : '';
    executiveSummary.push(`Property ${pOwner} ke naam par registered hai${pArea}.`);
    if (propertyDetails.khasraNumber || propertyDetails.plotOrHouseNumber) {
      executiveSummary.push(`Khasra / Plot: ${[propertyDetails.khasraNumber && `Khasra No. ${propertyDetails.khasraNumber}`, propertyDetails.plotOrHouseNumber && `Plot ${propertyDetails.plotOrHouseNumber}`].filter(Boolean).join(' • ')}`);
    }
    if (propertyDetails.chauhaddi) {
      const c = propertyDetails.chauhaddi;
      const bText = [c.north && `Uttar: ${c.north}`, c.east && `Purav: ${c.east}`, c.south && `Dakshin: ${c.south}`, c.west && `Paschim: ${c.west}`].filter(Boolean).join(', ');
      if (bText) executiveSummary.push(`Chauhaddi: ${bText}`);
    }
  } else if (utilityBillDetails) {
    executiveSummary.push(`${utilityBillDetails.serviceProvider} ${utilityBillDetails.billType}${utilityBillDetails.billAmount ? `: ${utilityBillDetails.billAmount}` : ''}`);
    if (utilityBillDetails.consumerNumber) {
      executiveSummary.push(`Consumer CA Number: ${utilityBillDetails.consumerNumber}`);
    }
    if (utilityBillDetails.billDueDate) {
      executiveSummary.push(`Due Date: ${utilityBillDetails.billDueDate}`);
    }
  }

  let detectedDob = null;
  const dobMatch = text.match(/\b(?:dob|d\.o\.b\.?|date of birth|birth date|born|janm)[:\s]*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][12][90]\d{2})\b/i) ||
    text.match(/\b([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.](?:19\d{2}|20[0-2]\d))\b/);
  if (dobMatch) detectedDob = dobMatch[1].replace(/[\.\-]/g, '/');

  const smartTitle = generateSmartDocumentTitle({
    docType,
    holderName: matchedMember?.name || '',
    matchedMemberName: matchedMember?.name || '',
    docNumber,
    emergencyDetails,
    academicDetails,
    medicalDetails,
    propertyDetails,
    utilityBillDetails,
    category,
    originalFileName: fileName,
  });

  return {
    docType,
    category,
    docNumber,
    holderName: matchedMember?.name || '',
    dob: detectedDob,
    expiryDate,
    suggestedTitle: smartTitle,
    emergencyDetails,
    academicDetails,
    medicalDetails,
    propertyDetails,
    utilityBillDetails,
    executiveSummary,
    summary: `${docType} for ${matchedMember?.name || 'family member'}${propertyDetails?.khasraNumber ? ` (Khasra ${propertyDetails.khasraNumber})` : ''}${utilityBillDetails?.billAmount ? ` of ${utilityBillDetails.billAmount}` : ''}${academicDetails?.institution ? ` from ${academicDetails.institution}` : ''}${medicalDetails?.hospitalOrClinic ? ` at ${medicalDetails.hospitalOrClinic}` : ''}`,
    searchKeywords: [docType, category, matchedMember?.name, propertyDetails?.khasraNumber, propertyDetails?.area, utilityBillDetails?.consumerNumber, academicDetails?.institution, medicalDetails?.hospitalOrClinic, medicalDetails?.doctorName].filter(Boolean),
    matchedMemberId: matchedMember?._id || null,
    matchedMemberName: matchedMember?.name || '',
    confidence: docNumber || academicDetails || medicalDetails || propertyDetails || utilityBillDetails ? 0.75 : 0.5,
    qualityAssessment: {
      isBlurry: false,
      clarityScore: 'GOOD',
      issueFeedback: null,
    },
    aiEngine: 'heuristic_fallback',
  };
}

/**
 * Attempt document scanning via Local Ollama Multimodal Agent (100% Free, Private & Offline)
 */
export async function tryScanWithLocalOllama({ fileBuffer, mimeType = 'image/jpeg', fileName = '', familyMembers = [] }) {
  if (!fileBuffer) return null;
  // Ollama vision models (moondream, llava) require image bytes (JPEG, PNG, WebP)
  const isImage = (mimeType && mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|webp)$/i.test(fileName);
  if (!isImage) return null;

  try {
    // Fast health check (1200ms) to see if Ollama is running locally
    const tagsRes = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(1200),
    });
    if (!tagsRes.ok) return null;

    const data = await tagsRes.json();
    const visionModel = data.models?.find(m =>
      m.name.includes('qwen') ||
      m.name.includes('vl') ||
      m.name.includes('vision') ||
      m.name.includes('llava') ||
      m.name.includes('moondream')
    );
    if (!visionModel) return null;

    const modelName = visionModel.name;
    const base64Data = fileBuffer.toString('base64');

    const prompt = `Extract Indian document details in JSON format:
{
  "docType": "Health Insurance or Doctor Prescription or Voter ID or Aadhaar Card or PAN Card or Driving License or Passport or Electricity Bill or Marksheet or Property Deed or Other",
  "docNumber": "ID number, Policy No, EPIC No, PAN, Aadhaar, or Consumer CA No",
  "holderName": "Full name of person or patient or insured",
  "fatherOrSpouseName": "Father or husband name",
  "dob": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "category": "Medical & Health or ID Cards or Bank & Property or Education or Legal or Other",
  "summary": "Crisp 1-sentence summary"
}
Output valid JSON only.`;

    const genRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        images: [base64Data],
        stream: false,
        format: 'json',
        keep_alive: '2h', // Keep model hot in RAM so it never needs reloading
        options: {
          num_predict: 120,
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
      signal: AbortSignal.timeout(120000), // 2 min safety threshold for CPU processing
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

    let docType = (parsed.docType || 'Document').trim();
    if (docType.includes(' or ') || docType.length > 30) docType = 'Document';

    let docNumber = (parsed.docNumber || '').trim();
    if (/ID number|PAN|Aadhaar|Policy No|Clean ID/i.test(docNumber)) docNumber = '';

    let holderName = (parsed.holderName || '').trim();
    if (/full name|person name|holder|name of/i.test(holderName)) holderName = '';

    let fatherOrSpouseName = (parsed.fatherOrSpouseName || parsed.fatherName || '').trim();
    if (/father|husband|spouse/i.test(fatherOrSpouseName) || !fatherOrSpouseName) fatherOrSpouseName = null;

    // Intelligent Category Normalization across all document types
    let category = 'Other';
    const lowerDocType = docType.toLowerCase();
    const lowerRawCat = (parsed.category || '').toLowerCase();

    if (
      /insurance|mediclaim|health|prescription|doctor|hospital|clinic|tpa|ayushman|medical|lab report/i.test(lowerDocType) ||
      /medical|health/i.test(lowerRawCat)
    ) {
      category = 'Medical & Health';
    } else if (
      /aadhaar|pan card|voter|epic|passport|driving license|license|voter id|ration|id card/i.test(lowerDocType) ||
      /id card|identity/i.test(lowerRawCat)
    ) {
      category = 'ID Cards';
    } else if (
      /deed|registry|khasra|khatauni|bainama|property|fard|jamabandi|electricity|bijli|water bill|gas bill|utility|bill/i.test(lowerDocType) ||
      /property|bank|financial|bill/i.test(lowerRawCat)
    ) {
      category = 'Bank & Property';
    } else if (
      /marksheet|degree|diploma|certificate|dmc|semester|school|college|university/i.test(lowerDocType) ||
      /education|academic/i.test(lowerRawCat)
    ) {
      category = 'Education';
    } else if (
      /affidavit|agreement|stamp paper|court|legal|will/i.test(lowerDocType) ||
      /legal/i.test(lowerRawCat)
    ) {
      category = 'Legal';
    } else if (
      /rc|vehicle|pollution|puc|chassis/i.test(lowerDocType) ||
      /vehicle/i.test(lowerRawCat)
    ) {
      category = 'Other';
    } else if (parsed.category && ['ID Cards', 'Medical & Health', 'Bank & Property', 'Education', 'Legal', 'Other'].includes(parsed.category)) {
      category = parsed.category;
    } else {
      category = 'ID Cards';
    }

    let dob = parsed.dob || null;
    let expiryDate = parsed.expiryDate || null;
    if (expiryDate && expiryDate === dob) expiryDate = null;

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
      category,
      originalFileName: fileName,
    });

    return {
      docType,
      category,
      docNumber,
      holderName,
      fatherOrSpouseName: fatherOrSpouseName || null,
      dob,
      expiryDate,
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
      confidence: docNumber ? 0.95 : 0.88,
      qualityAssessment: {
        isBlurry: false,
        clarityScore: 'GOOD',
        issueFeedback: null,
      },
      aiEngine: `ollama_local (${modelName})`,
    };
  } catch (err) {
    console.warn('[Ollama Local Engine] Skipped/Proceeding to cloud:', err.message);
    return null;
  }
}

/**
 * Scan document using Google Gemini Multimodal Vision API (with Ollama Local Fall-Through)
 */
export async function scanDocumentWithAI({ fileBuffer, mimeType, fileName, familyMembers = [], customApiKey = null }) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  let fallbackText = '';
  if (fileBuffer) {
    try {
      fallbackText = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 5000));
    } catch (e) {}
  }

  // 1. Priority #1: Google Gemini Flash-Lite Cloud AI (~1s Instant Response, 0% CPU/RAM load)
  if (apiKey) {
    try {
      const geminiResult = await executeGeminiScan({
        fileBuffer,
        mimeType,
        fileName,
        familyMembers,
        apiKey,
      });
      if (geminiResult) {
        console.log(`[AI Scanner] ⚡ Successfully scanned via Cloud Gemini (${geminiResult.aiEngine})!`);
        return geminiResult;
      }
    } catch (geminiErr) {
      console.warn('[AI Scanner] Cloud Gemini attempt failed or quota reached:', geminiErr.message);
    }
  }

  // 2. Priority #2: Local Ollama AI Agent (100% Free, Private & Offline Fallback)
  try {
    const localOllamaResult = await tryScanWithLocalOllama({
      fileBuffer,
      mimeType,
      fileName,
      familyMembers,
    });
    if (localOllamaResult) {
      console.log(`[AI Scanner] Successfully scanned via Local Ollama Agent (${localOllamaResult.aiEngine})!`);
      return localOllamaResult;
    }
  } catch (ollamaErr) {
    console.warn('[AI Scanner] Local Ollama check failed, proceeding to heuristic fallback:', ollamaErr.message);
  }

  // 3. Priority #3: Intelligent Heuristic Scanner (Zero AI Offline Fallback)
  console.log('[AI Scanner] Cloud & local models unavailable. Using intelligent heuristic scanner.');
  return fallbackHeuristicScanner(fileName, fallbackText, familyMembers);
}

/**
 * Execute Cloud Gemini Scan using high-speed, high-quota Flash-Lite models
 */
async function executeGeminiScan({ fileBuffer, mimeType, fileName, familyMembers = [], apiKey }) {
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
Analyze the attached Indian official document (could be an Aadhaar Card, PAN Card, Driving License, Passport, Vehicle RC, Health Insurance Policy/TPA card, Doctor Prescription, Clinic Slip, Medical/Lab Report, Property Sale Deed / Registry (Bainama), Khasra-Khatauni (Jamabandi/Fard), Electricity / Water / Gas Utility Bill, Education Degree, Semester Marksheet/DMC, Competition/Innovators Certificate, Voter ID, Birth Certificate, or other family record).
${memberListText}

Extract the following information with maximum accuracy:
1. "docType": One of ['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Vehicle RC', 'Vehicle Insurance', 'Health Insurance', 'Doctor Prescription', 'Medical Lab Report', 'Hospital Discharge Summary', 'Property Sale Deed / Registry', 'Khasra / Khatauni', 'Electricity Bill', 'Water Bill', 'Piped Gas Bill', 'Education Degree', 'Marksheet / DMC', 'Competition Certificate', 'Bank Passbook / Statement', 'Voter ID', 'Birth Certificate', 'Tax Invoice', 'Other']
2. "docNumber": Clean primary ID, roll number, policy number, Khasra number, Consumer CA number, or certificate registration number.
3. "holderName": Full legal name of the candidate/patient/holder/owner (do NOT confuse with father's name, seller, or Doctor/Authority name).
4. "fatherOrSpouseName": Father's or spouse's name if clearly listed, else null.
5. "dob": Date of birth in YYYY-MM-DD format if found, else null.
6. "expiryDate": Expiry or valid-till date or Bill Due Date in YYYY-MM-DD format if applicable, else null.
7. "category": One of ['ID Cards', 'Medical & Health', 'Vehicle', 'Financial', 'Property & Legal', 'Education', 'Personal'].
8. "academicDetails": If this is a Degree, Marksheet/DMC, Diploma, Certificate, or Award:
   - "institution": Name of School, College, University, Board, or Organization (e.g. "Delhi University", "AKTU", "CBSE", "IIT Delhi") or null.
   - "courseOrDegree": Degree or Course (e.g. "BCA", "MCA", "B.Tech", "Class 10", "Class 12") or null.
   - "semesterOrYear": Semester or passing year (e.g. "6th Semester", "2024") or null.
   - "certificateTitle": Specific title of award/certificate (e.g. "Innovators Certificate", "Certificate of Merit", "National Hackathon Winner") or null.
   - "marksOrGrade": CGPA, Marks, or Percentage (e.g. "8.8 CGPA", "85%") or null.
9. "medicalDetails": If this is a Doctor Prescription, Clinic Slip, Diagnostic Lab Report, or Hospital Bill:
   - "doctorName": Full name of doctor (e.g. "Dr. K.K. Sharma") or null.
   - "hospitalOrClinic": Name of Hospital, Clinic, or Lab (e.g. "Apollo Hospital", "Max Healthcare", "AIIMS", "Dr. Lal PathLabs") or null.
   - "diagnosis": Disease, illness, bimari, condition, or reason for visit (e.g. "Viral Fever", "Thyroid Profile", "Knee Pain", "Migraine") or null.
   - "medicines": Comma-separated list of prescribed medicines, dosage, or tests recommended (e.g. "Paracetamol 650mg TDS, Azithromycin 500 OD, Pantocid 40") or null.
   - "consultationDate": Date of consultation or report in YYYY-MM-DD or null.
10. "emergencyDetails": If Health Insurance or Driving License:
   - "bloodGroup": Blood group if printed (e.g. "O+", "B+", "AB+", "A+", "O-", etc.) or null.
   - "tpaProvider": Third Party Administrator (TPA) or insurer name (e.g. "Star Health", "Medi Assist") or null.
   - "policyNumber": Insurance policy or cashless member ID number or null.
   - "tollFreeHelpLine": Hospital cashless claim or 24x7 toll-free emergency helpline phone number or null.
   - "allergies": Critical allergies or chronic conditions or null.
   - "emergencyContactPhone": Emergency contact phone number if listed, else null.
   - "sumInsured": Sum insured amount if visible or null.
11. "propertyDetails": If this is a Property Sale Deed (Bainama / रजिस्ट्री), Land Registry, Khasra-Khatauni, Jamabandi, Fard, or Plot Deed:
   - "propertyType": "Residential Plot", "Agricultural Land / Khet", "Commercial Shop", or "Flat/Apartment".
   - "ownerName": Full legal name of buyer / owner / krayakarta.
   - "sellerName": Full legal name of seller / vendor / vikreta.
   - "khasraNumber": Khasra or survey number (e.g. "452/12").
   - "khatauniNumber": Khatauni or jamabandi number if listed.
   - "plotOrHouseNumber": Plot or flat/house number if listed.
   - "area": Total area / Rakba in Gaj, Sq. Yards, Sq. Ft, Bigha, or Hectares (e.g. "200 Gaj", "1800 Sq. Ft").
   - "locality": Village/Mauza, Tehsil, and District.
   - "registrationDate": Registration date in YYYY-MM-DD if found.
   - "deedNumber": Deed number, Bahi number, or Zild number.
   - "stampDutyOrAmount": Sale consideration amount (Mubligh) or Stamp duty paid.
   - "chauhaddi": Object containing four boundaries:
     - "north": Uttar boundary / road / adjacent owner.
     - "south": Dakshin boundary.
     - "east": Purav boundary.
     - "west": Paschim boundary.
12. "utilityBillDetails": If this is an Electricity, Water, Piped Gas, or Utility Bill:
   - "serviceProvider": Utility provider name (e.g. "UPPCL", "BSES Yamuna", "Tata Power", "Delhi Jal Board", "IGL Gas").
   - "billType": "Electricity Bill", "Water Bill", "Gas Bill", or "Utility Bill".
   - "consumerNumber": Consumer Account (CA) number, K-Number, or service connection ID.
   - "meterNumber": Meter serial number.
   - "billAmount": Total payable amount (e.g. "₹2,450").
   - "billDueDate": Due date in YYYY-MM-DD.
   - "billingCycle": Month or billing period.
   - "registeredName": Name of the registered consumer.
13. "executiveSummary": An array of 2 to 3 concise, highly readable bullet points in clear Hinglish:
   - For Property: Bullet 1: Owner & area. Bullet 2: Khasra No & registration date. Bullet 3: Key boundaries (Chauhaddi: Purav/Uttar).
   - For Utility Bills: Bullet 1: Provider & bill amount. Bullet 2: Consumer CA number. Bullet 3: Due date alert.
   - For other documents: 2 concise takeaways.
14. "summary": A crisp 1 to 2 sentence summary of what this document is, who it is for, and key details.
15. "searchKeywords": Array of 5 to 8 search keywords for fast lookup (e.g. ["khasra 452", "uppcl", "sale deed", "chauhaddi"]).
16. "qualityAssessment": Visual quality assessment of the document image:
   - "isBlurry": boolean (true if image is out of focus, motion-blurred, low resolution, or key text is unreadable).
   - "clarityScore": "GOOD", "FAIR", or "POOR".
   - "issueFeedback": Concise, friendly advice in Hinglish if blurry, dark, cut-off, or glary (e.g. "Photo bohot dhundhli hai aur text saaf nahi dikh raha hai. Behtar results ke liye achhi roshni me dobara click karein"), else null.

COMPACT INFERENCE DIRECTIVE:
Only include sub-objects (e.g. propertyDetails, utilityBillDetails, medicalDetails, academicDetails, emergencyDetails) that match this detected document. Omit or set irrelevant sub-objects to null to keep the JSON concise and fast.

Return ONLY a valid JSON object matching these keys. Do NOT wrap in markdown code blocks.`;

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

    // Sequential Fast Fallback: Try gemini-flash-lite-latest first (fastest, high quota).
    // If unavailable or rate-limited, fall back to gemini-3.5-flash-lite.
    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ];

    let result = null;
    let successfulModel = null;

    for (const modelName of modelsToTry) {
      try {
        const t0 = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(18000),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText && rawText.trim()) {
            console.log(`[AI Scanner] ⚡ Flash-Lite SUCCESS: ${modelName} in ${Date.now() - t0}ms!`);
            result = data;
            successfulModel = modelName;
            break; // Stop immediately upon success - saves quota!
          }
        } else {
          console.warn(`[AI Scanner] ${modelName} returned status ${response.status}`);
        }
      } catch (callErr) {
        console.warn(`[AI Scanner] ${modelName} attempt error:`, callErr.message);
      }
    }

    if (!result) return null;

    const rawJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) return null;

    const cleanedText = rawJsonText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsedData = JSON.parse(cleanedText);

    // Intelligent Category Normalization across all document types
    let category = 'Other';
    const lowerDocType = (parsedData.docType || '').toLowerCase();
    const lowerRawCat = (parsedData.category || '').toLowerCase();

    if (
      /insurance|mediclaim|health|prescription|doctor|hospital|clinic|tpa|ayushman|medical|lab report/i.test(lowerDocType) ||
      /medical|health/i.test(lowerRawCat)
    ) {
      category = 'Medical & Health';
    } else if (
      /aadhaar|pan card|voter|epic|passport|driving license|license|voter id|ration|id card/i.test(lowerDocType) ||
      /id card|identity/i.test(lowerRawCat)
    ) {
      category = 'ID Cards';
    } else if (
      /deed|registry|khasra|khatauni|bainama|property|fard|jamabandi|electricity|bijli|water bill|gas bill|utility|bill/i.test(lowerDocType) ||
      /property|bank|financial|bill/i.test(lowerRawCat)
    ) {
      category = 'Bank & Property';
    } else if (
      /marksheet|degree|diploma|certificate|dmc|semester|school|college|university/i.test(lowerDocType) ||
      /education|academic/i.test(lowerRawCat)
    ) {
      category = 'Education';
    } else if (
      /affidavit|agreement|stamp paper|court|legal|will/i.test(lowerDocType) ||
      /legal/i.test(lowerRawCat)
    ) {
      category = 'Legal';
    } else if (
      /rc|vehicle|pollution|puc|chassis/i.test(lowerDocType) ||
      /vehicle/i.test(lowerRawCat)
    ) {
      category = 'Other';
    } else if (parsedData.category && ['ID Cards', 'Medical & Health', 'Bank & Property', 'Education', 'Legal', 'Other'].includes(parsedData.category)) {
      category = parsedData.category;
    } else {
      category = 'ID Cards';
    }

    // Auto-match with family members
    const matched = findBestMemberMatch(parsedData.holderName, familyMembers);

    const smartTitle = generateSmartDocumentTitle({
      docType: parsedData.docType,
      holderName: parsedData.holderName,
      matchedMemberName: matched?.memberName,
      docNumber: parsedData.docNumber,
      emergencyDetails: parsedData.emergencyDetails,
      academicDetails: parsedData.academicDetails,
      medicalDetails: parsedData.medicalDetails,
      propertyDetails: parsedData.propertyDetails,
      utilityBillDetails: parsedData.utilityBillDetails,
      category,
      originalFileName: fileName,
    });

    return {
      docType: parsedData.docType || 'Other',
      category,
      docNumber: parsedData.docNumber || '',
      holderName: parsedData.holderName || '',
      fatherOrSpouseName: parsedData.fatherOrSpouseName || null,
      dob: parsedData.dob || null,
      expiryDate: parsedData.expiryDate || null,
      suggestedTitle: smartTitle,
      emergencyDetails: parsedData.emergencyDetails || null,
      academicDetails: parsedData.academicDetails || null,
      medicalDetails: parsedData.medicalDetails || null,
      propertyDetails: parsedData.propertyDetails || null,
      utilityBillDetails: parsedData.utilityBillDetails || null,
      executiveSummary: Array.isArray(parsedData.executiveSummary) ? parsedData.executiveSummary : (parsedData.summary ? [parsedData.summary] : []),
      summary: parsedData.summary || null,
      searchKeywords: Array.isArray(parsedData.searchKeywords) ? parsedData.searchKeywords : [],
      matchedMemberId: matched?.memberId || null,
      matchedMemberName: matched?.memberName || '',
      confidence: matched ? 0.95 : 0.9,
      qualityAssessment: parsedData.qualityAssessment || {
        isBlurry: false,
        clarityScore: 'GOOD',
        issueFeedback: null,
      },
      aiEngine: successfulModel ? `gemini_cloud (${successfulModel})` : 'gemini_cloud',
    };
  } catch (error) {
    console.warn('[AI Scanner Gemini Execution Error]:', error.message);
    return null;
  }
}
