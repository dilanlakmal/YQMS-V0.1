
# Translation Module Documentation

## Overview
This module handles the end-to-end translation of instruction documents using **Azure Cognitive Services (Translator)**. It converts complex nested JSON data into HTML, manages translation jobs, and re-synthesizes the result into a clean, single-page A4 PDF output.

## Architecture & Streamlined Workflow

The application follows a 4-step wizard process:
1. **Team Selection**: Loads specific GPRT architectural templates.
2. **Document Upload**: Extraction of text and high-res assets from source PDFs.
3. **Language Configuration**: Selection of target languages (english, chinese, khmer) and glossary injection.
4. **Finalize & Export**: Multi-language preview and single-page PDF generation.

## Process Flow

1.  **Request**: POST API received with `docId` and full language names (e.g., `chinese`).
2.  **Flattening**: JSON converted to HTML keys for block-based translation.
3.  **Submission**: HTML translation job submitted to Azure Batch API.
4.  **Retrieval**: Translated content merged into the `production` state.
5.  **Synthesis**: Frontend uses `html2canvas` and `jsPDF` to scale the document into a high-quality single-page A4 PDF.
6.  **Export**: Correct language version is saved as a PDF locally by the user.

## Configuration

Ensure `.env` contains:

```env
DOCUMENT_TRANSLATION_ENDPOINT="https://<YOUR_RESOURCE>.cognitiveservices.azure.com"
AZURE_TRANSLATOR_KEY="<YOUR_KEY>"
AZURE_TRANSLATOR_REGION="eastus"
AZURE_BLOB_CONNECTION_STRING="<YOUR_CONNECTION_STRING>"
AZURE_SOURCE_CONTAINER="instruction-source"
AZURE_TARGET_CONTAINER="instruction-target"
```

## Logging

Structured logging is used. Logs appear in the console in JSON format.
Example:
```json
{"timestamp":"...","level":"INFO","message":"Starting translation job","customerId":"123","fileCount":1}
```

## Error Handling

- **API Errors**: Caught in Controller, returns 500 with message.
- **Polling**: Retries on network glitches; times out after 2 minutes (default).
- **Storage**: Errors (e.g., container not found) are logged and thrown.

## Testing

### Unit Testing
Use `jest` to test `file.convertor.js` (pure logic).

### Integration Testing
Use `test_simulation.js` to simulate the service flow with logic mocks.

```bash
node backend/services/translation/test_simulation.js
```
