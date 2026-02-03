import { Ollama } from "ollama";
import sharp from "sharp";

// Reusable Ollama client
const ollamaClient = new Ollama({
  host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11439",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  }
});

/**
 * Helper to handle Ollama requests with capability check, fallback models, and custom timeouts
 */
const ollamaChatWithRetry = async (payload, fallbacks = [], timeoutMs = 300000, requiredCapability = null) => {
  let availableModels = [];
  let listFetchSuccessful = false;
  try {
    const listResponse = await ollamaClient.list();
    availableModels = listResponse.models || [];
    listFetchSuccessful = true;
  } catch (e) {
    if (global.logger) global.logger.warn("Could not fetch available models from Ollama, using fallback list blindly.");
  }

  const models = [payload.model, ...fallbacks].filter(Boolean);
  let lastError = null;

  for (const modelName of models) {
    // 1. Existence & Capability Check
    if (listFetchSuccessful) {
      const normalizedName = modelName.includes(':') ? modelName : `${modelName}:latest`;
      const modelInfo = availableModels.find(m => {
        const mName = m.name || m.model || "";
        const mNormalized = mName.includes(':') ? mName : `${mName}:latest`;
        return mNormalized === normalizedName;
      });

      if (!modelInfo) {
        if (global.logger) global.logger.debug(`Skipping ${modelName}: not installed on Ollama server.`);
        continue;
      }

      if (requiredCapability) {
        try {
          const details = await ollamaClient.show({ model: modelName });
          const capabilities = details.capabilities || "";

          if (requiredCapability === 'vision' && !capabilities.includes('vision')) {
            if (global.logger) global.logger.debug(`Skipping ${modelName}: no vision capability detected in modelfile.`);
            continue;
          }
        } catch (showErr) {
          if (global.logger) global.logger.debug(`Could not verify capability for ${modelName}, proceeding to try chat anyway.`);
        }
      }
    }

    try {
      if (global.logger) global.logger.info(`Attempting extraction with model: ${modelName}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await ollamaClient.chat({
        ...payload,
        model: modelName,
        options: {
          ...payload.options,
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      lastError = err;
      const isTimeout = err.name === 'AbortError' || err.code === 'UND_ERR_HEADERS_TIMEOUT' || err.message.includes('timeout');
      const isNotFound = err.status_code === 404 || err.message.includes('not found');

      if (global.logger) {
        global.logger.warn(`Model ${modelName} failed. Error: ${err.message}. ${isTimeout ? 'Request timed out.' : ''}`);
      }

      if (err.code === 'ECONNREFUSED' || (err.cause && err.cause.code === 'ECONNREFUSED')) {
        throw err;
      }

      // If model not found, we definitely want to jump to the next one
      if (isNotFound) {
        continue;
      }

      continue;
    }
  }
  throw lastError || new Error("No suitable or installed models found in the priority/fallback list.");
};

const LLMTextExtractor = async (text, formatJson) => {
  const primaryModel = process.env.OLLAMA_TEXT_PRIMARY ?? "gpt-oss:20b";
  const fallbacks = (process.env.OLLAMA_TEXT_FALLBACKS ?? "llama3:latest,mistral:latest").split(",");

  try {
    const response = await ollamaChatWithRetry({
      model: primaryModel,
      messages: [
        { role: "system", content: `You're an assistant. Extract the fields from the provided text:\n${text}` },
        { role: "user", content: "Please extract for me." }
      ],
      format: formatJson,
      options: {
        temperature: 0
      }
    }, fallbacks);

    const jsonResponse = JSON.parse(response.message.content);
    return jsonResponse;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || (err.cause && err.cause.code === 'ECONNREFUSED')) {
      const errorMsg = `Ollama service unreachable. Please ensure Ollama is running at ${ollamaClient.config.host}`;
      if (global.logger) global.logger.error("Text Extraction Connection Error:", errorMsg);
      throw new Error(errorMsg);
    }
    if (global.logger) global.logger.error("All text extraction models failed", err);
    throw err;
  }
}



const LLMImageExtractor = async (imagePath, schema = null, systemPrompt = null) => {
  const primaryModel = process.env.OLLAMA_VLM_PRIMARY ?? "devstral-small-2:latest";
  const fallbacks = (process.env.OLLAMA_VLM_FALLBACKS ?? "llama3.2-vision:latest,moondream:latest").split(",");

  const efficientPrompt = systemPrompt || "You are an expert AI assistant. Analyze the provided image and extract the data exactly according to the JSON schema.";

  let optimizedImage = imagePath;
  try {
    const buffer = Buffer.from(imagePath, 'base64');
    const resizedBuffer = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    optimizedImage = resizedBuffer.toString('base64');
  } catch (optError) {
    if (global.logger) global.logger.warn("Image optimization failed, using original:", optError.message);
  }

  const format = schema || { type: "object", additionalProperties: true };

  try {
    const response = await ollamaChatWithRetry({
      model: primaryModel,
      messages: [
        { role: "system", content: efficientPrompt },
        {
          role: "user",
          content: "Analyze this image and extract the data.",
          images: [optimizedImage]
        }
      ],
      format,
      keep_alive: "30m",
      options: {
        temperature: 0,
        num_thread: 8,
        num_predict: 2048
      }
    }, fallbacks, 600000, 'vision'); // Pass 'vision' as required capability

    return JSON.parse(response.message.content);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || (err.cause && err.cause.code === 'ECONNREFUSED')) {
      const errorMsg = `Ollama service unreachable. Please ensure Ollama is running at ${ollamaClient.config.host}`;
      if (global.logger) global.logger.error("VLM Extraction Connection Error:", errorMsg);
      throw new Error(errorMsg);
    }

    if (global.logger) global.logger.error("All VLM extraction models failed", err);
    throw err;
  }
}

export { LLMTextExtractor, LLMImageExtractor };