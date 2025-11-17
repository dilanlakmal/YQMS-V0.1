export const askToTranslate = async (req, res) => {
  console.log('Translation request received:', req.body);
  
  try {
    const { text, target } = req.body;
    
    // Validate input
    if (!text || !target) {
      console.log('Missing text or target:', { text, target });
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    console.log('Translating:', text, 'to:', target);

    // If target is English and text appears to be English, return as-is
    if (target === 'en') {
      console.log('Target is English, returning original text');
      return res.json({
        data: {
          translations: [{
            translatedText: text
          }]
        }
      });
    }

    // Get language name from code
    const languageNames = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'fi': 'Finnish',
      'no': 'Norwegian',
      'cs': 'Czech',
      'el': 'Greek',
      'he': 'Hebrew',
      'id': 'Indonesian',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'hu': 'Hungarian',
      'en': 'English'
    };

    const targetLanguageName = languageNames[target] || target;

    // Check for Gemini API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key available:', !!GEMINI_API_KEY);
    
    if (!GEMINI_API_KEY) {
      console.log('No Gemini API key, using MyMemory API as fallback');
      // Fallback to MyMemory API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`;
      console.log('MyMemory URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('MyMemory response:', data);
      
      if (data.responseStatus === 200) {
        const result = {
          data: {
            translations: [{
              translatedText: data.responseData.translatedText
            }]
          }
        };
        console.log('Sending result:', result);
        return res.json(result);
      } else {
        throw new Error(`MyMemory translation failed: ${data.responseDetails}`);
      }
    }

    // Use Gemini API for translation
    console.log('Using Gemini API for translation');
    
    const prompt = `Translate the following text to ${targetLanguageName}. Only return the translated text, nothing else:

"${text}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Fallback to MyMemory if Gemini fails
      console.log('Gemini API failed, falling back to MyMemory');
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.responseStatus === 200) {
        return res.json({
          data: {
            translations: [{
              translatedText: fallbackData.responseData.translatedText
            }]
          }
        });
      }
      
      throw new Error(`Both Gemini and MyMemory APIs failed`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    // Extract translated text from Gemini response
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const translatedText = data.candidates[0].content.parts[0].text.trim();
      
      // Remove quotes if Gemini added them
      const cleanedText = translatedText.replace(/^["']|["']$/g, '');
      
      const result = {
        data: {
          translations: [{
            translatedText: cleanedText
          }]
        }
      };
      
      console.log('Sending Gemini result:', result);
      return res.json(result);
    } else {
      throw new Error('Invalid response format from Gemini API');
    }

  } catch (error) {
    console.error('Translation controller error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
