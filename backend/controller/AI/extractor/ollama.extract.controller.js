import { Ollama } from "ollama";



// Reusable Ollama client to avoid creating it on every request
const ollamaClient = new Ollama({
  host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11439",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
});

const LLMTextExtractor = async(text, formatJson) => {
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



const LLMImageExtractor =  async (imagePath) => {

  const messages = [
    {
      role: "system",
      content: "You are an assistant in a garment factory. Your task is to analyze customer-provided images, classify them correctly, and extract relevant information.\n\nIMPORTANT RULES:\n1. If the image contains a readable or partially readable table (rows and columns), you MUST classify it as 'table' and extract the table data.\n2. If the image contains a stamp, seal, or official marking (e.g., approval stamp, inspection stamp, company seal) and does NOT contain a table, classify it as 'stamp' and describe the stamp content.\n3. Use 'sample' ONLY if the image shows a garment or product (e.g., T-shirt, clothing) and does NOT contain any table or stamp.\n4. Use 'unknown' ONLY if the image content cannot be determined.\n5. Never classify an image as 'sample' if any table or stamp is visible.\n6. When the type is not 'table', the table field must be an empty array.\n\nFollow the provided output format exactly."
    },
    {
      role: "user",
      content: "Analyze the image and extract the required data according to the rules.",
      images: [
        imagePath
      ]
    }
  ];
  const format =  {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "table",
          "sample",
          "stamp",
          "unknown"
        ],
        description: "Classify the image. If a readable table is present, ALWAYS choose 'table'. Use 'sample' ONLY for garment or product images with no table. Use 'unknown' if the content cannot be determined."
      },
      description: {
        type: "string",
        description: "Brief description of the image. If type is 'table', describe the table content. Otherwise, describe what is visible or why it is unknown."
      },
      table: {
        type: "array",
        description: "Extracted table data. MUST contain rows and cells ONLY when type is 'table'. MUST be an empty array when type is 'sample' or 'unknown'.",
        items: {
          type: "array",
          description: "A single table row.",
          items: {
            type: "string",
            description: "Cell content."
          }
        }
      }
    },
    required: [
      "type",
      "description",
      "table"
    ]
  };

  try {
    const response = await ollamaClient.chat({
      model: "devstral-small-2:latest",
      messages,
      format,
      stream: false,
      thinking: true,
      keep_alive: "10m",
      options: {
        temperature: 0
      }
    });
    // console.log("Model response", JSON.stringify(response.message.content, null, 2))
    return JSON.parse(response.message.content);
  } catch (err) {
    console.error(JSON.stringify(err, null, 2));
    throw err;
  }
}

export {LLMTextExtractor, LLMImageExtractor};