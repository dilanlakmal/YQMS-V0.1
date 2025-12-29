import { Ollama } from "ollama";
import { object, z } from 'zod';


// Reusable Ollama client to avoid creating it on every request
const ollamaClient = new Ollama({
  host:  "http://localhost:11439",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
});

const LLMTextExtractor = async(text, formatJson, formatSchema) => {
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


const imageFormat = {
  type: "object",
  properties: {
    path: {
      type: "string",
      description: "The image path"
    },
    description: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The image path"
          },
          content: {
            type: "string"
          }
        },
        required: ["path", "content"] // ✅ correct position
      }
    },
    objects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string"
          },
          value: {
            type: "string"
          }
        },
        required: ["name", "value"]
      }
    }
  },
  required: ["path", "description", "objects"]
};

const imageSchema = z.object({
  path: z.string(),
  description: z.array(
    z.object({
      path: z.string(),
      content: z.string()
    })
  ),
  objects: z.array(z.object({name: z.string(), value: z.string()}))
});

const LLMImageExtractor =  async (imagePath) => {
  try {
    const response = await ollamaClient.chat({
      model: "devstral-small-2:latest",
      messages: [
        { role: 'user', content: 'Describe this photo', images: imagePath }
      ],
      stream: false,
      keep_alive: "1h",
      options: {
        temperature: 0
      },
      // format: imageFormat
    });
    // console.log("Model response", JSON.stringify(response.message.content, null, 2))
    // return imageSchema.parse(JSON.parse(response.message.content));
    return response.message.content
  } catch (err) {
    console.error(JSON.stringify(err, null, 2));
    throw err;
  }
}

export {LLMTextExtractor, LLMImageExtractor};