import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Command } from "commander";
import { AzureOpenAI } from "openai";

// Load environment variables from specific path or default
// Check CWD and Parent Dir
const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env")
];

let loaded = false;
for (const p of envPaths) {
    if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        console.log(`Loaded environment from: ${p}`);
        loaded = true;
        break;
    }
}

if (!loaded) {
    dotenv.config(); // Fallback to default behavior
    console.log("Loaded default environment (or failed if none found)");
}

const MAX_CHARS_PER_DOC = 50000; // Increased to match Python script

// Custom PDF extraction helper
async function extractPdfText(filePath) {
    let parser;
    try {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            console.warn(`File does not exist: ${absolutePath}`);
            return "";
        }

        const dataBuffer = fs.readFileSync(absolutePath);
        // Correct usage based on original file (mehmet-kozan/pdf-parse v2)
        parser = new PDFParse({ data: dataBuffer });
        const textData = await parser.getText();
        return textData.text.trim();
    } catch (error) {
        console.error(`Error extracting PDF text from ${filePath}:`, error.message);
        return "";
    } finally {
        if (parser && parser.destroy) {
            await parser.destroy();
        }
    }
}

async function readTextFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
        return await extractPdfText(filePath);
    } else if (ext === ".txt" || ext === ".md") {
        return fs.readFileSync(filePath, "utf-8");
    } else {
        throw new Error(`Unsupported file type: ${ext}`);
    }
}

async function createGlossary(sourceFile, sourceLang, targetFile, targetLang, outputFile) {
    console.log(`\n--- Glossary Generation Started ---`);
    console.log(`Source: ${sourceFile} (${sourceLang})`);
    console.log(`Target: ${targetFile} (${targetLang})`);

    // 1. Read files
    const sourceText = await readTextFromPath(sourceFile);
    const targetText = await readTextFromPath(targetFile);

    if (sourceText.length < 10 || targetText.length < 10) {
        throw new Error("Extraction failed: One of the documents appears empty.");
    }

    console.log(`Extracted ${sourceText.length} chars from Source.`);
    console.log(`Extracted ${targetText.length} chars from Target.`);

    // 2. Setup Azure OpenAI Client
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

    if (!endpoint || !apiKey || !deployment) {
        throw new Error("Missing Azure OpenAI config. Check your .env file.");
    }

    const client = new AzureOpenAI({
        endpoint: endpoint,
        apiKey: apiKey,
        apiVersion: apiVersion,
        deployment: deployment
    });

    // 3. Prepare Prompt (Improved Strategy)
    const systemPrompt = `
You are an expert terminologist for ${targetLang} localization. 
Your goal is to build a glossary from the provided source text.

Criteria for selecting terms:
1. Technical/Domain-Specific: Include words that have a specialized meaning in this context.
2. Recurring Entities: Include product names, feature names, or repeated key concepts.
3. Exclude Common Verbs: Do not include common words unless they are part of a specific technical phrase.

Format: Output ONLY a TSV list (Source<TAB>Target). No header. No markdown code blocks.
    `;

    const userPrompt = `
[SOURCE - ${sourceLang}]
${sourceText.substring(0, MAX_CHARS_PER_DOC)}

[TARGET - ${targetLang}]
${targetText.substring(0, MAX_CHARS_PER_DOC)}
    `;

    // 4. Call API
    console.log("Sending request to Azure OpenAI...");
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: deployment, // In Azure SDK, model is often ignored if deployment is set in client, but good to have
            max_tokens: 2000,
            temperature: 0.3,
        });

        let glossaryData = completion.choices[0].message.content;

        // Clean up markdown code blocks if present
        glossaryData = glossaryData.replace(/```tsv/g, "").replace(/```/g, "").trim();

        if (!glossaryData) {
            console.error("Error: Model returned empty response.");
            return;
        }

        // 5. Save Output
        fs.writeFileSync(outputFile, glossaryData, "utf-8");
        console.log(`✅ Success! Glossary saved to: ${outputFile}`);
    } catch (error) {
        console.error("Azure OpenAI Error:", error);
        throw error;
    }
}

function getAzureClient() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

    if (!endpoint || !apiKey || !deployment) {
        throw new Error("Missing Azure OpenAI config. Check your .env file.");
    }

    const client = new AzureOpenAI({
        endpoint: endpoint,
        apiKey: apiKey,
        apiVersion: apiVersion,
        deployment: deployment
    });

    return { client, deployment };
}

/**
 * Aligns source and target text sentence-by-sentence.
 * @param {string} sourceText 
 * @param {string} targetText 
 * @param {string} sourceLang 
 * @param {string} targetLang 
 * @returns {Promise<Array<{id: number, source: string, target: string}>>}
 */
