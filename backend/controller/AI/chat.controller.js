import { Ollama } from "ollama";


export const getChatWithOllama = async(req, res) => {
    const {model, prompt} = req.body;

    try {
        const ollama = new Ollama({
            host: process.env.OLLAMA_API_URL,
            headers: {
                Authorization: "Bearer " + process.env.OLLAMA_API_KEY
            }
        })

        const result = await ollama.chat({
            model,
            messages: [{role: "user", content: prompt}],
            stream: false
        })

        res.json(result);
        console.log("Successful request", result);
    } catch (error) {
        console.error("Ollama Error", error);
        res.status(500).json({error: error.messages});

    }
}