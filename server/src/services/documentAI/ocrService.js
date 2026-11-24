import { createWorker } from 'tesseract.js';

let sharedWorker = null;
let isInitializingWorker = false;

/**
 * Get or initialize a singleton Tesseract OCR worker with English + Hindi support
 */
async function getOcrWorker() {
  if (sharedWorker) return sharedWorker;
  if (isInitializingWorker) {
    // Wait for ongoing initialization
    while (isInitializingWorker) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (sharedWorker) return sharedWorker;
  }

  isInitializingWorker = true;
  try {
    // 12-second safety timeout on worker initialization
    const initPromise = createWorker(['eng', 'hin'], 1, {
      errorHandler: (err) => console.warn('[Tesseract Worker Warning]:', err?.message || err),
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Tesseract init timeout')), 12000));
    const worker = await Promise.race([initPromise, timeoutPromise]);

    sharedWorker = worker;
    console.log('[OCR Service] Tesseract OCR initialized with English + Hindi Devanagari models.');
    return sharedWorker;
  } catch (err) {
    console.warn('[OCR Service] Failed to initialize Hindi+English worker, falling back to English only:', err.message);
    try {
      const fallbackPromise = createWorker('eng');
      const fallbackTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Tesseract eng fallback timeout')), 8000));
      const fallbackWorker = await Promise.race([fallbackPromise, fallbackTimeout]);
      sharedWorker = fallbackWorker;
      return sharedWorker;
    } catch (fallbackErr) {
      console.error('[OCR Service Fatal] Could not initialize any Tesseract worker:', fallbackErr.message);
      return null;
    }
  } finally {
    isInitializingWorker = false;
  }
}

/**
 * Perform Optical Character Recognition on an image buffer
 * Supports mixed English and Hindi (Devanagari) documents
 * Returns text, confidence, words, and bounding lines
 */
export async function extractTextWithOcr(imageBuffer, options = {}) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    return { text: '', confidence: 0, lines: [], words: [], evidence: [] };
  }

  const t0 = Date.now();
  try {
    const worker = await getOcrWorker();
    if (!worker) {
      return { text: '', confidence: 0, lines: [], words: [], evidence: [], ocrEngine: 'unavailable' };
    }

    const result = await worker.recognize(imageBuffer);
    const data = result?.data || {};

    const rawText = (data.text || '').trim();
    const overallConfidence = typeof data.confidence === 'number' ? Math.round(data.confidence) / 100 : 0.8;

    // Build evidence items from lines with confidence
    const lines = (data.lines || []).map(line => ({
      text: line.text?.trim() || '',
      confidence: Math.round(line.confidence || 0) / 100,
      bbox: line.bbox || null,
    })).filter(l => l.text.length > 0);

    const words = (data.words || []).map(word => ({
      text: word.text?.trim() || '',
      confidence: Math.round(word.confidence || 0) / 100,
    })).filter(w => w.text.length > 0);

    const elapsedMs = Date.now() - t0;
    console.log(`[OCR Service] OCR completed in ${elapsedMs}ms. Extracted ${rawText.length} chars with ${Math.round(overallConfidence * 100)}% avg confidence.`);

    return {
      text: rawText,
      confidence: overallConfidence,
      lines,
      words,
      ocrEngine: 'tesseract_node (eng+hin)',
      elapsedMs,
    };
  } catch (ocrErr) {
    console.warn('[OCR Service] Extraction error:', ocrErr.message);
    return {
      text: '',
      confidence: 0,
      lines: [],
      words: [],
      error: ocrErr.message,
      ocrEngine: 'error_fallback',
    };
  }
}

/**
 * Gracefully terminate the singleton OCR worker during shutdown
 */
export async function terminateOcrWorker() {
  if (sharedWorker) {
    try {
      await sharedWorker.terminate();
      sharedWorker = null;
      console.log('[OCR Service] Tesseract worker terminated cleanly.');
    } catch (e) {}
  }
}
