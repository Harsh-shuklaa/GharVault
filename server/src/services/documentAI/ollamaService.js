/**
 * Local Ollama Multi-Model Inference Service
 * 100% Free, Private, Offline AI for Indian Document Intelligence
 * 
 * Configurable Models:
 * - Vision / Quality: moondream, llava, qwen2.5-coder
 * - Text / Classification / Extraction: qwen2.5:3b, qwen2.5:7b
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const DEFAULT_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'moondream';
const DEFAULT_TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'qwen2.5:3b';

let cachedStatus = null;
let lastCheckTime = 0;

/**
 * Health check to verify Ollama status and retrieve installed models
 * Caches status (online or offline) for 20 seconds to prevent repeated network delays
 */
export async function getOllamaStatus(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedStatus && now - lastCheckTime < 20000) {
    return cachedStatus;
  }

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(1000),
    });

    if (!res.ok) {
      cachedStatus = { isRunning: false, models: [], error: `Ollama returned status ${res.status}`, baseUrl: OLLAMA_BASE_URL };
      lastCheckTime = now;
      return cachedStatus;
    }

    const data = await res.json();
    const models = (data.models || []).map(m => m.name);
    cachedStatus = {
      isRunning: true,
      models,
      baseUrl: OLLAMA_BASE_URL,
      hasTextModel: models.some(m => m.includes('qwen') || m.includes('llama') || m.includes('gemma') || m.includes('mistral')),
      hasVisionModel: models.some(m => m.includes('moondream') || m.includes('llava') || m.includes('vl')),
    };
    lastCheckTime = now;
    return cachedStatus;
  } catch (err) {
    cachedStatus = {
      isRunning: false,
      models: [],
      error: err.message,
      baseUrl: OLLAMA_BASE_URL,
      hasTextModel: false,
      hasVisionModel: false,
    };
    lastCheckTime = now;
    return cachedStatus;
  }
}

/**
 * Pick the best available local model for the given task
 */
export function selectBestOllamaModel(models = [], taskType = 'text') {
  if (!models || models.length === 0) return null;

  if (taskType === 'vision') {
    return (
      models.find(m => m.includes(DEFAULT_VISION_MODEL)) ||
      models.find(m => m.includes('moondream')) ||
      models.find(m => m.includes('llava')) ||
      models.find(m => m.includes('vl')) ||
      models[0]
    );
  }

  // Text extraction & classification
  return (
    models.find(m => m.includes(DEFAULT_TEXT_MODEL)) ||
    models.find(m => m.includes('qwen2.5:3b')) ||
    models.find(m => m.includes('qwen2.5:7b')) ||
    models.find(m => m.includes('qwen2.5')) ||
    models.find(m => m.includes('llama3')) ||
    models[0]
  );
}

/**
 * Run structured JSON inference using Local Ollama
 */
export async function queryOllamaJSON({
  prompt = '',
  taskType = 'text',
  imageBase64 = null,
  timeoutMs = 60000,
  temperature = 0.1,
}) {
  const status = await getOllamaStatus();
  if (!status.isRunning || status.models.length === 0) {
    return { success: false, error: 'OLLAMA_OFFLINE', message: 'Local Ollama service is not running or no models installed' };
  }

  const modelName = selectBestOllamaModel(status.models, taskType);
  if (!modelName) {
    return { success: false, error: 'MODEL_NOT_FOUND', message: 'No suitable local model found for ' + taskType };
  }

  const body = {
    model: modelName,
    prompt,
    stream: false,
    format: 'json',
    keep_alive: '1h',
    options: {
      temperature,
      top_p: 0.9,
      num_predict: 250,
    },
  };

  if (imageBase64 && taskType === 'vision') {
    body.images = [imageBase64];
  }

  try {
    const t0 = Date.now();
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP_${res.status}`, message: `Ollama returned ${res.status}` };
    }

    const data = await res.json();
    const rawOutput = (data.response || '').trim();
    if (!rawOutput) {
      return { success: false, error: 'EMPTY_RESPONSE', message: 'Ollama returned empty response' };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (parseErr) {
      const match = rawOutput.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'INVALID_JSON', message: 'Could not parse structured JSON from Ollama output' };
    }

    const elapsedMs = Date.now() - t0;
    return {
      success: true,
      data: parsed,
      model: modelName,
      elapsedMs,
    };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'TimeoutError' ? 'TIMEOUT' : 'REQUEST_FAILED',
      message: err.message,
    };
  }
}