export async function alignText(sourceText, targetText, sourceLang, targetLang) {
    const { client, deployment } = getAzureClient();

    const systemPrompt = `
You are a linguistic alignment engine.
Task: Align the provided Source Text with the Target Text sentence-by-sentence.
Input: Two blocks of text.
Output: A JSON array of objects, where each object has 'id', 'source', and 'target'.
Rules: 
- Ensure the meaning matches. 
- If a sentence is missing in one side, leave it empty.
- Do not summarize. strictly align actual sentences.
- Return ONLY JSON.
    `;

    const userPrompt = `
Source Language: ${sourceLang}
Target Language: ${targetLang}

[SOURCE TEXT]
${sourceText.substring(0, 10000)}

[TARGET TEXT]
${targetText.substring(0, 10000)}
    `;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: deployment,
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        let content = completion.choices[0].message.content;
        const result = JSON.parse(content);
        // Handle cases where AI might wrap it in a root key like "alignments"
        if (result.alignments) return result.alignments;
        if (Array.isArray(result)) return result;
        // Fallback: try to find an array in values
        const values = Object.values(result);
        for (const v of values) {
            if (Array.isArray(v)) return v;
        }
        return [];
    } catch (error) {
        console.error("Alignment Error:", error);
        return [];
    }
}

/**
 * Evaluates a user correction to determine if it should be added to the glossary.
 * @param {string} sourceSegment 
 * @param {string} newTargetSegment 
 * @param {string} sourceLang 
 * @param {string} targetLang 
 * @returns {Promise<{shouldAddToGlossary: boolean, term: {source: string, target: string}, reason: string}>}
 */
export async function evaluateCorrection(sourceSegment, newTargetSegment, sourceLang, targetLang) {
    const { client, deployment } = getAzureClient();

    const systemPrompt = `
You are a glossary curator.
A user has manually corrected a translation.
Task: Identify if there is a specific Terminology pair that motivated this change.
Logic:
- If the change fixes a typo or grammar, return shouldAddToGlossary: false.
- If the change replaces a word with a better domain-specific term, return shouldAddToGlossary: true and extract the term.
- Extracted term must be in base form (singular, infinitive).

Output JSON format:
{
    "shouldAddToGlossary": boolean,
    "term": { "source": "extracted source term", "target": "extracted target term" },
    "reason": "explanation"
}
    `;

    const userPrompt = `
Source Segment: "${sourceSegment}"
User Corrected Target: "${newTargetSegment}"
Language Pair: ${sourceLang} -> ${targetLang}
    `;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: deployment,
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("Evaluation Error:", error);
        return { shouldAddToGlossary: false, reason: error.message };
    }
}

/**
 * Extracts ALL glossary terms from parallel source/target documents.
 * This is the BULK extraction mode - processes entire documents.
 * @param {string} sourceText - Full source document text
 * @param {string} targetText - Full target document text (user-edited)
 * @param {string} sourceLang - Source language code (e.g., 'en')
 * @param {string} targetLang - Target language code (e.g., 'km')
 * @returns {Promise<Array<{source: string, target: string}>>} - Array of term pairs
 */
export async function extractGlossaryTerms(sourceText, targetText, sourceLang, targetLang) {
    const { client, deployment } = getAzureClient();

    const systemPrompt = `
You are an expert terminologist for ${targetLang} localization.
Your goal is to extract ALL glossary term pairs from the provided parallel texts.

Criteria for selecting terms:
1. Technical/Domain-Specific: Include words that have a specialized meaning in this context.
2. Recurring Entities: Include product names, feature names, or repeated key concepts.
3. Idioms and Phrases: Include expressions where the translation is not literal.
4. Exclude Common Words: Do not include common verbs/nouns unless they have specialized meaning.

Output JSON format:
{
    "terms": [
        { "source": "English term", "target": "Khmer translation" },
        { "source": "Another term", "target": "ការបកប្រែ" }
    ]
}

Extract 10-50 high-quality term pairs. Focus on accuracy over quantity.
    `;

    const userPrompt = `
[SOURCE DOCUMENT - ${sourceLang}]
${sourceText.substring(0, MAX_CHARS_PER_DOC)}

[TARGET DOCUMENT - ${targetLang}]
${targetText.substring(0, MAX_CHARS_PER_DOC)}
    `;

    try {
        console.log("Extracting glossary terms from parallel documents...");
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: deployment,
            response_format: { type: "json_object" },
            max_tokens: 4000,
            temperature: 0.2,
        });

        const result = JSON.parse(completion.choices[0].message.content);
        console.log(`Extracted ${result.terms?.length || 0} glossary terms.`);
        return result.terms || [];
    } catch (error) {
        console.error("Glossary Extraction Error:", error);
        return [];
    }
}

import { fileURLToPath } from 'url';

// CLI Setup (Only run if executed directly)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const program = new Command();
    program
        .name("createGlossary")
        .description("CLI to create a glossary from source and target files using Azure AI")
        .argument("<sourceFile>", "Path to Source File (PDF/TXT)")
        .argument("<sourceLang>", "Source Language Name")
        .argument("<targetFile>", "Path to Target File (PDF/TXT)")
        .argument("<targetLang>", "Target Language Name")
        .argument("<outputFile>", "Path to Output TSV File")
        .action(async (sourceFile, sourceLang, targetFile, targetLang, outputFile) => {
            try {
                await createGlossary(sourceFile, sourceLang, targetFile, targetLang, outputFile);
            } catch (err) {
                console.error("Failed:", err.message);
                process.exit(1);
            }
        });

    program.parse(process.argv);
}