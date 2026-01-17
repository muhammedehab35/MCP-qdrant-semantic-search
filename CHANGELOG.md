# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-17

### Added
- Initial release of MCP Qdrant Semantic Search server
- 7 MCP tools implementation:
  - `store_memory` - Store information with semantic indexing
  - `search_memory` - Search by semantic similarity
  - `delete_memory` - Delete a memory by ID
  - `get_memory` - Retrieve a specific memory
  - `list_memories` - List all memories with pagination
  - `get_stats` - Get collection statistics
  - `clear_all_memories` - Delete all memories
- OpenAI embeddings integration
- Qdrant vector database client
- TypeScript implementation with full type safety
- Docker Compose configuration for Qdrant
- Comprehensive English documentation
- Test script for server validation
- MIT License

### Technical Details
- TypeScript 5.7
- Node.js 18+
- Qdrant 1.12
- OpenAI API integration
- MCP SDK 1.0.4

### Documentation
- Complete README.md
- Installation guide
- Usage examples
- Configuration details
- Troubleshooting section

[1.0.0]: https://github.com/muhammedehab35/MCP-qdrant-semantic-search/releases/tag/v1.0.0
