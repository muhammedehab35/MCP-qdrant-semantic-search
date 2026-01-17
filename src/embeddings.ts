import OpenAI from 'openai';

/**
 * Service to generate embeddings with OpenAI
 */
export class EmbeddingService {
  private openai: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(
    apiKey: string,
    model: string = 'text-embedding-3-large',
    dimensions: number = 1536
  ) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
    this.dimensions = dimensions;
  }

  /**
   * Generate an embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Get the embedding dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Get the model being used
   */
  getModel(): string {
    return this.model;
  }
}
