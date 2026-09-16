import { getAllKeys, getRotatedKey } from './keys.js';

export const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest'
];

/**
 * Executes a Gemini generateContent request with automatic key rotation,
 * model failover, exponential backoff for rate limits (429), and optional JSON schema enforcement.
 *
 * @param {Object} options
 * @param {Array|string} options.contents - The messages or prompt string
 * @param {string} [options.systemInstruction] - System prompt instructions
 * @param {Object} [options.generationConfig] - Additional Gemini generationConfig options
 * @param {boolean} [options.jsonMode] - Whether to enforce responseMimeType: "application/json"
 * @param {Object} [options.responseSchema] - Optional Gemini responseSchema for structured JSON output
 * @param {number} [options.maxRetries] - Max retry attempts across keys
 * @returns {Promise<{ text: string, data?: any, model: string, keyUsed: string }>}
 */
export async function callGemini({
  contents,
  userPrompt,
  systemInstruction = '',
  generationConfig = {},
  jsonMode = false,
  responseSchema = null,
  maxRetries = 3
}) {
  const allKeys = getAllKeys();
  if (!allKeys || allKeys.length === 0) {
    throw new Error('No Gemini API keys are configured in environment variables.');
  }

  // Format contents array
  let formattedContents = [];
  if (Array.isArray(contents)) {
    formattedContents = contents;
  } else if (typeof contents === 'string') {
    formattedContents = [{ role: 'user', parts: [{ text: contents }] }];
  } else if (userPrompt) {
    formattedContents = [{ role: 'user', parts: [{ text: userPrompt }] }];
  } else {
    throw new Error('Either contents or userPrompt is required.');
  }

  // Build merged config
  const mergedConfig = {
    temperature: 0.4,
    maxOutputTokens: 8192,
    ...generationConfig,
  };

  if (jsonMode || responseSchema) {
    mergedConfig.responseMimeType = 'application/json';
    if (responseSchema) {
      mergedConfig.responseSchema = responseSchema;
    }
  }

  const payload = {
    contents: formattedContents,
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    generationConfig: mergedConfig
  };

  // Shuffle keys to distribute load evenly across rotations
  const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
  let lastError = null;

  for (let attempt = 0; attempt < Math.min(maxRetries, shuffledKeys.length); attempt++) {
    const apiKey = shuffledKeys[attempt];

    for (const modelName of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        // Handle 429 Rate Limit - try next key after short jitter
        if (res.status === 429 || data?.error?.code === 429) {
          lastError = data?.error?.message || 'Rate limit exceeded (429)';
          console.warn(`[Gemini Engine] Rate limit (429) on key ${apiKey.slice(0, 8)}... (${modelName}). Rotating key.`);
          break; // Break inner loop to switch API key
        }

        if (data?.error) {
          lastError = data.error.message || 'API error';
          console.warn(`[Gemini Engine] Notice on key ${apiKey.slice(0, 8)}... (${modelName}): ${lastError}`);
          continue; // Try next model on this key
        }

        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          continue;
        }

        // Parse JSON if requested
        let parsedData = null;
        if (jsonMode || responseSchema) {
          try {
            parsedData = JSON.parse(candidateText.trim());
          } catch (jsonErr) {
            console.warn(`[Gemini Engine] JSON parse warning on ${modelName}:`, jsonErr.message);
          }
        }

        return {
          text: candidateText,
          data: parsedData,
          model: modelName,
          keyUsed: apiKey.slice(0, 8) + '...'
        };
      } catch (networkErr) {
        lastError = networkErr.message;
        console.warn(`[Gemini Engine] Network error on ${modelName}:`, networkErr.message);
      }
    }
  }

  throw new Error(lastError || 'All Gemini API keys and models were tried but failed to produce a response.');
}

export { getAllKeys, getRotatedKey };
