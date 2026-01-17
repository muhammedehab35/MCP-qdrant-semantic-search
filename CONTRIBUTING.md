# Contributing to MCP Qdrant Semantic Search

Thank you for your interest in contributing to this project! 🎉

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:
- A clear description of the feature
- Why it would be useful
- Any implementation ideas you have

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm run build`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Development Setup

```bash
# Clone the repository
git clone https://github.com/muhammedehab35/MCP-qdrant-semantic-search.git
cd MCP-qdrant-semantic-search

# Install dependencies
npm install

# Start Qdrant
docker-compose up -d

# Build the project
npm run build

# Test the server
node test-server.js
```

## 🎨 Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Add comments for complex logic
- Use meaningful variable names
- Keep functions small and focused

## ✅ Checklist

Before submitting a PR, make sure:

- [ ] Code compiles without errors (`npm run build`)
- [ ] All existing functionality still works
- [ ] New features are documented
- [ ] Code follows project style
- [ ] Commit messages are clear

## 📚 Resources

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution helps make this project better. Thank you for taking the time to contribute!
