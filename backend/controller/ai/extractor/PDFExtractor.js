import PDFParser from "pdf2json";
import { franc } from "franc";
import pdf2html from "pdf2html";
import AzureTranslatorService from "../../../services/translation/azure.translator.service.js";

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
    rows.forEach(r => r.items.sort((a, b) => a.x - b.x));
    return rows.sort((a, b) => a.y - b.y);
  }

  mergeRowText(items) {
    const merged = [];
    for (const item of items) {
      const t = item.text?.trim();
      if (!t) continue;
      if (merged.length > 0 && /^[：:)]$/.test(t)) merged[merged.length - 1] += t;
      else merged.push(t);
    }
    return merged.join(" ");
  }

  rebuildLines() {
    const rows = this.sortRows(this.groupByRows(this.items));
    this.lines = rows.map(r => ({ y: r.y, text: this.mergeRowText(r.items) }));
    return this.lines;
  }


  async detectLanguage() {
    const text = this.lines.map(l => l.text).join(" ").trim();

    if (!text) {
      this.language = "unknown";
      return this.language;
    }
    const response = await AzureTranslatorService.detectLanguage(text);
    this.language = response.language;
    return this.language;
  }


  parse() {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", err => reject(err.parserError));
      pdfParser.on("pdfParser_dataReady", async pdfData => {
        this.extractTexts(pdfData);
        this.rebuildLines();
        await this.detectLanguage();
        resolve({
          items: this.items,
          lines: this.lines,
          language: this.language
        });
      });
      pdfParser.loadPDF(this.filePath);
    });
  }

  /**
   * Converts the first page (or all pages) of the PDF to an image file.
   * Useful for VLM processing.
   * @param {string} outputDir - Directory to save instruction images.
   * @param {string} outputName - Base name for the output image.
   * @returns {Promise<string>} - Path to the generated image.
   */
  async convert(outputDir, outputName) {
    try {
      const pdf = await import("pdf-poppler");
      const opts = {
        format: "png",
        out_dir: outputDir,
        out_prefix: outputName,
        page: 1 // Only convert the first page for now (Cover page extraction)
      };

      await pdf.default.convert(this.filePath, opts);

      // pdf-poppler appends -1.png to the prefix for the first page
      const imagePath = `${outputDir}/${outputName}-1.png`;
      return imagePath;
    } catch (err) {
      logger.error("PDF to Image conversion failed:", err);
      throw err;
    }
  }
}

export default PDFExtractor;
