import axios from "axios";

/* ------------------------------
   AI Chatbot Proxy Route
------------------------------ */
export const askQuesctionAI = async (req, res) => {
  // Destructure both question and selectedModel from the request body
  const { question, selectedModel } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    // Forward the request to the Python Flask AI service
    // This URL must match where your Python service is running.
    const aiServiceResponse = await axios.post("http://localhost:5002/ask", {
      // Pass both pieces of data to the Python service
      question: question,
      selectedModel: selectedModel
    });

    // Send the response from the AI service back to the React client
    res.json(aiServiceResponse.data);
  } catch (error) {
    console.error("Error proxying request to AI service:", error.message);

    // Provide a user-friendly error message
    res.status(502).json({
      answer:
        "Sorry, I'm having trouble connecting to my brain right now. Please try again later."
    });
  }
};
