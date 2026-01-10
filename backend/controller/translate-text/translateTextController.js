import TextTranslationClient from "@azure-rest/ai-translation-text";

const translateText = async (req, res) => {
  try {
    const { text, from, to } = req.body;

    if (!text) return res.status(400).json({ error: "Text is required" });
    if (!to) return res.status(400).json({ error: "Target language (to) is required" });

    const apiKey = process.env.AZURE_TRANSLATOR_KEY;
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const region = process.env.AZURE_TRANSLATOR_REGION; 

    if (!apiKey || !endpoint) {
      return res.status(500).json({ error: "Azure Translator credentials not configured" });
    }

    const credential = { key: apiKey, region: region || "southeastasia" };

    // v1.0.1: default export is a function (client factory)
    const client = TextTranslationClient(endpoint, credential);

    const input = Array.isArray(text) ? text.map(t => ({ text: t })) : [{ text }];


    const response = await client.path("/translate").post({
      body: input,
      queryParameters: { to, ...(from ? { from } : {}) }
    });

    
    const isSuccess = response.status === 200 || response.status === "200";

    if (!isSuccess) {
        return res.status(Number(response.status) || 500).json({
          error: "Translation failed",
          details: response.body
        });
      }

    return res.status(200).json({ success: true, data: response.body });
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(500).json({ error: "Translation failed", message: error.message });
  }
};

export default translateText;