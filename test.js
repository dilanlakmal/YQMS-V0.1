import "dotenv/config";
import { connectDB, disconnectDB } from "./backend/Config/database.js";
import Instruction from "./backend/models/instruction/Instruction.model.js";
// import Document from "./backend/models/instruction/document.model.js";
import Glossary from "./backend/models/translation/glossary.model.js";
import "./backend/Utils/logger.js";
import OllamaProvider from "./backend/modules/ai/orchestrator/providers/ollama-provider.js";
import { exec } from "node:child_process";
/**
 * Simple test script for Instruction models
 * 
 * 
 */
await connectDB();


await Glossary.createGlossary("廠號", "", "លេខរោងចក្រ", "km");

const glossaries = await Glossary.getGlossaryItems("zh-Hant", "km");
const glossaryContent = glossaries.map(g => `${g.source}\t${g.target}`).join("\n");
logger.info(glossaryContent);

await disconnectDB();
// exec("ssh yaidev");
// const testContent = `GPRT00077C 注意大點
// 客款號 : W02-490014
// 廠號 : GPRT00077C
// PO# 709331
// 數量 : 3,200 pcs
// 大點 : Retail单 要PO#+RETEK 组合唛
// 1. GPRT00077C W02-490014 前幅印花(PP办评语看附页明细)
// 2. 圈起的数量加裁+10%
// 3. 中查明细表如图`;

// async function testModels() {
//   try {
//     console.log("🚀 Starting models test...");
//     await connectDB();

//     // 1. Create a dummy document
//     console.log("Creating dummy document...");
//     const dummyDoc = await Document.create({
//       type: "instruction",
//       file_name: "test-instruction.pdf",
//       status: "uploaded"
//     });
//     console.log(`✅ Document created: ${dummyDoc._id}`);

//     // 2. Test getInitialInstruction (which uses Prompt and Annotation internally)
//     console.log("Testing getInitialInstruction...");
//     const instruction = await Instruction.getInitialInstruction(dummyDoc._id);
//     console.log(`✅ Instruction initialized: ${instruction._id}`);

//     // 3. Test constructORC
//     console.log("Testing constructORC (generating JSON schema)...");
//     const populatedInstruction = await Instruction.getInstruction(dummyDoc._id);
//     logger.info(JSON.stringify(populatedInstruction, null, 2));

//     const orcSchema = await populatedInstruction.constructORC();
//     console.log("✅ ORC Schema generated successfully:");
//     console.log(JSON.stringify(orcSchema, null, 2));

//     // 4. Test Extraction
//     console.log("🚀 Starting Extraction with Ollama...");
//     const aiProvider = new OllamaProvider({
//       baseUrl: process.env.OLLAMA_BASE_URL
//     });

//     // Use the primary text model from env or fallback
//     const model = process.env.OLLAMA_TEXT_PRIMARY || "llama3.1:latest";
//     console.log(`Using model: ${model}`);

//     const extractedResult = await aiProvider.extract(testContent, orcSchema, { model });

//     if (extractedResult) {
//       console.log("✅ Extraction successful!");
//       console.log(JSON.stringify(extractedResult, null, 2));
//       await populatedInstruction.updateInstruction(extractedResult);
//       const updatedInstruction = await Instruction.getInstruction(dummyDoc._id);
//       logger.info("updated instruction: " + JSON.stringify(updatedInstruction, null, 2));
//       const detectedLanguage = await updatedInstruction.getDetectedLanguage();
//       logger.info(`Detected language: ${detectedLanguage}`);
//       // Test getAllContents
//       logger.info("Testing getAllContents...");
//       const allContents = await updatedInstruction.getAllContents();
//       logger.info(`✅ Retrieved ${allContents.length} unique content documents.`);
//       allContents.forEach((c, idx) => {
//         logger.info(`  [${idx + 1}] ID: ${c._id}, Text: "${c.original}"`);
//       });
//     } else {
//       logger.error("❌ Extraction failed (returned null).");
//     }

//     // 5. Cleanup
//     // console.log("Cleaning up test data...");
//     // await Document.findByIdAndDelete(dummyDoc._id);
//     // await Instruction.findByIdAndDelete(instruction._id);

//     console.log("🎉 All tests completed!");
//   } catch (error) {
//     console.error("❌ Test failed:", error);
//   } finally {
//     await disconnectDB();
//     process.exit(0);
//   }
// }

// await testModels();
