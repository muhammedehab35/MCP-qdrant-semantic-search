# 🧠 MCP Qdrant Semantic Search

A **Model Context Protocol (MCP)** server that gives Claude persistent semantic memory via Qdrant, a high-performance vector database.

## 🎯 What is this?

This MCP server allows Claude to:
- 💾 **Store information** with semantic search capabilities
- 🔍 **Retrieve content** based on meaning, not just keywords
- 🧠 **Remember** conversations, code, documentation
- 🎯 **Intelligently search** through a knowledge base

### Real-World Use Cases

- **Semantic Code Search**: "Find me code that handles JWT authentication"
- **Team Knowledge Base**: Store and retrieve procedures, best practices
- **Conversational Memory**: Claude remembers preferences and context
- **Smart Documentation**: Retrieve docs even with different phrasing

## ✨ Features

### 7 Available MCP Tools

| Tool | Description |
|------|-------------|
| `store_memory` | Store information with semantic indexing |
| `search_memory` | Search by semantic similarity |
| `delete_memory` | Delete a memory by ID |
| `get_memory` | Retrieve a specific memory |
| `list_memories` | List all memories with pagination |
| `get_stats` | Get collection statistics |
| `clear_all_memories` | Delete all memories |

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Claude    │ ◄─MCP──►│  MCP Server  │ ◄─────► │   Qdrant    │
│   Desktop   │         │  (TypeScript)│         │  Vector DB  │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │    OpenAI    │
                        │  Embeddings  │
                        └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker
- OpenAI API Key
- Claude Desktop

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start Qdrant
docker-compose up -d

# 4. Build the project
npm run build

# 5. Configure Claude Desktop
# See INSTALL.md for details
```

For complete installation, see [INSTALL.md](INSTALL.md).

## 📖 Usage

### Examples in Claude Desktop

#### 1. Store Information

```
Store this information: "Our API uses JWT for authentication.
Tokens expire after 24h and must be renewed via /refresh-token"
```

Response:
```json
{
  "success": true,
  "message": "Memory stored successfully",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "content": "Our API uses JWT for authentication..."
}
```

#### 2. Semantic Search

```
Search for how to handle user sessions
```

Claude will use `search_memory` and find the JWT information even if the exact words don't match!

#### 3. Store Code with Metadata

```
Store this code with tags "authentication" and "nodejs":

function validateToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

#### 4. Advanced Search with Filters

```
Search for authentication code, only JavaScript snippets
```

Claude can use filters to refine the search.

#### 5. Get Statistics

```
Show me my semantic memory stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "name": "semantic_memory",
    "points_count": 42,
    "status": "green"
  },
  "embedding_model": "text-embedding-3-large",
  "embedding_dimensions": 1536
}
```

## 🎓 Key Concepts

### Embeddings (Vectors)

Embeddings transform text into numerical vectors that capture **semantic meaning**.

```python
# Conceptual
"JWT authentication" → [0.234, -0.567, 0.891, ..., 0.123]
"Token security"     → [0.219, -0.543, 0.876, ..., 0.134]
# These two vectors are close = similar meaning!
```

### Cosine Similarity

Qdrant uses cosine similarity to measure "semantic proximity" between two vectors.

- **Score 1.0**: Identical
- **Score 0.8-0.9**: Very similar
- **Score 0.7**: Similar (default threshold)
- **Score < 0.7**: Less similar

### Collections

A collection is like a database table, but optimized for vectors.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API Key (required) | - |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` |
| `QDRANT_API_KEY` | Qdrant Cloud API Key (optional) | - |
| `QDRANT_COLLECTION` | Collection name | `semantic_memory` |
| `EMBEDDING_MODEL` | OpenAI model | `text-embedding-3-large` |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | `1536` |

### Available Embedding Models

| Model | Dimensions | Cost | Accuracy |
|-------|------------|------|----------|
| `text-embedding-3-small` | 1536 | $ | ⭐⭐⭐ |
| `text-embedding-3-large` | 3072 | $$$ | ⭐⭐⭐⭐⭐ |

## 📊 MCP API

### store_memory

```typescript
{
  content: string,      // Content to store
  metadata?: {          // Optional metadata
    tags?: string[],
    category?: string,
    source?: string,
    // ... other fields
  }
}
```

### search_memory

```typescript
{
  query: string,        // Natural language query
  limit?: number,       // Number of results (default: 5)
  threshold?: number,   // Min score 0-1 (default: 0.7)
  filter?: object       // Metadata filters
}
```

### delete_memory

```typescript
{
  id: string           // Memory ID
}
```

### get_memory

```typescript
{
  id: string           // Memory ID
}
```

### list_memories

```typescript
{
  limit?: number,      // Number of results (default: 10)
  offset?: string      // Starting ID for pagination
}
```

### get_stats

No parameters. Returns collection statistics.

### clear_all_memories

```typescript
{
  confirm: boolean     // Must be true to confirm
}
```

## 🧪 Advanced Examples

### 1. Team Knowledge Base

```
Store these:

1. "Staging server accessible via staging.example.com,
    port 3000, credentials in 1Password"

2. "To deploy to production, use 'npm run deploy:prod'
    after tests pass and PR approval"

3. "Rate limiting is 1000 req/min per API key,
    10000/min for enterprise clients"
```

Then search:
```
How do I deploy to production?
What are the API limits?
```

### 2. Semantic Code Search

```
Store this code:

// Metadata: language=javascript, topic=authentication
async function authenticateUser(email, password) {
  const user = await db.users.findByEmail(email);
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  return generateJWT(user);
}
```

Search:
```
How to verify user credentials?
Show me login code
```

### 3. Conversational Memory

```
Store my preferences:
- I prefer TypeScript over JavaScript
- I use React 18 with hooks
- My code style follows Airbnb ESLint
- I want JSDoc comments on public functions
```

Claude will remember this in future conversations!

## 🔍 Advanced Features

### Hybrid Search (Vector + Filters)

```typescript
// In Claude
Search for authentication code,
only Python snippets created after 2024-01-01
```

The server can combine semantic search with metadata filters.

### Chunking for Large Documents

For storing large documents, split into chunks:

```javascript
const chunkSize = 500; // words
const chunks = splitIntoChunks(document, chunkSize);

for (const chunk of chunks) {
  await storeMemory({
    content: chunk,
    metadata: {
      document_id: "doc-123",
      chunk_index: i,
      total_chunks: chunks.length
    }
  });
}
```

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY is required"

Check that the API key is defined in the Claude Desktop config file.

### Qdrant Connection Error

```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart if needed
docker-compose restart
```

### Empty Search Results

- Lower the `threshold` (e.g., 0.5 instead of 0.7)
- Check if there's data: `get_stats`
- Rephrase the query

### High OpenAI Costs

- Use `text-embedding-3-small` (5x cheaper)
- Reduce dimensions to 512 or 1024
- Cache frequent embeddings

## 🚀 Future Improvements

- [ ] Support for Ollama (free local embeddings)
- [ ] Web interface for visualizing memories
- [ ] Collection export/import
- [ ] Multi-modal support (images + text)
- [ ] History-based recommendations
- [ ] Automatic memory clustering
- [ ] Analytics and search insights

## 📚 Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [INSTALL.md](INSTALL.md) - Detailed installation guide

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or suggestions
- Submit Pull Requests
- Improve documentation

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Model Context Protocol
- [Qdrant](https://qdrant.tech/) for the vector database
- [OpenAI](https://openai.com/) for embedding models

---

**Note**: This project is for educational and demonstration purposes. For production use, consider security, scalability, and costs.

Made with ❤️ to learn MCP and semantic search
