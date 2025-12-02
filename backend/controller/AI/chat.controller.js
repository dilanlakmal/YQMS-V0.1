import { Ollama } from "ollama";


export const getChatWithOllama = async(req, res) => {
    const {model, messages} = req.body;
    let host = process.env.OLLAMA_API_URL;
    if (model === "llama3.2:latest"){
        host = process.env.llama3_2_API_URL;
        console.log("User use mode:", model)
    }

    try {
        const ollama = new Ollama({
            host: host,
            headers: {
                Authorization: "Bearer " + process.env.OLLAMA_API_KEY
            }
        })

        const result = await ollama.chat({
            model,
            messages: messages,
            stream: false
        })

        res.json(result);
        console.log("Successful request", result);
    } catch (error) {
        console.error("Ollama Error", error);
        res.status(500).json({error: error.messages});

    }
}