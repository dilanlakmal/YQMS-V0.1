
import documentImageService from "./backend/services/DocumentImageService.js";
import path from "path";
import fs from "fs/promises";

async function run() {
    // ID from list_dir output
    const fileId = "fb685782-db38-4d01-82a6-6abd32dea5aa";
    const filePath = path.resolve("uploads/documents", `${fileId}.pdf`);

    console.log(`Trying to render: ${filePath}`);
    try {
        const buffer = await documentImageService.renderPage(filePath, 1);
        console.log(`Success! Buffer size: ${buffer.length}`);
        await fs.writeFile("debug_output.png", buffer);
        console.log("Saved debug_output.png");
    } catch (e) {
        console.error("Render failed:", e);
        await fs.writeFile("error_stack.txt", e.stack || e.toString());
    } finally {
        await documentImageService.close();
    }
}

run();
