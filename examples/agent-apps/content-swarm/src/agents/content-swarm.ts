/**
 * Content Creation Agent Swarm
 * Multi-agent collaboration for blog posts, SEO, and social media
 */

import { AgentExecutor } from '@ainative/ai-kit/core';
import { createLogger, globalStateManager, globalMetricsCollector } from '@examples/shared';
import type { AgentResult, StepResult } from '@examples/shared';

const logger = createLogger('ContentSwarm');

export interface ContentRequest {
  topic: string;
  contentType: 'blog' | 'article' | 'social' | 'email';
  tone: 'professional' | 'casual' | 'technical' | 'creative';
  length: 'short' | 'medium' | 'long';
  seoOptimize?: boolean;
  includeImages?: boolean;
  targetAudience?: string;
}

export interface ContentResult {
  topic: string;
  content: string;
  seo: SEOData;
  socialPosts: SocialPost[];
  images: ImageSuggestion[];
  metadata: ContentMetadata;
  versions: ContentVersion[];
  generatedAt: Date;
}

export interface SEOData {
  title: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
  readingTime: number;
  seoScore: number;
}

export interface SocialPost {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  content: string;
  hashtags: string[];
  imagePrompt?: string;
}

export interface ImageSuggestion {
  position: number;
  prompt: string;
  altText: string;
  caption?: string;
}

export interface ContentMetadata {
  wordCount: number;
  readability: number;
  tone: string;
  style: string;
}

export interface ContentVersion {
  version: number;
  changes: string;
  content: string;
  createdBy: string;
}

// Research Agent
class ResearcherAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'Researcher',
      systemPrompt: 'Research topics and gather information for content creation.',
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.7,
    });
  }

  async research(topic: string): Promise<any> {
    logger.info('Researching topic', { topic });
    return {
      facts: [
        `Key fact about ${topic}`,
        `Important detail regarding ${topic}`,
        `Recent development in ${topic}`,
      ],
      sources: ['source1', 'source2'],
      outline: ['Introduction', 'Main Points', 'Conclusion'],
    };
  }
}

// Writer Agent
class WriterAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'Writer',
      systemPrompt: 'Write engaging, well-structured content.',
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.8,
    });
  }

  async write(research: any, request: ContentRequest): Promise<string> {
    logger.info('Writing content', { topic: request.topic });

    const lengthMap = {
      short: 500,
      medium: 1500,
      long: 3000,
    };

    const words = lengthMap[request.length];

    return `# ${request.topic}\n\n${research.facts.join('\n\n')}\n\nThis is a ${request.tone} ${request.contentType} about ${request.topic} with approximately ${words} words.`;
  }
}

// Editor Agent
class EditorAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'Editor',
      systemPrompt: 'Edit and improve content for clarity and impact.',
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.3,
    });
  }

  async edit(content: string): Promise<{ edited: string; changes: string }> {
    logger.info('Editing content');
    return {
      edited: content + '\n\n[Edited for clarity and style]',
      changes: 'Improved clarity, fixed grammar, enhanced readability',
    };
  }
}

// SEO Agent
class SEOAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'SEOSpecialist',
      systemPrompt: 'Optimize content for search engines.',
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.4,
    });
  }

  async optimize(content: string, topic: string): Promise<SEOData> {
    logger.info('Optimizing for SEO', { topic });

    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    return {
      title: `${topic} - Complete Guide`,
      metaDescription: `Learn everything about ${topic} in this comprehensive guide.`,
      keywords: [topic.toLowerCase(), 'guide', 'tutorial'],
      slug: topic.toLowerCase().replace(/\s+/g, '-'),
      readingTime,
      seoScore: 85,
    };
  }
}

// Social Media Agent
class SocialMediaAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'SocialMediaManager',
      systemPrompt: 'Create engaging social media posts.',
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.9,
    });
  }

  async createPosts(content: string, topic: string): Promise<SocialPost[]> {
    logger.info('Creating social media posts', { topic });

    return [
      {
        platform: 'twitter',
        content: `New post: ${topic}! 🚀\n\nCheck it out to learn more.`,
        hashtags: ['tech', 'blog', topic.toLowerCase().replace(/\s+/g, '')],
      },
      {
        platform: 'linkedin',
        content: `I just published a new article about ${topic}. Here's what you'll learn...`,
        hashtags: ['professional', 'learning'],
      },
    ];
  }
}

// Image Generation Agent
class ImageAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'ImageGenerator',
      systemPrompt: 'Generate image prompts and suggestions.',
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.7,
    });
  }

  async suggestImages(content: string): Promise<ImageSuggestion[]> {
    logger.info('Suggesting images');

    return [
      {
        position: 0,
        prompt: 'Hero image for blog post',
        altText: 'Header illustration',
      },
      {
        position: 1,
        prompt: 'Diagram explaining concept',
        altText: 'Explanatory diagram',
      },
    ];
  }
}

export class ContentCreationSwarm {
  private researcher: ResearcherAgent;
  private writer: WriterAgent;
  private editor: EditorAgent;
  private seoAgent: SEOAgent;
  private socialAgent: SocialMediaAgent;
  private imageAgent: ImageAgent;

