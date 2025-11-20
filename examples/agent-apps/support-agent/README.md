# Customer Support Agent

Multi-agent customer support system with intelligent ticket routing, sentiment analysis, and knowledge base integration.

## Features

- **Multi-Agent System**: Router agent + specialist agents (technical, billing, account, general)
- **Intelligent Routing**: Automatic ticket classification and routing
- **Sentiment Analysis**: Detect customer sentiment and prioritize accordingly
- **Knowledge Base Integration**: ZeroDB-powered knowledge base with semantic search
- **Escalation Logic**: Automatic escalation for complex issues
- **Response Templates**: Pre-defined templates for common issues
- **Analytics Dashboard**: Real-time metrics and insights
- **Follow-up Tracking**: Automatic follow-up reminders

## Architecture

### Multi-Agent System

1. **Router Agent**: Classifies and routes tickets
   - Category classification (technical, billing, account, general)
   - Priority assignment (low, medium, high, urgent)
   - Sentiment analysis (positive, neutral, negative)

2. **Specialist Agents**:
   - **Technical Support**: Handles bugs, errors, configuration
   - **Billing Support**: Manages payments, subscriptions, refunds
   - **Account Support**: Deals with access, security, profiles
   - **General Support**: Answers general inquiries

3. **Knowledge Base**: ZeroDB vector store with semantic search

## Installation

```bash
npm install
```

## Configuration

```env
ANTHROPIC_API_KEY=your_key
ZERODB_API_KEY=your_zerodb_key
ZERODB_PROJECT_ID=your_project_id
```

## Usage

### Start the Application

```bash
# Development
npm run dev

# Production
npm run build && npm run start
```

### API Endpoints

#### Submit Ticket
```bash
POST /api/tickets
{
  "subject": "Cannot login to account",
  "description": "I forgot my password",
  "userId": "user123"
}
```

#### Get Ticket Status
```bash
GET /api/tickets/:id
```

#### Search Knowledge Base
```bash
POST /api/knowledge-base/search
{
  "query": "how to reset password",
  "limit": 5
}
```

## Agent Workflow

1. User submits support ticket
2. Router Agent classifies ticket (category, priority, sentiment)
3. Ticket routed to appropriate Specialist Agent
4. Specialist Agent:
   - Searches knowledge base for solutions
   - Generates response
   - Decides if escalation needed
5. Response sent to user
6. Follow-up scheduled if needed

## Dashboard Features

- **Ticket Queue**: View all open tickets
- **Agent Performance**: Track resolution times and satisfaction
- **Sentiment Trends**: Monitor customer sentiment over time
- **Knowledge Base Analytics**: Most searched topics
- **Escalation Metrics**: Track escalation rates

## Knowledge Base Management

### Add Article
```typescript
import { knowledgeBase } from './services/knowledge-base';

await knowledgeBase.addArticle({
  title: 'How to Reset Password',
  content: 'Step-by-step guide...',
  category: 'account',
  tags: ['password', 'security', 'login'],
});
```

### Search
```typescript
const results = await knowledgeBase.search({
  query: 'reset password',
  limit: 5,
});
```

## Testing

```bash
npm test
```

## Deployment

See main deployment guide.

## Integration with External Systems

- **CRM**: Sync with Salesforce, HubSpot
- **Email**: Send follow-up emails
- **Chat**: Integrate with Intercom, Zendesk
- **Analytics**: Export metrics to data warehouse
