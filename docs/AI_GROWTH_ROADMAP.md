# YQMS AI & Chatbot Growth Roadmap

This document outlines the architecture for the growth of AI capabilities within the YQMS project, enabling support for multi-frameworks (LangChain, Rasa, Ollama, HuggingFace), system-wide Tool Use, and Retrieval-Augmented Generation (RAG).

## 1. Modular AI Architecture
Located in `backend/modules/ai/`, the system is divided into functional domains:

- **Orchestrator**: The "Hub" that connects to different LLM providers (Ollama, OpenAI, etc.).
- **Tools**: The "Hands" of the AI. Allows the chatbot to execute system functions (e.g., fetch MO numbers, check stock).
- **Knowledge**: The "Memory" of the AI. Uses RAG to search through module documentation or historical data.
- **Agents**: The "Brain" that coordinates Orchestrator, Tools, and Knowledge to solve complex user tasks.

---

## 2. How the Chatbot Grows
The chatbot is no longer just a "text-in, text-out" system. It grows by:

### A. Modular Tool Injection
To let the AI "read" or interact with a new module (e.g., **Cutting**), follow these steps:
1. Create a handler in `tools/handlers/cutting.handlers.js`.
2. Define the tool schema in `tools/definitions/cutting.definitions.js`.
3. Register it in `tools/index.js`.
4. *Result*: The chatbot can now answer questions like "How many panels were cut for MO-123 today?" by calling your specific handler.

### B. RAG (Retrieval Augmented Generation)
To help the AI learn about the business logic of each module:
1. Upload module manuals or documentation to the `uploads/docs` folder.
2. Use the `knowledge/loaders` to ingest these into the Vector Database.
3. *Result*: When a user asks "What is the procedure for B-Grade handling?", the AI searches the documentation first and provides an accurate, grounded answer.

---

## 3. Supporting Multiple Frameworks
The **Provider Pattern** in `orchestrator/providers/` allows seamless switching:
- **Ollama**: Default for local, privacy-focused execution.
- **LangChain**: Use for complex chains and sophisticated memory.
- **HuggingFace**: Integrated for specialized models (e.g., translation-optimized models).
- **Rasa**: Integrated for structured, intent-based flow control.

---

## 4. Growth of Instruction Translation
The translation engine can grow from simple text-substitution to an **AI-Agent workflow**:
1. **Term-Aware Translation**: Using the `Tools` system to look up specific garment terminology from a YQMS glossary DB before translating.
2. **Multi-Modal Analysis**: Using `analyzeImage` (Visual LLM) to look at diagrams in the instructions and generate descriptive Khmer/English labels automatically.
3. **Automated QC**: A secondary LLM agent reviews the translated output against the original to ensure no technical specifications were altered.

---

## 5. Directory Structure for Maintenance
```text
backend/modules/ai/
├── orchestrator/          # (Hub) Provider management
├── tools/                 # (Hands) Function calling logic
│   ├── definitions/       # JSON Schemas
│   └── handlers/          # System logic
├── knowledge/             # (Memory) RAG / Vector store
└── agents/                # (Brain) Task-specific coordination
```
