## Azure SAS Token Implementation Guide

This document outlines the step-by-step implementation of **On-Demand Sas (Shared Access Signature) Token** generation in this System Translation Agent.

### 1. Prerequisites  

Ensure the following environment variables are set in the .env file. These are the "Master key" used to sign the temporary tokens.

```env
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_primary_key
AZURE_STORAGE_SOURCE_CONTAINER=inputdocuments
AZURE_STORAGE_TARGET_CONTAINER=documentstraslated
```
### 2. Install Dependencies

We use official Azure SDK for JavaScript

```bash
npm install @azure/storage-blob
```

### 3. Create the SAS  helper Module

Create [backend/AISystemUtils/system-translate/azureBlobHelper.js](file:///d:/YorkMars/YQMS-V0.1/backend/AISystemUtils/system-translate/azureBlobHelper.js) This module will acts as the "factory" for creating tokens.

#### Functions Implemented
##### A. Import SDK components

    ```javascript
import { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerSASPermissions
} from "@azure/storage-blob";
```

##### B. Generate Blob SAS (For Single File Access)
This function creates a token that grants access to **one specific file**

```javascript
export const generateBlobSAS = (containerName, blobName, storageAccountName, storageAccountKey, permissions, expiresInHours = 24) => {
  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
  
  // Set expiration time
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + expiresInHours);

  // Generate parameters
  const sasQueryParams = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: permissions, // passed from controller (e.g., "r" for read)
      expiresOn
    },
    sharedKeyCredential
  );

  return sasQueryParams.toString();
};
```
##### C. Generate Container SAS (For Batch Output)

This function create a token that grants access to **entire folder** (container). This is usually needed for output directory of batch translation job.

```javascript
export const generateContainerSAS = async (containerName, storageAccountName, storageAccountKey, permissions, expiresInHours = 24) => {
  // ... Code to initialize client ...
  
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + expiresInHours);

  const sasUrl = await containerClient.generateSasUrl({
    permissions: permissions, // passed from controller (e.g., "wl" for write+list)
    expiresOn: expiresOn
  });

  return sasUrl.split('?')[1]; // Return only the token part
};
```
### 4. Implementing Controller Logics

In [backend/controller/translate-files/translateFilesController.js](file:///d:/YorkMars/YQMS-V0.1/backend/controller/translate-files/translateFilesController.js), use the helpers to generate tokens *just in time*.

#### Step-by-Step Flow in Controller

1.  **Load Credentials**: Read account name/key from `process.env`.
2.  **Generate Target Token (Write Access)**:
    The Azure Translation Service needs to write the translated files to your target container.
    ```javascript
    const targetContainerSas = await getContainerSASUrl(
        targetContainerName,
        storageAccountName,
        storageAccountKey,
        ContainerSASPermissions.parse("wl"), // wl = Write + List
        24 // Valid for 24 hours
    );
    ```
3.  **Generate Source Token (Read Access)**:
    For *each* file you want to translate, generate a specific Read-Only token.
    ```javascript
    const sourceBlobSas = getBlobSASUrl(
        sourceContainerName,
        blobName, // Specific file name
        storageAccountName,
        storageAccountKey,
        BlobSASPermissions.parse("r"), // r = Read only
        24
    );
    ```
4.  **Construct URLs**:
    Combine the Blob URL with the SAS Token.
    `https://<account>.blob.core.windows.net/<container>/<blob>?<sas_token>`

5.  **Send to Azure**:
    Pass these secure URLs to the Azure Translator API. Azure uses these tokens to download your source (Read) and upload the result (Write).

## 5. Security Summary

| Component | scope | Permission | Implementation |
| :--- | :--- | :--- | :--- |
| **Source Token** | Single File | **Read ("r")** | [generateBlobSAS](file:///d:/YorkMars/YQMS-V0.1/backend/AISystemUtils/system-translate/azureBlobHelper.js#61-81) |
| **Target Token** | Container | **Write+List ("wl")** | [generateContainerSAS](file:///d:/YorkMars/YQMS-V0.1/backend/AISystemUtils/system-translate/azureBlobHelper.js#32-60) |
| **Expiration** | Temporary | **24 Hours** | `expiresInHours` arg |

This implementation ensures that even if you pass a URL to an external service (Azure), that service only has limited access for a limited time.
