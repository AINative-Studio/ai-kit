# Research Assistant Agent

An AI-powered research assistant that conducts multi-step research workflows with web search integration, citation generation, and export capabilities.

## Features

- **Multi-step Research Workflow**: Automated research process including web search, content analysis, section generation, citation creation, and summary generation
- **Web Search Integration**: Intelligent web search with relevance scoring
- **Citation Generation**: Automatic citation generation in APA, MLA, and Chicago formats
- **Export to Multiple Formats**: Export research reports to PDF, DOCX, Markdown, and HTML
- **Real-time Execution Monitoring**: Track research progress with live updates
- **Metrics Dashboard**: View token usage, costs, and execution duration

## Architecture

### Agent Components

1. **ResearchAgent**: Main agent orchestrating the research workflow
2. **Web Search Tool**: Searches the web for relevant information
3. **Citation Tool**: Generates properly formatted citations
4. **Summary Tool**: Creates concise summaries of content

### Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Agent Framework**: AI Kit Core
- **Export**: pdf-lib, docx, marked

## Installation

```bash
# Install dependencies
npm install

# Or with pnpm
pnpm install
```

## Configuration

Create a `.env.local` file:

```env
# AI Provider API Key
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Custom API endpoints
SEARCH_API_URL=your_search_api_url
```

## Running the Application

### Development Mode

```bash
npm run dev
# Application will be available at http://localhost:3001
```

### Production Build

```bash
npm run build
npm run start
```

## Usage

1. **Enter Research Topic**: Type your research topic in the form
2. **Select Research Depth**: Choose basic (3 sources), intermediate (5 sources), or comprehensive (10 sources)
3. **Adjust Number of Sources**: Use the slider to fine-tune the number of sources
4. **Start Research**: Click "Start Research" to begin the automated research process
5. **Monitor Progress**: Watch the execution monitor for real-time progress updates
6. **View Results**: Review the generated research report with sections and citations
7. **Export Results**: Export your research to PDF, DOCX, Markdown, or HTML format

## API Endpoints

### POST /api/research

Conduct research on a given topic.

**Request Body:**
```json
{
  "topic": "Artificial Intelligence",
  "depth": "intermediate",
  "sources": 5,
  "includeImages": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "Artificial Intelligence",
    "summary": "...",
    "sections": [...],
    "citations": [...],
    "generatedAt": "2025-01-20T...",
    "tokensUsed": 5000,
    "costUsd": 0.05
  },
  "metrics": {
    "tokensUsed": 5000,
    "costUsd": 0.05,
    "durationMs": 12000,
    "steps": 5
  }
}
```

### POST /api/export

Export research results to various formats.

**Request Body:**
```json
{
  "format": "pdf",
  "data": { ... }
}
```

**Supported Formats:**
- `pdf`: PDF document
- `docx`: Microsoft Word document
- `markdown`: Markdown file
- `html`: HTML document

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t research-assistant .

# Run container
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=your_key research-assistant
```

### Vercel

```bash
# Deploy to Vercel
vercel deploy
```

### Railway

```bash
# Deploy to Railway
railway up
```

## Configuration Options

### Research Depth Levels

- **Basic**: 3 sources, quick overview
- **Intermediate**: 5 sources, balanced depth (default)
- **Comprehensive**: 10 sources, in-depth analysis

### Agent Configuration

Customize the agent in `src/agents/research-agent.ts`:

```typescript
const agent = new AgentExecutor({
  name: 'ResearchAssistant',
  model: 'claude-sonnet-4',
  temperature: 0.7,
  maxIterations: 10,
  tools: [webSearchTool, citationTool, summaryTool],
});
```

## Performance Optimization

- Results are cached for 15 minutes
- Web search results are deduplicated
- Parallel processing for independent steps
- Token usage optimization

## Security

- Input validation with Zod schemas
- Rate limiting on API endpoints
- Sanitized user inputs
- CORS protection

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure `ANTHROPIC_API_KEY` is set in `.env.local`
2. **Port Conflicts**: Change port in `package.json` scripts if 3001 is in use
3. **Export Failures**: Ensure sufficient disk space for generated files

## Contributing

Contributions are welcome! Please see the main AI Kit contributing guidelines.

## License

MIT - See LICENSE file for details

## Support

- GitHub Issues: Report bugs and request features
- Documentation: See the main AI Kit documentation
- Email: support@ainative.studio
