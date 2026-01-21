
const request = {
    docId: "DOC-123",
    toLanguages: ["de", "fr"]
};

// Mocks
const mockAzureService = {
    submitTranslationJob: (cid, files, langs) => Promise.resolve("JOB-001"),
    pollTranslationStatus: (id) => Promise.resolve({ status: "Succeeded" }),
    getTranslatedContent: (cid, files, langs) => Promise.resolve([
        { name: "test-de.html", content: "<html>...</html>", toLang: "de" },
        { name: "test-fr.html", content: "<html>...</html>", toLang: "fr" }
    ])
};

console.log("Running simulated test flow...");
async function runTest() {
    try {
        const jobId = await mockAzureService.submitTranslationJob("cust", [], ["de", "fr"]);
        console.log(`Job Submitted: ${jobId}`);
        const status = await mockAzureService.pollTranslationStatus(jobId);
        console.log(`Job Status: ${status.status}`);
        const content = await mockAzureService.getTranslatedContent("cust", [], ["de", "fr"]);
        console.log(`Content Retrieved: ${content.length} files`);
        console.log("Test Passed!");
    } catch (err) {
        console.error("Test Failed", err);
    }
}
runTest();
