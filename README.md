# YQMS - Advanced QA/QC Inspection & Translation Platform

A robust, enterprise-grade platform for manufacturing quality management, featuring AI-powered instruction translation, real-time inspection tracking, and automated reporting.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18 or higher
- **Package Manager**: npm or yarn
- **Azure Account**: Required for translation services

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd YQMS-V0.1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (see Developer Configuration).

4. Run the development server (Frontend + Backend):
   ```bash
   npm run dev:all
   ```

---

## 🧠 Instruction Translation Module

The core AI engine of YQMS, designed to localize complex manufacturing instructions with structural precision.

### Key Features
- **4-Step Wizard**: Streamlined workflow from Team Selection to PDF Export.
- **Structural OCR**: Automatically extracts text, tables, and factory stamps from PDF artifacts.
- **Neural Translation**: Leverages Azure Cognitive Services for high-precision manufacturing context.
- **Single-Page Synthesis**: Generates professional A4 PDF exports scaled to fit perfectly on a single page.
- **Glossary Injection**: Support for manual terminology overrides and bulk CSV/Excel glossary imports.

### 📄 Documentation
For a deep dive into the translation architecture, visit the [Instruction Translation Module Reference](./backend/services/translation/TRANSLATION_MODULE.md).

---

## 🛠 Developer Configuration

### Environment Variables (.env)
Create a `.env` file in the root directory (and `/backend` if required) with the following Azure credentials:

```env
# Azure Translation Services
DOCUMENT_TRANSLATION_ENDPOINT="https://<YOUR_RESOURCE>.cognitiveservices.azure.com"
AZURE_TRANSLATOR_KEY="<YOUR_KEY>"
AZURE_TRANSLATOR_REGION="eastus"

# Azure Blob Storage
AZURE_BLOB_CONNECTION_STRING="<YOUR_CONNECTION_STRING>"
AZURE_SOURCE_CONTAINER="instruction-source"
AZURE_TARGET_CONTAINER="instruction-target"

# App Server
PORT=5001
MONGODB_URI="your_mongodb_connection_string"
```

### Required Setup
1. **Azure Resource**: Ensure an "Azure AI Translator" resource is created in your Azure portal.
2. **CORS Headers**: If testing locally, ensure Azure Blob Storage CORS rules allow origins from your development port (usually `5173`).
3. **Database**: A MongoDB instance is required for storing `production` and `document` metadata.

---

## 🏗 Architecture

- **Frontend**: React + Vite + TailwindCSS (for high-performance UI)
- **Backend**: Node.js + Express (Modular controller/service architecture)
- **AI Stack**: Azure Cognitive Services (Translator API) + LLM-based extraction
- **Persistence**: MongoDB + Mongoose

---

## 📜 Available Scripts

- `npm run dev`: Start Vite development server
- `npm run server`: Start Node.js backend with Nodemon
- `npm run dev:all`: Run both frontend and backend concurrently
- `npm run build`: Build for production
- `npm run electron:serve`: Run as an Electron desktop application
