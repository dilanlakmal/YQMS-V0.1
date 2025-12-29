import PDFParser from "pdf2json";
import { franc } from "franc";
import pdf2html from "pdf2html";

class PDFExtractor {
  constructor(filePath, requiredFields = null) {
    this.filePath = filePath;
    this.items = [];
    this.lines = [];
    this.fields = {};
    this.language = "";
    this.requiredFields = requiredFields;
  }

  safeDecode(text) {
    try { return decodeURIComponent(text); } 
    catch { return text; }
  }

  extractTexts(pdfData, pageIndex = 0) {
    const page = pdfData.Pages[pageIndex];
    this.items = page.Texts.map(t => ({
      text: this.safeDecode(t.R[0].T).trim(),
      x: t.x,
      y: t.y
    }));
    return this.items;
  }

  groupByRows(items, yTolerance = 0.25) {
    const rows = [];
    items.forEach(item => {
      let row = rows.find(r => Math.abs(r.y - item.y) <= yTolerance);
      if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
      row.items.push(item);
    });
    return rows;
  }

  sortRows(rows) {
    rows.forEach(r => r.items.sort((a,b) => a.x - b.x));
    return rows.sort((a,b) => a.y - b.y);
  }

  mergeRowText(items) {
    const merged = [];
    for (const item of items) {
      const t = item.text?.trim();
      if (!t) continue;
      if (merged.length > 0 && /^[：:)单]$/.test(t)) merged[merged.length-1] += t;
      else merged.push(t);
    }
    return merged.join(" ");
  }

  rebuildLines() {
    const rows = this.sortRows(this.groupByRows(this.items));
    this.lines = rows.map(r => ({ y: r.y, text: this.mergeRowText(r.items) }));
    return this.lines;
  }


    detectLanguage() {
    const text = this.lines.map(l => l.text).join(" ").trim();

    if (!text) {
        this.language = "unknown";
        return this.language;
    }

    // 1️⃣ Unicode-based detection (FAST & RELIABLE)
    const hasKhmer = /[\u1780-\u17FF]/.test(text);
    const hasChinese = /[\u4E00-\u9FFF]/.test(text);
    const hasEnglish = /[A-Za-z]/.test(text);

    if (hasKhmer) {
        this.language = "khmer";
        return this.language;
    }

    if (hasChinese) {
        this.language = "chinese";
        return this.language;
    }

    if (hasEnglish) {
        this.language = "english";
        return this.language;
    }

    // 2️⃣ Fallback to franc (edge cases only)
    const langCode = franc(text);

    if (["cmn", "yue", "wuu", "hak", "nan"].includes(langCode)) {
        this.language = "chinese";
    } else if (langCode === "eng") {
        this.language = "english";
    } else if (langCode === "khm") {
        this.language = "khmer";
    } else {
        this.language = "unknown";
    }

    return this.language;
    }


  parse() {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", err => reject(err.parserError));
      pdfParser.on("pdfParser_dataReady", pdfData => {
        this.extractTexts(pdfData);
        this.rebuildLines();
        this.detectLanguage();
        resolve({
          items: this.items,
          lines: this.lines,
          language: this.language
        });
      });
      pdfParser.loadPDF(this.filePath);
    });
  }
}

export default PDFExtractor;
