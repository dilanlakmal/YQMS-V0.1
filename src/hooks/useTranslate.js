import { useState, useCallback, useEffect, useRef } from 'react';
import { document as docService } from '@/services/instructionService';
import { useAuth } from '@/components/authentication/AuthContext';

/**
 * Custom hook for static text translation.
 * Uses a local cache to avoid redundant network requests.
 */
export const useTranslate = () => {
    const { user } = useAuth();
    const cacheRef = useRef({}); // Using Ref avoid re-memoization loops
    const [userLang, setUserLang] = useState('en');

    useEffect(() => {
        let lang = user?.language || localStorage.getItem('preferredLanguage') || 'en';
        if (lang === 'kh') lang = 'km';
        if (lang === 'ch') lang = 'zh-Hans';
        setUserLang(lang);
    }, [user]);

    /**
     * Translates a single text string.
     * @param {string} text - The original text.
     * @returns {Promise<string>} - The translated text.
     */
    const translate = useCallback(async (text) => {
        if (!text) return '';

        // 1. Check local session cache
        const cacheKey = `${text}_${userLang}`;
        if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey];

        try {
            // 2. Call backend static translation
            const response = await docService.translateStatic(text, userLang);
            const translated = response.translated || text;

            // 3. Update cache
            cacheRef.current[cacheKey] = translated;
            return translated;
        } catch (error) {
            console.error('Static translation failed:', error);
            return text; // Fallback to original
        }
    }, [userLang]);

    /**
     * Helper to translate an object/array of texts.
     * Useful for batch translating UI elements like sidebar steps.
     */
    const translateBatch = useCallback(async (items, keyName = 'title') => {
        if (!items || !Array.isArray(items)) return items;

        const translatedItems = await Promise.all(
            items.map(async (item) => {
                const originalText = typeof item === 'string' ? item : item[keyName];
                if (!originalText) return item;

                const translated = await translate(originalText);

                if (typeof item === 'string') return translated;
                return { ...item, [keyName]: translated };
            })
        );

        return translatedItems;
    }, [translate]);

    return { translate, translateBatch, userLang };
};