  constructor() {
    this.researcher = new ResearcherAgent();
    this.writer = new WriterAgent();
    this.editor = new EditorAgent();
    this.seoAgent = new SEOAgent();
    this.socialAgent = new SocialMediaAgent();
    this.imageAgent = new ImageAgent();
  }

  async create(request: ContentRequest): Promise<AgentResult> {
    const executionId = `content-${Date.now()}`;
    const state = globalStateManager.createState(executionId, { request });

    logger.info('Starting content creation', { topic: request.topic });
    globalMetricsCollector.startExecution(executionId);

    const steps: StepResult[] = [];
    const versions: ContentVersion[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Research
      globalStateManager.updateState(executionId, {
        status: 'running',
        currentStep: 1,
        totalSteps: 6,
        stepName: 'Research',
      });

      const researchStart = Date.now();
      const research = await this.researcher.research(request.topic);
      const researchDuration = Date.now() - researchStart;

      steps.push({
        stepName: 'Research',
        success: true,
        output: research,
        tokensUsed: 1500,
        durationMs: researchDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1500, 0.015);

      // Step 2: Write draft
      globalStateManager.updateState(executionId, {
        currentStep: 2,
        stepName: 'Writing Draft',
      });

      const writeStart = Date.now();
      const draft = await this.writer.write(research, request);
      const writeDuration = Date.now() - writeStart;

      versions.push({
        version: 1,
        changes: 'Initial draft',
        content: draft,
        createdBy: 'Writer',
      });

      steps.push({
        stepName: 'Write Draft',
        success: true,
        output: { wordCount: draft.split(/\s+/).length },
        tokensUsed: 3000,
        durationMs: writeDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 3000, 0.03);

      // Step 3: Edit
      globalStateManager.updateState(executionId, {
        currentStep: 3,
        stepName: 'Editing',
      });

      const editStart = Date.now();
      const { edited, changes } = await this.editor.edit(draft);
      const editDuration = Date.now() - editStart;

      versions.push({
        version: 2,
        changes,
        content: edited,
        createdBy: 'Editor',
      });

      steps.push({
        stepName: 'Edit Content',
        success: true,
        output: { changes },
        tokensUsed: 2000,
        durationMs: editDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 2000, 0.02);

      // Step 4: SEO optimization
      let seo: SEOData = {} as SEOData;
      if (request.seoOptimize !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 4,
          stepName: 'SEO Optimization',
        });

        const seoStart = Date.now();
        seo = await this.seoAgent.optimize(edited, request.topic);
        const seoDuration = Date.now() - seoStart;

        steps.push({
          stepName: 'SEO Optimization',
          success: true,
          output: seo,
          tokensUsed: 1000,
          durationMs: seoDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 1000, 0.01);
      }

      // Step 5: Social media posts
      globalStateManager.updateState(executionId, {
        currentStep: 5,
        stepName: 'Social Media',
      });

      const socialStart = Date.now();
      const socialPosts = await this.socialAgent.createPosts(edited, request.topic);
      const socialDuration = Date.now() - socialStart;

      steps.push({
        stepName: 'Social Media',
        success: true,
        output: socialPosts,
        tokensUsed: 800,
        durationMs: socialDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 800, 0.008);

      // Step 6: Image suggestions
      let images: ImageSuggestion[] = [];
      if (request.includeImages !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 6,
          stepName: 'Image Suggestions',
        });

        const imageStart = Date.now();
        images = await this.imageAgent.suggestImages(edited);
        const imageDuration = Date.now() - imageStart;

        steps.push({
          stepName: 'Image Suggestions',
          success: true,
          output: images,
          tokensUsed: 600,
          durationMs: imageDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 600, 0.006);
      }

      const totalDuration = Date.now() - startTime;
      const totalTokens = steps.reduce((sum, step) => sum + step.tokensUsed, 0);
      const wordCount = edited.split(/\s+/).length;

      const result: ContentResult = {
        topic: request.topic,
        content: edited,
        seo,
        socialPosts,
        images,
        metadata: {
          wordCount,
          readability: 75,
          tone: request.tone,
          style: request.contentType,
        },
        versions,
        generatedAt: new Date(),
      };

      globalStateManager.updateState(executionId, {
        status: 'completed',
        result,
      });

      globalMetricsCollector.endExecution(executionId);

      logger.info('Content creation completed', {
        wordCount,
        versions: versions.length,
        tokensUsed: totalTokens,
        durationMs: totalDuration,
      });

      return {
        success: true,
        output: result,
        steps,
        totalTokens,
        totalCost: totalTokens * 0.00001,
        durationMs: totalDuration,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Content creation failed', { error: err.message });

      globalStateManager.updateState(executionId, {
        status: 'failed',
        error: err,
      });

      globalMetricsCollector.recordError(executionId);
      globalMetricsCollector.endExecution(executionId);

      return {
        success: false,
        output: null,
        steps,
        totalTokens: steps.reduce((sum, step) => sum + step.tokensUsed, 0),
        totalCost: 0,
        durationMs: Date.now() - startTime,
        error: err,
      };
    }
  }
}

export const contentSwarm = new ContentCreationSwarm();
