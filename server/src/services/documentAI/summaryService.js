/**
 * Contextual Hinglish Summary Service
 * Generates readable, human-friendly 2-3 bullet point summaries based on document category
 */

export function generateHinglishSummary(extracted = {}) {
  const docType = extracted.docType || 'Document';
  const holder = extracted.holderName || extracted.patientName || extracted.ownerOrBuyerName || extracted.studentName || 'Family Member';
  const bullets = [];

  const cat = (extracted.category || '').toLowerCase();

  const isUtility = extracted.utilityBillDetails || /bill/i.test(docType) || /electricity|water|gas|bijli/i.test(docType);
  const isProperty = !isUtility && (extracted.propertyDetails || /deed|registry|khasra|khatauni|bainama|jamabandi|plot/i.test(docType));

  // 1. Utility Bills (checked before property to avoid Bank & Property category overlap)
  if (isUtility) {
    const u = extracted.utilityBillDetails || extracted;
    bullets.push(`${u.serviceProvider || 'Utility Board'} ${u.billType || 'Bill'}${u.billAmount ? `: ${u.billAmount}` : ''}`);
    if (u.consumerNumber) bullets.push(`Consumer CA No: ${u.consumerNumber}`);
    if (u.billDueDate) bullets.push(`Due Date (Antim Tithi): ${u.billDueDate}`);
  }
  // 2. Property Documents
  else if (isProperty) {
    const p = extracted.propertyDetails || extracted;
    const area = p.area ? ` (${p.area})` : '';
    bullets.push(`Property ${p.ownerOrBuyerName || holder} ke naam par registered hai${area}.`);
    
    const kList = [
      p.khasraNumber && `Khasra No. ${p.khasraNumber}`,
      p.plotOrHouseNumber && `Plot/House No. ${p.plotOrHouseNumber}`,
      p.registrationDate && `Date: ${p.registrationDate}`,
    ].filter(Boolean);
    if (kList.length > 0) bullets.push(`Record: ${kList.join(' • ')}`);

    if (p.chauhaddi) {
      const c = p.chauhaddi;
      const bText = [c.north && `Uttar: ${c.north}`, c.east && `Purav: ${c.east}`, c.south && `Dakshin: ${c.south}`, c.west && `Paschim: ${c.west}`].filter(Boolean).join(', ');
      if (bText) bullets.push(`Chauhaddi: ${bText}`);
    }
  }
  // 3. Medical Documents
  else if (cat.includes('medical') || cat.includes('health') || /prescription|discharge|lab report/i.test(docType)) {
    const m = extracted.medicalDetails || extracted;
    const place = m.hospitalOrClinic || m.doctorName ? ` (${[m.doctorName, m.hospitalOrClinic].filter(Boolean).join(' • ')})` : '';
    bullets.push(`Patient: ${holder}${place}`);
    if (m.diagnosis) bullets.push(`Diagnosis / Bimari: ${m.diagnosis}`);
    if (Array.isArray(m.medicines) && m.medicines.length > 0) {
      const medNames = m.medicines.map(med => typeof med === 'string' ? med : med.name).slice(0, 3).join(', ');
      bullets.push(`Prescribed: ${medNames}`);
    }
  }
  // 4. Education Credentials
  else if (cat.includes('education') || /degree|marksheet|diploma/i.test(docType)) {
    const e = extracted.academicDetails || extracted;
    bullets.push(`Candidate: ${holder} — ${e.courseOrDegree || docType}`);
    if (e.institution || e.universityOrBoard) bullets.push(`Institute: ${e.institution || e.universityOrBoard}`);
    const score = e.percentage ? `${e.percentage}%` : (e.cgpa ? `${e.cgpa} CGPA` : null);
    if (score || e.passingYear) bullets.push(`Result: ${[score, e.passingYear && `Year: ${e.passingYear}`].filter(Boolean).join(' • ')}`);
  }
  // 5. Identity Documents
  else {
    bullets.push(`${docType} for ${holder}`);
    if (extracted.docNumber) bullets.push(`ID Number: ${extracted.docNumber}`);
    if (extracted.dob) bullets.push(`Date of Birth: ${extracted.dob}`);
    if (extracted.expiryDate) bullets.push(`Valid Till: ${extracted.expiryDate}`);
  }

  const oneLiner = bullets.join(' ');
  return {
    executiveSummary: bullets.slice(0, 3),
    summary: oneLiner,
  };
}
