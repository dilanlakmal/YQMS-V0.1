/**
 * Base Class for Vector Stores.
 * This can grow into Pinecone, Weaviate, or local FAISS (via LangChain).
 */
class BaseVectorStore {
    async addDocuments(documents) {
        throw new Error("Method 'addDocuments' not implemented");
    }

    async search(query, limit = 5) {
        throw new Error("Method 'search' not implemented");
    }
}

export default BaseVectorStore;
