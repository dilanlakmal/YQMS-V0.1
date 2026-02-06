/**
 * LLM Service for Glossary Mining
 * Provides AI-powered domain detection, term extraction, and translation
 * Uses Azure OpenAI with strict JSON output
 */

import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Azure OpenAI client
let client = null;

const LANGUAGE_MAP = {
    "en": "English",
    "km": "Khmer",
    "zh": "Chinese (Simplified)",
    "zh-Hans": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "th": "Thai",
    "vi": "Vietnamese",
    "fr": "French",
    "es": "Spanish"
};

function getLangName(code) {
    return LANGUAGE_MAP[code] || code;
}

function getClient() {
    if (!client) {
        client = new AzureOpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_ENDPOINT,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview"
        });
    }
    return client;
}

const MODEL = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";
const MAX_RETRIES = 2;

/**
 * Call LLM with JSON parsing and retry logic
 */
async function callLLM(systemPrompt, userPrompt, maxRetries = MAX_RETRIES, maxTokens = 4000) {
    const openai = getClient();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: maxTokens,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            if (error instanceof SyntaxError) {
                console.warn(`[LLM] JSON parse failed (attempt ${attempt + 1}):`, error.message);
                if (attempt < maxRetries) continue;
            }
            throw error;
        }
    }

    throw new Error('Failed to get valid JSON from LLM after retries');
}

/**
 * Detect document domain
 * @param {string} text - Document text (first 2000 chars)
 * @returns {Promise<{domain: string, confidence: number, keywords: string[]}>}
 */
export async function detectDomain(text) {
    const systemPrompt = `You are a document domain classification expert. Analyze text and determine its primary domain.`;

    const userPrompt = `Classify the domain of this document excerpt. Return ONLY valid JSON.

DOCUMENT:
${text.slice(0, 2000)}

OUTPUT FORMAT (strict JSON):
{
    "domain": "Legal|Medical|Engineering|Building|Finance|IT|General|Garment Industry",
    "confidence": 0.0-1.0,
    "keywords": ["keyword1", "keyword2", "keyword3"]
}

RULES:
1. Choose exactly ONE domain from the list
2. confidence reflects certainty (0.9+ = very confident)
3. keywords are 3-5 domain-specific terms found in the text
4. If uncertain, use "General" with lower confidence`;

    const result = await callLLM(systemPrompt, userPrompt);

    // Validate domain
    const validDomains = ["Legal", "Medical", "Engineering", "Building", "Finance", "IT", "General", "Garment", "Garment Industry"];
    if (!validDomains.includes(result.domain)) {
        result.domain = "General";
    }

    return result;
}

/**
 * Extract terms from single document
 * @param {string} text - Document chunk
 * @param {string} sourceLang - Source language code
 * @param {string} domain - Document domain
 * @returns {Promise<Array<{term: string, category: string, confidence: number, evidenceSentence: string}>>}
 */
export async function extractTerms(text, sourceLang, domain) {
    const systemPrompt = `You are a terminology extraction expert for ${getLangName(sourceLang)}. Extract domain-specific terms that should be standardized in translations.`;

    const userPrompt = `Extract technical/domain-specific terms from this ${domain} document.

DOCUMENT (${getLangName(sourceLang)}):
${text}

OUTPUT FORMAT (strict JSON):
{
    "terms": [
        {
            "term": "exact term as found",
            "category": "noun|verb|phrase|acronym|proper_noun",
            "confidence": 0.0-1.0,
            "evidenceSentence": "sentence where term appears"
        }
    ]
}

RULES:
1. Extract ONLY domain-specific terminology, NOT common words
2. Include multi-word terms (e.g., "intellectual property")
3. Include acronyms with their expansion if found
4. confidence = how confident this is a glossary-worthy term
5. evidenceSentence = exact sentence from document containing the term
6. Return empty array if no domain terms found
7. Skip: articles, prepositions, common verbs (eg: is, are, have)
8. Maximum 30 terms per chunk`;

    const result = await callLLM(systemPrompt, userPrompt);
    return result.terms || [];
}

