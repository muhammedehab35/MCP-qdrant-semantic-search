#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { EmbeddingService } from './embeddings.js';
import { QdrantService } from './qdrant.js';
import { v4 as uuidv4 } from 'uuid';

// Configuration from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'semantic_memory';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = parseInt(
  process.env.EMBEDDING_DIMENSIONS || '1536',
  10
);

// Configuration validation
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is required');
  process.exit(1);
}

// Initialize services
const embeddingService = new EmbeddingService(
  OPENAI_API_KEY,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS
);
const qdrantService = new QdrantService(
  QDRANT_URL,
  QDRANT_API_KEY,
  COLLECTION_NAME
);

// Initialize collection on startup
try {
  await qdrantService.createCollection(EMBEDDING_DIMENSIONS);
  console.error('✓ MCP Qdrant server initialized successfully');
} catch (error) {
  console.error('Error initializing collection:', error);
  process.exit(1);
}

// MCP tools definition
const tools: Tool[] = [
  {
    name: 'store_memory',
    description:
      'Store information in semantic memory. The information will be indexed and can be retrieved via semantic search.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content to store (text, code, documentation, etc.)',
        },
        metadata: {
          type: 'object',
          description:
            'Optional metadata (tags, category, source, date, etc.)',
          additionalProperties: true,
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'search_memory',
    description:
      'Search for semantically similar information in memory. Returns the most relevant results based on vector similarity.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5,
        },
        threshold: {
          type: 'number',
          description:
            'Minimum similarity score between 0 and 1 (default: 0.7). Higher = stricter',
          default: 0.7,
        },
        filter: {
          type: 'object',
          description:
            'Optional filters to refine search (e.g., {category: "code"})',
          additionalProperties: true,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_memory',
    description:
      'Delete a specific memory by its ID. The ID is returned when storing a memory.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier of the memory to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_memory',
    description:
      'Retrieve a specific memory by its ID with all its details.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier of the memory to retrieve',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_memories',
    description:
      'List all stored memories with pagination. Useful for exploring database content.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of memories to return (default: 10)',
          default: 10,
        },
        offset: {
          type: 'string',
          description: 'Starting ID for pagination (optional)',
        },
      },
    },
  },
  {
    name: 'get_stats',
    description:
      'Get statistics about the memory collection (total count, status, etc.).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'clear_all_memories',
    description:
      'Delete ALL memories from the collection. ⚠️ Warning: this action is irreversible!',
    inputSchema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Must be "true" to confirm deletion',
        },
      },
      required: ['confirm'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'qdrant-semantic-search',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler to list available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handler to execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'store_memory': {
        const { content, metadata = {} } = args as {
          content: string;
          metadata?: Record<string, any>;
        };

        // Generate content embedding
        const vector = await embeddingService.generateEmbedding(content);

        // Generate unique ID
        const id = uuidv4();

        // Prepare payload with timestamp
        const payload = {
          content,
          timestamp: new Date().toISOString(),
          ...metadata,
        };

        // Store in Qdrant
        await qdrantService.storeMemory(id, vector, payload);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Memory stored successfully',
                  id,
                  content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                  metadata,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'search_memory': {
        const { query, limit = 5, threshold = 0.7, filter } = args as {
          query: string;
          limit?: number;
          threshold?: number;
          filter?: Record<string, any>;
        };

        // Generate query embedding
        const queryVector = await embeddingService.generateEmbedding(query);

        // Search in Qdrant
        const results = await qdrantService.searchSimilar(
          queryVector,
          limit,
          threshold,
          filter
        );

        // Format results
        const formattedResults = results.map((result) => ({
          id: result.id,
          score: result.score,
          content: result.payload?.content,
          metadata: result.payload,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  query,
                  results_count: formattedResults.length,
                  results: formattedResults,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'delete_memory': {
        const { id } = args as { id: string };

        await qdrantService.deleteMemory(id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Memory ${id} deleted successfully`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_memory': {
        const { id } = args as { id: string };

        const memory = await qdrantService.getMemory(id);

        if (!memory) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    message: `Memory ${id} not found`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  memory: {
                    id: memory.id,
                    payload: memory.payload,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_memories': {
        const { limit = 10, offset } = args as {
          limit?: number;
          offset?: string;
        };

        const memories = await qdrantService.listMemories(limit, offset);

        const formattedMemories = memories.map((memory) => ({
          id: memory.id,
          content: memory.payload?.content,
          timestamp: memory.payload?.timestamp,
          metadata: memory.payload,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  count: formattedMemories.length,
                  memories: formattedMemories,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_stats': {
        const stats = await qdrantService.getStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  stats,
                  embedding_model: embeddingService.getModel(),
                  embedding_dimensions: embeddingService.getDimensions(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'clear_all_memories': {
        const { confirm } = args as { confirm: boolean };

        if (!confirm) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    message:
                      'You must confirm with confirm=true to delete all memories',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        await qdrantService.clearAllMemories();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'All memories have been deleted',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP Qdrant Semantic Search server started');
  console.error(`📊 Collection: ${COLLECTION_NAME}`);
  console.error(`🔗 Qdrant URL: ${QDRANT_URL}`);
  console.error(`🤖 Embedding model: ${EMBEDDING_MODEL}`);
  console.error(`📐 Dimensions: ${EMBEDDING_DIMENSIONS}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
