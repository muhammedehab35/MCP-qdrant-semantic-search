/**
 * Simple test script to verify the MCP server is working
 * Usage: node test-server.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing MCP Qdrant Semantic Search Server\n');

// Check that compiled file exists
const serverPath = join(__dirname, 'dist', 'index.js');
console.log(`📂 Server path: ${serverPath}\n`);

// Check required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY not defined');
  console.error('   Set it with: set OPENAI_API_KEY=sk-... (Windows)');
  console.error('   Or: export OPENAI_API_KEY=sk-... (macOS/Linux)\n');
  process.exit(1);
}

console.log('✅ OPENAI_API_KEY defined');
console.log(`✅ QDRANT_URL: ${process.env.QDRANT_URL || 'http://localhost:6333'}`);
console.log(`✅ QDRANT_COLLECTION: ${process.env.QDRANT_COLLECTION || 'semantic_memory'}\n`);

console.log('🚀 Starting MCP server...\n');
console.log('⏱️  The server will start and you can see the logs.');
console.log('   Press Ctrl+C to stop.\n');
console.log('─'.repeat(60));

// Start the server
const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
    QDRANT_COLLECTION: process.env.QDRANT_COLLECTION || 'semantic_memory',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
    EMBEDDING_DIMENSIONS: process.env.EMBEDDING_DIMENSIONS || '1536',
  },
  stdio: 'inherit',
});

server.on('error', (error) => {
  console.error('\n❌ Error starting server:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`\n📊 Server stopped with code: ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping server...');
  server.kill('SIGINT');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
