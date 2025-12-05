# System Translator Documentation

## Executive Summary

The **System Translator** is a powerful translation module integrated into the YQMS application. It leverages **Azure Cognitive Services** to provide high-quality translation for both plain text and documents (files) while maintaining formatting.

---

## 👤 End User Guide
*For general users who need to translate text or documents.*

### 1. Accessing the Translator
1.  Log in to the YQMS Dashboard.
2.  Locate the **AI Agent** section.
3.  Click on the **System Translator** card.

### 2. Translating Text
Use this for quick translations of short text snippets.
1.  Select **Text** mode from the top menu.
2.  **Input**: Type or paste the text you want to translate into the left box.
3.  **Language Selection**: Choose your source language (or leave as Auto-Detect) and your target language.
4.  **Translate**: The system will automatically translate as you type (or click Translate if manual).
5.  **Copy**: Click the copy icon to copy the result to your clipboard.

### 3. Translating Files
Use this for full documents (Word, Excel, PDF, PowerPoint). The system preserves the original layout.
1.  Select **File** mode from the top menu.
2.  **Upload**: Drag and drop your file or click to browse.
3.  **Target Language**: Select the language you want the document translated into.
4.  **Glossary (Optional)**: If your admin has set up specific terminology, select a glossary, that purpose is to ensure consistent terminology across all company documents .
5.  **Translate**: Click the **Translate** button.
6.  **Download**: Once completed, the file will appear in the list below. Click the download icon to save it.

### 4. Troubleshooting
-   **"Translation Failed"**: Check your internet connection. If the file is very large, it might take longer.
-   **"Unauthorized"**: You may not have the correct permissions. Contact your Administrator.

---

## 🛡️ Administrator Guide
*For system admins managing access, costs, and glossaries.*

### 1. Azure Resources & Pricing
The system uses the following Azure resources. Monitor these in the Azure Portal to manage costs.

| Resource | Detail | Tier / Configuration |
| :--- | :--- | :--- |
| **Subscription** | Azure AI Subscription | ID: `8d254a15-96ff-442f-bd13-e1ea51a2709a` |
| **Resource Group** | `AIResource01` | Location: `southeastasia` |
| **Translator Service** | Azure AI Translator | **S1 (Standard)** & **F0 (Free)** tiers used. <br> [View Translator Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/translator/) |
| **Storage** | Azure Blob Storage | **Standard Performance**, **LRS** (Locally-redundant storage), **StorageV2**. <br> [View Blob Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/) |

### 2. Managing Access
Access is controlled via User Roles. To grant access to the System Translator:
-   Go to **Role Management**.
-   Assign the role **"Translator"** or **"Admin"** to the user.
-   *Note: "System Administration" role also has access.*

### 3. Managing Glossaries
Ensure consistent terminology across all company documents.
1.  Navigate to **System Translator** > **Glossary Manager**.
2.  **Upload Glossary**: Upload `.tsv` (Tab Separated Values) files containing your specific terms.
3.  **Delete**: Remove outdated glossaries to prevent confusion.

### 4. Monitoring Costs
-   **Cost Estimation**: The system provides an estimated cost before processing large files.
-   **Logs**: Check the translation logs (if enabled) to see usage per user or department.
-   **Cost Tracking Log**: Detailed cost tracking is available in the CSV file located at `logs/translation-costs/translation-costs.csv`. This file records every translation job with the following details:
    -   **Date & Time**: When the translation was performed.
    -   **Job ID**: Unique identifier for the translation job.
    -   **File Name**: Name of the file translated.
    -   **Source/Target Language**: Languages involved in the translation.
    -   **Characters Charged**: The number of characters billed for the translation.
    -   **Cost (USD)**: The calculated cost based on the character count and current Azure rates.
    -   **Status**: Outcome of the translation (e.g., Success, Failed).
-   **Budgeting**: Monitor your Azure subscription usage to ensure you stay within budget.

---

## 💻 Developer Guide
*For developers maintaining or extending the system.*

### 1. Architecture Overview
-   **Frontend**: React (`src/pages/SystemTranslator.jsx`). Uses components in `src/components/system-translator/`.
-   **Backend**: Node.js/Express (`backend/controller/`).
-   **Services**:
    -   **Azure Translator Text API**: For real-time text translation.
    -   **Azure Document Translation API**: For batch file translation.
    -   **Azure Blob Storage**: Stores input/output files and glossaries.

### 2. Environment Configuration
Ensure these variables are set in your `.env` file. These should map to the resources in `AIResource01`.

```env
# Azure Translator (Text)
AZURE_TRANSLATOR_KEY=your_key_here
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
AZURE_TRANSLATOR_REGION=southeastasia

# Azure Translator (Files/Document)
AZURE_TRANSLATOR_KEY_FILE=your_document_translation_key
AZURE_TRANSLATOR_ENDPOINT_FILE=https://your-resource-name.cognitiveservices.azure.com/
AZURE_TRANSLATOR_API_VERSION=2024-05-01

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=sophystorage
AZURE_STORAGE_ACCOUNT_KEY=your_storage_key
AZURE_STORAGE_SOURCE_CONTAINER=inputdocuments
AZURE_STORAGE_TARGET_CONTAINER=documentstraslated
AZURE_STORAGE_GLOSSARY_CONTAINER=glossaries
```

### 3. API Endpoints

#### Text Translation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/translate-text` | Translates plain text. Body: `{ text, from, to }` |

#### File Translation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/translate-files` | Uploads file -> Blob -> Submits Translation Job. |
| `POST` | `/api/translate-files/character-count` | Estimates character count and cost for files. |
| `GET` | `/api/translate-files/list` | Lists files in source/target containers. Query: `?container=all` |
| `GET` | `/api/translate-files/download` | Downloads a specific file from Blob. Query: `?container=...&fileName=...` |
| `DELETE` | `/api/translate-files/delete` | Deletes a file from Blob. Query: `?container=...&fileName=...` |

#### Glossary Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/glossaries/upload` | Uploads a new glossary file. |
| `GET` | `/api/glossaries/list` | Lists all available glossaries. |
| `GET` | `/api/glossaries/:sourceLang/:targetLang` | Gets glossaries for a specific language pair. |
| `GET` | `/api/glossaries/:blobName/entries` | Retrieves entries from a glossary. |
| `POST` | `/api/glossaries/add-entries` | Adds new terms to an existing glossary. |
| `PUT` | `/api/glossaries/:blobName/entries` | Updates existing entries in a glossary. |
| `GET` | `/api/glossaries/:blobName/download` | Downloads the glossary file. |
| `DELETE` | `/api/glossaries/delete` | Deletes a glossary. Query: `?blobName=...` |

### 4. Key Files
-   **Frontend Page**: `src/pages/SystemTranslator.jsx` - Main entry point.
-   **File Controller**: `backend/controller/translate-files/translateFilesController.js` - Handles complex file logic, polling, and cost calc.
-   **Glossary Controller**: `backend/controller/glossaries/glossaryController.js` - CRUD operations for glossaries.
-   **Blob Helper**: `backend/utils/azureBlobHelper.js` - Wrapper for Azure Storage SDK.

### 5. Adding New Roles
To add new roles that can access this feature, update the `roles` array in `src/pages/Home.jsx`:
```javascript
{
  path: "/system-translator",
  roles: ["Admin", "Translator", "NewRole"], // Add new roles here
  // ...
}
```

## 💡 Conclusion

The System Translator is a powerful tool that provides high-quality translation for both plain text and documents while maintaining formatting. It is easy to use and can be extended with new features as needed. 

---

####  Contact

If you have any questions or need assistance, please contact the YAI Support Team .
