# Content Creation Agent Swarm

Multi-agent collaborative system for creating blog posts, articles, and social media content with SEO optimization and image generation.

## Features

- **Multi-Agent Collaboration**: 6 specialized agents work together
  - **Researcher**: Gathers information and creates outlines
  - **Writer**: Creates initial content drafts
  - **Editor**: Refines and improves content
  - **SEO Specialist**: Optimizes for search engines
  - **Social Media Manager**: Creates platform-specific posts
  - **Image Generator**: Suggests visual content

- **Content Types**: Blog posts, articles, social media, email campaigns
- **SEO Optimization**: Automatic keyword extraction, meta descriptions, titles
- **Social Media Posts**: Platform-specific content for Twitter, LinkedIn, Facebook, Instagram
- **Image Generation**: AI prompts for visual content
- **Version Control**: Track all revisions and changes
- **Editorial Workflow**: Multi-stage content refinement

## Installation

```bash
npm install
```

## Usage

### Web Interface

```bash
npm run dev
# Open http://localhost:3005
```

### Create Content

```typescript
import { contentSwarm } from './agents/content-swarm';

const result = await contentSwarm.create({
  topic: 'The Future of AI',
  contentType: 'blog',
  tone: 'professional',
  length: 'long',
  seoOptimize: true,
  includeImages: true,
  targetAudience: 'tech enthusiasts',
});
```

### API

```bash
POST /api/content/create
{
  "topic": "The Future of AI",
  "contentType": "blog",
  "tone": "professional",
  "length": "long",
  "seoOptimize": true,
  "includeImages": true
}
```

## Agent Workflow

1. **Research Phase**: Researcher agent gathers facts and creates outline
2. **Writing Phase**: Writer agent creates initial draft based on research
3. **Editing Phase**: Editor agent refines content for clarity and impact
4. **SEO Phase**: SEO agent optimizes titles, keywords, and meta descriptions
5. **Social Phase**: Social Media agent creates platform-specific posts
6. **Visual Phase**: Image agent generates prompts for visual content

## Content Types

- **Blog**: 500-3000 words, SEO-optimized
- **Article**: Professional, in-depth analysis
- **Social**: Platform-specific short-form content
- **Email**: Campaign-ready email content

## Tone Options

- **Professional**: Business and corporate
- **Casual**: Conversational and friendly
- **Technical**: In-depth, technical audience
- **Creative**: Engaging and imaginative

## SEO Features

- Title optimization
- Meta description generation
- Keyword extraction
- Slug generation
- Reading time calculation
- SEO score (0-100)

## Social Media Platforms

- **Twitter**: 280 characters, hashtags
- **LinkedIn**: Professional tone, longer format
- **Facebook**: Casual, engaging
- **Instagram**: Visual-first, emojis

## Version Control

All content versions are tracked:

```typescript
{
  versions: [
    {
      version: 1,
      changes: "Initial draft",
      content: "...",
      createdBy: "Writer"
    },
    {
      version: 2,
      changes: "Edited for clarity",
      content: "...",
      createdBy: "Editor"
    }
  ]
}
```

## Image Integration

The system generates prompts for AI image generation tools:

```typescript
{
  images: [
    {
      position: 0,
      prompt: "Futuristic AI laboratory with robots",
      altText: "AI research facility",
      caption: "The future of artificial intelligence"
    }
  ]
}
```

## Testing

```bash
npm test
```

## Deployment

See main deployment guide.

## Integration

- **CMS**: WordPress, Contentful, Sanity
- **Image Gen**: DALL-E, Midjourney, Stable Diffusion
- **Publishing**: Automatic publishing to platforms
- **Analytics**: Track performance metrics
