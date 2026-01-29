import { Document } from "./backend/models/instruction/index.js";
import { connectDB, disconnectDB } from "./backend/Config/database.js";
import { downloadBlob, uploadBlob } from "./backend/storage/azure.blob.storage.js";
import { LLMImageExtractor } from "./backend/controller/ai/extractor/ollama.extract.controller.js";
import PDFExtractor from "./backend/controller/AI/extractor/PDFExtractor.js";
import fs from "fs";
import path from "path";
import  "./backend/Utils/logger.js";
import { Instruction } from "./backend/models/instruction/index.js";
import "./backend/Utils/logger.js"
import "./backend/Utils/logger.js"
await connectDB();

const instruction = await Instruction.findOne({ _id: "697af9646fcd8587c4bac2d7" });

const ids = await instruction.getAllContentIds();

logger.info(JSON.stringify(ids, null, 2));
// const imagePath = "./converted_test-01.png";

// logger.time("extracting");
// const result = await LLMImageExtractor(imagePath, formated);
// logger.info(JSON.stringify(result, null, 2));
// logger.timeEnd("extracting");

await disconnectDB();
// // Main function
// const run = async () => {
//     try {
//         await connectDB();

//         // 1. Fetch Document
//         const docId = "697ac4c69b66b7c5147d10aa";
//         const doc = await Document.findOne({ _id: docId });

//         if (!doc) {
//             logger.error("Document not found");
//             process.exit(1);
//         }

//         logger.log("Found document:", doc.file_name);
//         logger.log("Source URL:", doc.source);

//         // 2. Parse URL for container and blob name
//         // URL format: https://<account>.blob.core.windows.net/<container>/<blob>
//         const urlObj = new URL(doc.source);
//         const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);

//         // pathParts[0] is container (likely user_id), pathParts[1] is blob name
//         const containerName = pathParts[0];
//         const blobName = pathParts.slice(1).join('/'); // In case blob name has slashes

//         logger.log(`Container: ${containerName}`);
//         logger.log(`Blob Name: ${blobName}`);

//         // 3. Download PDF
//         logger.log("Downloading PDF from Azure...");
//         const pdfBuffer = await downloadBlob(containerName, blobName);
//         logger.log(`Downloaded ${pdfBuffer.length} bytes.`);

//         // 4. Save to temp file
//         const tempPdfPath = path.resolve("./temp_test.pdf");
//         fs.writeFileSync(tempPdfPath, pdfBuffer);
//         logger.log(`Saved temp PDF to ${tempPdfPath}`);

//         // 5. Convert to Image
//         logger.log("Converting to image...");
//         const extractor = new PDFExtractor(tempPdfPath);
//         const outputName = "converted_test";
//         // convert(outputDir, outputName)
//         const imagePath = await extractor.convert(process.cwd(), outputName);
//         logger.log(`Image generated at: ${imagePath}`);

//         // 6. Upload Image back to Azure
//         if (fs.existsSync(imagePath)) {
//             const imageBuffer = fs.readFileSync(imagePath);
//             const imageBlobName = `converted-${docId}.png`;
//             logger.log(`Uploading image as ${imageBlobName}...`);

//             const uploadedUrl = await uploadBlob(containerName, imageBlobName, imageBuffer);
//             logger.log(`Image uploaded successfully! URL: ${uploadedUrl}`);
//         } else {
//             logger.error("Image file not found!");
//         }

//         // Cleanup
//         // fs.unlinkSync(tempPdfPath);
//         // if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//     } catch (error) {
//         logger.error("Error:", error);
//     } finally {
//         await disconnectDB();
//     }
// };

// run();