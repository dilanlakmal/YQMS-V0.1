import { Progress } from "../models/instruction/index.js";
import { UserProd, UserMain } from "../controller/MongoDB/dbConnectionController.js";
import { Content, Language } from "../models/translation/index.js";
import   "../Utils/logger.js";

// Select User Model based on Environment
const User = process.env.NODE_ENV === "development" ? UserMain : UserProd;

const steps = [
  {
    title: 'Select Team',
    description: 'Choose your department',
    instruct_title: "Select Your Team",
    instruct_description: "Choose the department for this instruction to proceed.",
    icon: "Users",
    status: "active",
    order: 1
  },
  {
    title: 'Insert PDF',
    description: 'Upload instruction file',
    instruct_title: "Upload Instruction",
    instruct_description: "Attach the PDF file you wish to translate.",
    icon: "FileText",
    status: "inactive",
    order: 2
  },
  {
    title: 'Configure',
    description: 'Language & Glossary',
    instruct_title: "Translation Configuration",
    instruct_description: "Select language and upload glossary for accurate translation.",
    icon: "Globe",
    status: "inactive",
    order: 3
  },
  {
    title: 'Finalize',
    description: 'Export PDF',
    instruct_title: "Finalize & Export",
    instruct_description: "Download your finalized instruction document.",
    icon: "Award",
    status: "inactive",
    order: 4
  },
];

async function progressSeed() {
  const start = Date.now();
  let executed = 0;

  const users = await User.find();

  logger.info(`👥 Users found: ${users.length}`);

  const language = await Language.findOne({ code: "en" });

  if (!language) {
    logger.error("❌ Language 'en' not found");
    return;
  }
  logger.info(`🌐 Language loaded: ${language.code}`);

  const bulkOps = [];
  const contentMap = new Map();

  // 1. Ensure all static content exists in the DB
  for (const step of steps) {
    const contents = [
      step.title,
      step.description,
      step.instruct_title,
      step.instruct_description
    ];

    for (const text of contents) {
      // Upsert content: create if not exists
      const doc = await Content.findOneAndUpdate(
        { original: text, language: language._id },
        { $setOnInsert: { original: text, language: language._id, translated: false } },
        { upsert: true, new: true }
      );
      contentMap.set(text, doc._id);
    }
  }

  logger.info(`📚 Content ready (${contentMap.size} items)`);
  logger.info("⚙️ Preparing progress bulk operations…");

  const totalOps = users.length * steps.length;
  logger.info(`🧮 Expected progress records: ${totalOps}`);

  // 2. Create Progress records for each user
  for (const user of users) {
    for (const step of steps) {
      bulkOps.push({
        updateOne: {
          filter: {
            user_id: user._id,
            // We filter by 'order' to find the specific step for this user
            order: step.order
          },
          update: {
            $set: {
              title: contentMap.get(step.title),
              description: contentMap.get(step.description),
              instruct_title: contentMap.get(step.instruct_title),
              instruct_description: contentMap.get(step.instruct_description),
              status: step.status,
              icon: step.icon,
              order: step.order
            }
          },
          upsert: true,
        }
      });
    }
  }

  const CHUNK_SIZE = 1000;

  for (let i = 0; i < bulkOps.length; i += CHUNK_SIZE) {
    const chunk = bulkOps.slice(i, i + CHUNK_SIZE);
    await Progress.bulkWrite(chunk, { ordered: false });
    executed += chunk.length;

    const percent = ((executed / bulkOps.length) * 100).toFixed(1);
    logger.info(`🚀 Progress seeded: ${executed}/${bulkOps.length} (${percent}%)`);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  logger.info("✅ Progress seeding completed");
  logger.info(`⏱️ Duration: ${duration}s`);
}

export default progressSeed;
