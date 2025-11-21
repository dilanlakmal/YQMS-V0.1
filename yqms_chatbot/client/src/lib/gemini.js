import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
// My gemini api key in .env is like this:  VITE_GEMINI_PUBLIC_KEY=AIzaSyBPCEj5aNwE5xPBhvldQG7yVSVZ8zg3cBw
const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_PUBLIC_KEY
});
//  i want to build  then export model




// async function main() {
//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: "Explain how AI works in a few words",
//     });
//     console.log(response.text);
// }
export default ai;

// main();