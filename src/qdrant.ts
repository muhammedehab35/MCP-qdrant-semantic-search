import { QdrantClient } from '@qdrant/js-client-rest';

// Type for points returned by Qdrant
type QdrantPoint = {
  id: string | number;
  payload?: Record<string, any> | null;
  vector?: any;
  score?: number;
  version?: number;
  [key: string]: any;
};

/**
 * Service to interact with Qdrant
 */
export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;

  constructor(url: string, apiKey: string | undefined, collectionName: string) {
    this.client = new QdrantClient({
      url,
      apiKey: apiKey || undefined,
    });
    this.collectionName = collectionName;
  }

  /**
   * Create a collection if it doesn't exist
   */
  async createCollection(vectorSize: number = 1536): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: vectorSize,
            distance: 'Cosine', // Cosine similarity for semantic search
          },
        });
        console.error(`Collection "${this.collectionName}" created successfully`);
      } else {
        console.error(`Collection "${this.collectionName}" already exists`);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Store a memory (point) in the collection
   */
  async storeMemory(
    id: string,
    vector: number[],
    payload: Record<string, any>
  ): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id,
            vector,
            payload,
          },
        ],
      });
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Search for similar memories
   */
  async searchSimilar(
    queryVector: number[],
    limit: number = 5,
    scoreThreshold: number = 0.7,
    filter?: Record<string, any>
  ): Promise<QdrantPoint[]> {
    try {
      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
        filter,
      });

      return results;
    } catch (error) {
      console.error('Error during search:', error);
      throw error;
    }
  }

  /**
   * Delete a memory by its ID
   */
  async deleteMemory(id: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: [id],
      });
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve a memory by its ID
   */
  async getMemory(id: string): Promise<QdrantPoint | null> {
    try {
      const results = await this.client.retrieve(this.collectionName, {
        ids: [id],
        with_payload: true,
        with_vector: false,
      });

      return results.length > 0 ? (results[0] as QdrantPoint) : null;
    } catch (error) {
      console.error('Error retrieving memory:', error);
      throw error;
    }
  }

  /**
   * Get the total number of points in the collection
   */
  async getCount(): Promise<number> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return info.points_count || 0;
    } catch (error) {
      console.error('Error counting points:', error);
      throw error;
    }
  }

  /**
   * List all memories (with pagination)
   */
  async listMemories(
    limit: number = 10,
    offset?: string
  ): Promise<QdrantPoint[]> {
    try {
      const results = await this.client.scroll(this.collectionName, {
        limit,
        offset,
        with_payload: true,
        with_vector: false,
      });

      return results.points as QdrantPoint[];
    } catch (error) {
      console.error('Error listing memories:', error);
      throw error;
    }
  }

  /**
   * Delete all memories from the collection
   */
  async clearAllMemories(): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {},
      });
    } catch (error) {
      console.error('Error clearing all memories:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return {
        name: this.collectionName,
        points_count: info.points_count,
        indexed_vectors_count: info.indexed_vectors_count,
        segments_count: info.segments_count,
        status: info.status,
      };
    } catch (error) {
      console.error('Error retrieving stats:', error);
      throw error;
    }
  }
}
