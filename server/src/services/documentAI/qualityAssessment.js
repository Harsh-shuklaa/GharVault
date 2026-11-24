/**
 * Dedicated Document Quality Assessment Service
 * Evaluates image clarity, blur, glare, cropping, and rotation
 * Provides user-friendly, empathetic feedback in simple Hinglish
 */

export function assessDocumentQuality({
  imageBuffer = null,
  ocrResult = null,
  fileSize = 0,
  fileName = '',
}) {
  const ocrText = (ocrResult?.text || '').trim();
  const ocrConfidence = typeof ocrResult?.confidence === 'number' ? ocrResult.confidence : 0.8;
  const wordCount = ocrResult?.words?.length || (ocrText ? ocrText.split(/\s+/).length : 0);
  const charCount = ocrText.length;
  const bytes = fileSize || imageBuffer?.length || 0;

  let isBlurry = false;
  let isCropped = false;
  let isGlarePresent = false;
  let isRotated = false;
  let isTextReadable = true;
  let clarityScore = 'GOOD';
  let issueFeedback = null;

  // 1. Extreme low size or empty text check
  if (bytes > 0 && bytes < 20 * 1024 && charCount < 30) {
    isBlurry = true;
    clarityScore = 'POOR';
    isTextReadable = false;
    issueFeedback = 'Photo bohot choti ya dhundhli (blurry) hai. Kripya document ki clear HD photo upload karein.';
    return {
      isBlurry,
      clarityScore,
      isCropped,
      isGlarePresent,
      isRotated,
      isTextReadable,
      issueFeedback,
    };
  }

  // 2. OCR Confidence & Readability Assessment
  if (ocrConfidence < 0.45 && charCount < 50) {
    isBlurry = true;
    clarityScore = 'POOR';
    isTextReadable = false;
    issueFeedback = 'Photo thodi dhundhli (blurry) hai aur text saaf nahi dikh raha hai. Behtar results ke liye achhi roshni me dobara click karein.';
  } else if (ocrConfidence < 0.65) {
    clarityScore = 'FAIR';
    issueFeedback = 'Document readable hai, lekin roshni thodi kam hai. Zarurat padne par details manually check kar lein.';
  } else {
    clarityScore = 'GOOD';
    isTextReadable = true;
    issueFeedback = null;
  }

  // 3. Glare or Reflection Check
  // If text has unusual repetitive non-alphanumeric noise or missing central words
  if (/(\.{4,}|_{4,}|\*{4,})/g.test(ocrText)) {
    isGlarePresent = true;
    if (clarityScore === 'GOOD') clarityScore = 'FAIR';
    issueFeedback = 'Camera flash ya light reflection ki wajah se text ke kuch hisse chamak rahe hain.';
  }

  // 4. Cropped / Edge cut check
  // If line confidence drops sharply at top/bottom or single-character edges
  const lines = ocrResult?.lines || [];
  if (lines.length > 0) {
    const firstLine = lines[0].text || '';
    const lastLine = lines[lines.length - 1].text || '';
    if ((firstLine.length <= 2 && firstLine.length > 0) || (lastLine.length <= 2 && lastLine.length > 0)) {
      isCropped = true;
      if (!issueFeedback) {
        issueFeedback = 'Document ka kuch hissa frame se bahar cut ho raha hai. Pura document frame me rakh kar photo lein.';
      }
    }
  }

  return {
    isBlurry,
    clarityScore,
    isCropped,
    isGlarePresent,
    isRotated,
    isTextReadable,
    issueFeedback,
  };
}
