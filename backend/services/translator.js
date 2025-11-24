import { GoogleGenerativeAI } from "@google/generative-ai";

const fileToGenerativePart = async (fileBuffer, mimeType) => {
  // Convert buffer to base64
  const base64Data = fileBuffer.toString('base64');
  
  return {
    inlineData: { 
      data: base64Data, 
      mimeType: mimeType 
    },
  };
};

export const translateSpecSheetWithGemini = async (fileBuffer, mimeType) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const imagePart = await fileToGenerativePart(fileBuffer, mimeType);

  const prompt = `
    You are an expert translator specializing in technical documents for the apparel manufacturing industry. Analyze this image of a technical specification sheet.

    Translate all Chinese text into precise, industry-standard English.

    Reconstruct the entire document into a single, well-formatted text block. Retain all original English text and integrate your translations seamlessly.

    Use spacing, indentation, and line breaks to preserve the original layout and table-like structures.

    Do not use Markdown syntax like '###' or '*'. Use simple text formatting. For tables, use spaces to align columns. The goal is to create a plain text representation that visually mimics the original document's structure.

    Focus on technical accuracy for manufacturing terms, measurements, and specifications.
  `;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini translation failed: ${error.message}`);
  }
};
