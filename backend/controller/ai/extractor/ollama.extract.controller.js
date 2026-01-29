import { Ollama } from "ollama";



// Reusable Ollama client to avoid creating it on every request
const ollamaClient = new Ollama({
  host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11439",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
});

const LLMTextExtractor = async (text, formatJson) => {
  try {
    const response = await ollamaClient.chat({
      model: "gpt-oss:20b",
      messages: [
        { role: "system", content: `You're an assistant. Extract the fields from the provided text:\n${text}` },
        { role: "user", content: "Please extract for me." }
      ],
      format: formatJson,
      options: {
        temperature: 0
      }
    });
    const jsonResponse = JSON.parse(response.message.content);
    console.log(JSON.stringify(jsonResponse, null, 2));
    return jsonResponse;
  } catch (err) {
    console.log("Error extraction process", err)
    throw err
  }

}



const LLMImageExtractor = async (imagePath, schema = null, systemPrompt = null) => {
  // Default system prompt if none provided
  const efficientPrompt = systemPrompt || "You are an expert AI assistant. Analyze the provided image and extract the data exactly according to the JSON schema.";

  const messages = [
    {
      role: "system",
      content: efficientPrompt
    },
    {
      role: "user",
      content: "Analyze this image and extract the data.",
      images: [
        imagePath
      ]
    }
  ];

  // If no schema provided, use a default loose schema or null (depending on model support)
  // But for our use case, we will always provide the schema from Instruction.getDynamicSchema()
  const format = schema || { type: "object", additionalProperties: true };

  try {
    const response = await ollamaClient.chat({
      model: "devstral-small-2:latest", // Ensure this model supports VLM (e.g. LLaVA based)
      messages,
      format,
      stream: false,
      thinking: true,
      keep_alive: "10m",
      options: {
        temperature: 0
      }
    });
    return JSON.parse(response.message.content);
  } catch (err) {
    logger.error("VLM Extraction Error:", err);
    throw err;
  }
}

export { LLMTextExtractor, LLMImageExtractor };