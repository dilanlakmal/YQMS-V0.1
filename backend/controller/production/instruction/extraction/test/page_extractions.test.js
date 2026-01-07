/**
 * Manual test for PDF extraction pipeline
 * Run with: node pdfExtraction.test.js
 */

import path from "path";
import process from "process";

import { createDocument } from "../../document.controller.js";
import {
  getPdf,
  isFileExist,
  splitPdf,
  extractImages,
  extractContent,
  extractFields,
  rootDir
} from "../page_extractions.controller.js";

async function runPdfExtractionTest() {
  console.time("PDF Extraction");

  const fileName = "(result) GPRT00077C 生产单 2025.11.27.pdf";

  const fileTestPath = path.join(
    rootDir,
    "backend",
    "controller",
    "production",
    "instruction",
    "extraction",
    "test",
    fileName
  );

  console.log(
    "Is test file exist?",
    isFileExist(fileTestPath) ? "Yes" : "No"
  );

  if (!isFileExist(fileTestPath)) {
    throw new Error(`Test file not found: ${fileTestPath}`);
  }

  // 1. Create document record
  const id = await createDocument(
    fileName,
    fileTestPath,
    "instruction",
    "GPRT"
  );

  console.log("Document created with ID:", id);

  // 2. Load PDF
  const doc = await getPdf(id);
  console.log("PDF loaded");

  // 3. Split PDF
  const splittedDoc = await splitPdf(doc);
  console.log("PDF split completed");

  // 4. Extract images
  const updatedDoc = await extractImages(splittedDoc);
  console.log("Image extraction completed");

  // 5. Extract text/content
  const content = await extractContent(updatedDoc);
  console.log("Content extraction completed");

  // 6. Extract structured fields
  await extractFields(content);
  console.log("Field extraction completed");

  console.timeEnd("PDF Extraction");
}

/**
 * Execute test
 */
runPdfExtractionTest()
  .then(() => {
    console.log("✅ PDF extraction test finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ PDF extraction test failed");
    console.error(err);
    process.exit(1);
  });
