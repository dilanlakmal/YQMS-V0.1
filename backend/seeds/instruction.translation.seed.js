import { Progress } from "../models/instruction/index.js";
import { UserProd, UserMain } from "../controller/MongoDB/dbConnectionController.js";
import { Content, Language } from "../models/translation/index.js";

let User = UserProd;
if (process.env.NODE_ENV === "development") {
  User = UserMain;
}

const steps = [
  { title: 'Select Team', description: 'Choose your department', icon: "Users", status: "active" },
  { title: 'Insert PDF', description: 'Upload instruction file', icon: "FileText", status: "inactive" },
  { title: 'Configure', description: 'Language & Glossary', icon: "Globe", status: "inactive"},
  { title: 'Finalize', description: 'Export PDF', icon: "Award", status: "inactive" },
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

  for (const step of steps) {
    const contents = [
      step.title,
      step.description,
    ];

    for (const text of contents) {
      const doc = await Content.findOneAndUpdate(
        {original: text, language_id: language._id},
        {$setOnInsert: {original: text, language_id: language._id, translated: false}},
        {upsert: true, new: true}
      );
      contentMap.set(text, doc._id);
    }
  }
  
  logger.info(`📚 Content ready (${contentMap.size} items)`); 
  logger.info("⚙️ Preparing progress bulk operations…");

  const totalOps = users.length * steps.length;
  logger.info(`🧮 Expected progress records: ${totalOps}`);

  for (const user of users) {
    for (const step of steps) {
      bulkOps.push({
        updateOne: {
          filter: {
            user_id: user._id,
            title: contentMap.get(step.title),
            description: contentMap.get(step.description),
          },
          update: {
            $set: {status: step.status, icon: step.icon}
          },
          upsert: true,
        }
      })
    }
  }

  const CHUNK_SIZE = 1000;

  for (let i = 0; i < bulkOps.length; i += CHUNK_SIZE) {
    const chunk = bulkOps.slice(i, i + CHUNK_SIZE);
    await Progress.bulkWrite(chunk, {ordered: false});
    executed += chunk.length;
    const percent = ((executed / bulkOps.length) * 100).toFixed(1);
    logger.info(
      `🚀 Progress seeded: ${executed}/${bulkOps.length} (${percent}%)`
    );
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  logger.info("✅ Progress seeding completed");
  logger.info(`⏱️ Duration: ${duration}s`);
  
}

export default progressSeed;
