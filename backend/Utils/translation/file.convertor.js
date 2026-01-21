
import { load } from "cheerio";

/**
 * File: file.convertor.js
 * Purpose: Convert object data to/from HTML flat structure for translation.
 */

const flattenLocalizedStrings = (
    nestedObj,
    targetKeys,
    parentPath = "",
    seen = new WeakSet()
) => {
    const extractedEntries = [];

    if (typeof nestedObj === "object" && nestedObj !== null) {
        if (seen.has(nestedObj)) return extractedEntries;
        seen.add(nestedObj);
    }

    if (Array.isArray(nestedObj)) {
        nestedObj.forEach((item, index) => {
            const arrayPath = parentPath ? `${parentPath}-${index}` : `${index}`;
            extractedEntries.push(
                ...flattenLocalizedStrings(item, targetKeys, arrayPath, seen)
            );
        });
        return extractedEntries;
    }

    for (const [key, value] of Object.entries(nestedObj)) {
        if (key === "_id" || key === "__v" || key === "$oid") continue;

        const currentPath = parentPath ? `${parentPath}-${key}` : key;

        if (typeof value === "object" && value !== null) {
            extractedEntries.push(
                ...flattenLocalizedStrings(value, targetKeys, currentPath, seen)
            );
        }
        else if (typeof value === "string" && targetKeys.includes(key)) {
            extractedEntries.push({
                id: currentPath,
                text: value
            });
        }
    }

    return extractedEntries;
};

const generateHtmlFromEntries = (flattenedEntries) => {
    const contentHtml = flattenedEntries
        .map(({ id, text }) => `
      <section class="content-block">
        <p id="${id}">${text}</p>
      </section>`)
        .join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exported Content</title>
</head>
<body>
  ${contentHtml}
</body>
</html>
`;
};

const setValueByPath = (targetObj, pathString, languageList, targetLang, value) => {
    const segments = pathString.split('-');
    let cursor = targetObj;

    for (let i = 0; i < segments.length; i++) {
        const key = segments[i];
        const nextKey = segments[i + 1];

        if (languageList.includes(key)) {
            cursor[targetLang] = value;
            break;
        }

        if (!isNaN(nextKey)) {
            if (!cursor[key]) cursor[key] = [];
            cursor = cursor[key];
        }
        else if (!isNaN(key)) {
            const index = parseInt(key, 10);
            if (!cursor[index]) cursor[index] = {};
            cursor = cursor[index];
        }
        else {
            if (!cursor[key]) cursor[key] = {};
            cursor = cursor[key];
        }
    }
};

const reconstructObjectFromHtml = (sources, languageKeys, schemaTemplate) => {
    const rootResult = {};

    for (const source of sources) {
        const { content, toLang } = source;
        const $ = load(content);

        for (const item of schemaTemplate) {
            const extractedText = $(`#${item.id}`).text();
            setValueByPath(rootResult, item.id, languageKeys, toLang, extractedText);
        }
    }

    return rootResult;
};

const deepMergeObjects = (target, source) => {
    for (const key of Object.keys(source)) {
        const sourceValue = source[key];
        const isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);

        if (isObject(sourceValue)) {
            if (!isObject(target[key])) {
                target[key] = {};
            }
            deepMergeObjects(target[key], sourceValue);
        } else {
            target[key] = sourceValue;
        }
    }
    return target;
};

export { flattenLocalizedStrings, generateHtmlFromEntries, reconstructObjectFromHtml, deepMergeObjects, setValueByPath};
