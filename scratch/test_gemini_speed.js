import fs from 'fs';
const envFile = fs.readFileSync('server/.env', 'utf8');
let apiKey = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  }
}
console.log('API Key present?', !!apiKey, 'length:', apiKey.length);

async function testModel(modelName) {
  const t0 = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"answer": "Namaste"}' }] }]
      }),
      signal: AbortSignal.timeout(12000)
    });
    const elapsed = Date.now() - t0;
    const data = await res.json();
    console.log(`[${modelName}] Status: ${res.status}, Time: ${elapsed}ms`);
    if (res.status !== 200) {
      console.log(`[${modelName}] Error:`, JSON.stringify(data.error?.message || data));
    } else {
      console.log(`[${modelName}] Reply:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  } catch (e) {
    console.log(`[${modelName}] Caught:`, e.name, e.message, `Time: ${Date.now() - t0}ms`);
  }
}

async function run() {
  await testModel('gemini-3.8-flash');
  await testModel('gemini-3.5-flash');
  await testModel('gemini-flash-latest');
}

run();
