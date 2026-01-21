
# Translation Module Documentation

## Overview
This module handles the end-to-end translation of instruction documents using **Azure Cognitive Services (Translator)**. It converts complex nested JSON data into HTML, manages file transfers to Azure Blob Storage, orchestrates the translation job, and reconstructs the data back into JSON.

## Architecture

The module is refactored into a layered architecture:

- **Controller (`backend/controller/production/instruction/translation.controller.js`)**: Orchestrates the workflow. Validates input, calls services, and handles HTTP responses.
- **Service (`backend/services/translation/azure.translator.service.js`)**: Encapsulates the core translation business logic (Submit -> Poll -> Retrieve).
- **Storage (`backend/storage/azure.blob.storage.js`)**: Manages physical interactions with Azure Blob Storage (Upload, Download, standard SAS generation).
- **Utils**:
  - `backend/Utils/translation/file.convertor.js`: Pure functions for JSON-HTML flattening and reconstruction.
  - `backend/Utils/translation/logger.js`: Centralized structured logging.
- **Config (`backend/Config/translation.config.js`)**: Centralized configuration management using `process.env`.

## Process Flow

1.  **Request**: POST API received with `docId` and `toLanguages`.
2.  **Validation**: Check inputs; retrieve Document & Instruction from DB.
3.  **Flattening**: `flattenLocalizedStrings` converts nested JSON to flat key-value pairs. `generateHtmlFromEntries` creates an HTML file where `id` = key.
4.  **Submission**:
    - HTML uploaded to `source` container.
    - Translation Job submitted to Azure Batch API with SAS tokens.
5.  **Polling**: System polls Azure every 5s (configurable) until `Succeeded` or `Failed`.
6.  **Retrieval**: Translated HTMLs downloaded from `target` container.
7.  **Reconstruction**: `reconstructObjectFromHtml` parses HTML back to text and `deepMergeObjects` updates the original JSON.
8.  **Update**: Database updated with new translations.

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