/**
 * Translate a term
 * @param {string} term - Source term
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} domain - Domain context
 * @param {string} context - Sentence context
 * @returns {Promise<{target: string, confidence: number, alternatives: string[], no_translate: boolean}>}
 */
export async function translateTerm(term, sourceLang, targetLang, domain, context = '') {
    const systemPrompt = `You are a professional ${getLangName(sourceLang)}-to-${getLangName(targetLang)} translator specializing in ${domain} terminology.`;

    const userPrompt = `Translate this term to ${getLangName(targetLang)}. Return ONLY valid JSON.

TERM: ${term}
DOMAIN: ${domain}
CONTEXT: ${context}

OUTPUT FORMAT (strict JSON):
{
    "target": "translated term",
    "confidence": 0.0-1.0,
    "alternatives": ["alt1", "alt2"],
    "no_translate": false
}

RULES:
1. Use formal/professional register
2. Prefer established terminology for ${domain}
3. confidence = how confident in this translation
4. alternatives = other valid translations (max 2)
5. no_translate = true if term should NOT be translated (proper nouns, brand names)
6. If unsure, provide alternatives and lower confidence
7. Do NOT transliterate unless no equivalent exists`;

    return await callLLM(systemPrompt, userPrompt);
}

/**
 * Extract parallel term pairs from aligned texts
 * @param {string} sourceText - Source text chunk
 * @param {string} targetText - Target text chunk
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} domain - Document domain
 * @returns {Promise<Array<{sourceTerm: string, targetTermOriginal: string, confidence: number}>>}
 */
export async function extractParallelTerms(sourceText, targetText, sourceLang, targetLang, domain) {
    const systemPrompt = `You are a bilingual terminology extraction expert for ${getLangName(sourceLang)} and ${getLangName(targetLang)}.`;

    const userPrompt = `Extract aligned terminology pairs from these parallel texts.

SOURCE (${getLangName(sourceLang)}):
${sourceText}

TARGET (${getLangName(targetLang)}):
${targetText}

OUTPUT FORMAT (strict JSON):
{
    "pairs": [
        {
            "sourceTerm": "term in source language",
            "targetTermOriginal": "corresponding term in target",
            "confidence": 0.0-1.0,
            "evidenceSource": "source sentence containing term",
            "evidenceTarget": "target sentence containing term"
        }
    ]
}

RULES:
1. Extract ONLY domain-specific terminology pairs
2. Terms must actually appear in both source AND target
3. confidence scoring:
   - 0.9+: Perfect match, appears multiple times consistently
   - 0.7-0.89: Good match, appears once
   - 0.5-0.69: Possible match, inference required
   - <0.5: Uncertain, may be incorrect
4. targetTermOriginal = exact term from target document (do NOT modify)
5. Skip common words, focus on technical/domain vocabulary
6. Maximum 25 pairs per chunk
7. Return empty array if no aligned pairs found
8. NEVER hallucinate terms not present in the texts`;

    const result = await callLLM(systemPrompt, userPrompt);
    return result.pairs || [];
}

/**
 * Align sentences between source and target documents
 * @param {string} sourceText - Source document text
 * @param {string} targetText - Target document text
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @returns {Promise<Array<{id: number, source: string, target: string}>>}
 */
export async function alignSentences(sourceText, targetText, sourceLang, targetLang) {
    // For now, use simple paragraph alignment
    // Can be enhanced with more sophisticated alignment algorithms
    const sourceParagraphs = sourceText.split(/\n\n+/).filter(p => p.trim());
    const targetParagraphs = targetText.split(/\n\n+/).filter(p => p.trim());
    const minLen = Math.min(sourceParagraphs.length, targetParagraphs.length);

    return Array.from({ length: minLen }, (_, i) => ({
        id: i,
        source: sourceParagraphs[i],
        target: targetParagraphs[i]
    }));
}

export default {
    detectDomain,
    extractTerms,
    translateTerm,
    extractParallelTerms,
    alignSentences
};
