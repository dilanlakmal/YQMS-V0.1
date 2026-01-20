
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from CWD (root)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log("Loading env from:", envPath);
console.log("URI available:", !!process.env.MONGODB_URI);

const glossaryTermSchema = new mongoose.Schema({
    source: String,
    target: String,
    sourceLang: String,
    targetLang: String,
    domain: String,
    verificationStatus: String
}, { collection: 'glossaryterms' }); // Precise collection name

const GlossaryTerm = mongoose.model('GlossaryTerm', glossaryTermSchema);

async function checkTerm() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from .env");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        const term = "check";
        // Case insensitive search for "check"
        const results = await GlossaryTerm.find({
            source: { $regex: new RegExp(`^${term}$`, 'i') },
            sourceLang: 'en'
        });

        console.log(`\n🔎 Search results for '${term}' (Global search):`);
        if (results.length === 0) {
            console.log("   No matches found.");
        } else {
            results.forEach(t => {
                console.log(`   found: "${t.source}" -> "${t.target}" [${t.verificationStatus}] (Lang: ${t.targetLang}, Domain: ${t.domain})`);
            });
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTerm();
