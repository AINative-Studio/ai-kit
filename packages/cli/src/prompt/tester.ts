/**
 * Interactive prompt tester with real-time streaming and metrics
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  PromptConfig,
  PromptVariant,
  PromptTestResult,
  PromptMetrics,
  StreamOptions,
  ModelConfig,
} from './types.js';
import { calculateCost, formatMetrics } from './utils.js';

export class PromptTester {
  private config: PromptConfig;
  private apiKeys: Map<string, string> = new Map();

  constructor(config: PromptConfig) {
    this.config = config;
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    // Load API keys from environment
    if (process.env.OPENAI_API_KEY) {
      this.apiKeys.set('openai', process.env.OPENAI_API_KEY);
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.apiKeys.set('anthropic', process.env.ANTHROPIC_API_KEY);
    }
    if (process.env.GOOGLE_API_KEY) {
      this.apiKeys.set('google', process.env.GOOGLE_API_KEY);
    }
  }

  /**
   * Test a single prompt with streaming output
   */
  async testPrompt(
    promptId: string,
    input: string,
    model?: string,
    options?: StreamOptions
  ): Promise<PromptTestResult> {
    const prompt = this.config.prompts.find((p) => p.id === promptId);
    if (!prompt) {
      throw new Error(`Prompt '${promptId}' not found`);
    }

    const spinner = ora(`Testing prompt '${promptId}'...`).start();
    const startTime = Date.now();

    try {
      const modelToUse = model || this.config.defaults?.model || 'gpt-4';
      const result = await this.executePrompt(prompt, input, modelToUse, options);

      const endTime = Date.now();
      const latency = endTime - startTime;

      const metrics: PromptMetrics = {
        tokens_used: result.tokens.total,
        prompt_tokens: result.tokens.prompt,
        completion_tokens: result.tokens.completion,
        cost_usd: calculateCost(modelToUse, result.tokens),
        latency_ms: latency,
      };

      spinner.succeed(chalk.green(`Prompt tested successfully (${latency}ms)`));

      const testResult: PromptTestResult = {
        id: `test-${Date.now()}`,
        prompt_id: promptId,
        input,
        output: result.output,
        model: modelToUse,
        parameters: prompt.parameters || {},
        metrics,
        timestamp: new Date(),
      };

      // Display metrics
      this.displayMetrics(testResult);

      return testResult;
    } catch (error: any) {
      spinner.fail(chalk.red('Test failed'));
      throw error;
    }
  }

  /**
   * Execute prompt against LLM provider
   */
  private async executePrompt(
    prompt: PromptVariant,
    input: string,
    model: string,
    options?: StreamOptions
  ): Promise<{
    output: string;
    tokens: { total: number; prompt: number; completion: number };
  }> {
    const provider = this.getProvider(model);
    const apiKey = this.apiKeys.get(provider);

    if (!apiKey) {
      throw new Error(
        `API key for ${provider} not found. Set ${provider.toUpperCase()}_API_KEY environment variable.`
      );
    }

    // Construct full prompt with input
    const fullPrompt = this.constructPrompt(prompt.content, input);

    // Call appropriate provider
    switch (provider) {
      case 'openai':
        return await this.callOpenAI(fullPrompt, model, prompt, apiKey, options);
      case 'anthropic':
        return await this.callAnthropic(fullPrompt, model, prompt, apiKey, options);
      default:
        throw new Error(`Provider ${provider} not yet supported`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    prompt: string,
    model: string,
    config: PromptVariant,
    apiKey: string,
    options?: StreamOptions
  ): Promise<{ output: string; tokens: any }> {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.parameters?.temperature ?? 0.7,
        max_tokens: config.parameters?.max_tokens ?? 1000,
        stream: !!options?.onToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    if (options?.onToken) {
      return await this.handleOpenAIStream(response, options);
    } else {
      const data: any = await response.json();
      return {
        output: data.choices[0].message.content,
        tokens: {
          total: data.usage.total_tokens,
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
        },
      };
    }
  }

  /**
   * Handle OpenAI streaming response
   */
  private async handleOpenAIStream(
    response: any,
    options: StreamOptions
  ): Promise<{ output: string; tokens: any }> {
    let fullOutput = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const reader = response.body;
    const decoder = new TextDecoder();

    for await (const chunk of reader) {
      const text = decoder.decode(chunk);
      const lines = text.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content;
            if (delta) {
              fullOutput += delta;
              options.onToken?.(delta);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Estimate tokens (actual count not available in streaming)
    return {
      output: fullOutput,
      tokens: {
        total: Math.ceil((fullOutput.length + 100) / 4),
        prompt: Math.ceil(100 / 4),
        completion: Math.ceil(fullOutput.length / 4),
      },
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    prompt: string,
    model: string,
    config: PromptVariant,
    apiKey: string,
    options?: StreamOptions
  ): Promise<{ output: string; tokens: any }> {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: config.parameters?.max_tokens ?? 1000,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.parameters?.temperature ?? 0.7,
        stream: !!options?.onToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
    }

    if (options?.onToken) {
      return await this.handleAnthropicStream(response, options);
    } else {
      const data: any = await response.json();
      return {
        output: data.content[0].text,
        tokens: {
          total: data.usage.input_tokens + data.usage.output_tokens,
          prompt: data.usage.input_tokens,
          completion: data.usage.output_tokens,
        },
      };
    }
  }

  /**
   * Handle Anthropic streaming response
   */
  private async handleAnthropicStream(
    response: any,
    options: StreamOptions
  ): Promise<{ output: string; tokens: any }> {
    let fullOutput = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const reader = response.body;
    const decoder = new TextDecoder();

    for await (const chunk of reader) {
      const text = decoder.decode(chunk);
      const lines = text.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text;
              if (delta) {
                fullOutput += delta;
                options.onToken?.(delta);
              }
            } else if (parsed.type === 'message_start') {
              inputTokens = parsed.message?.usage?.input_tokens || 0;
            } else if (parsed.type === 'message_delta') {
              outputTokens = parsed.usage?.output_tokens || 0;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return {
      output: fullOutput,
      tokens: {
        total: inputTokens + outputTokens,
        prompt: inputTokens,
        completion: outputTokens,
      },
    };
  }

  /**
   * Get provider from model name
   */
  private getProvider(model: string): string {
    if (model.startsWith('gpt')) return 'openai';
    if (model.startsWith('claude')) return 'anthropic';
    if (model.startsWith('gemini')) return 'google';
    return 'openai'; // default
  }

  /**
   * Construct full prompt with input
   */
  private constructPrompt(template: string, input: string): string {
    // Replace {{input}} placeholder
    return template.replace(/\{\{input\}\}/g, input);
  }

  /**
   * Display test metrics
   */
  private displayMetrics(result: PromptTestResult): void {
    console.log();
    console.log(chalk.bold.cyan('📊 Metrics:'));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(
      chalk.white('Tokens:'),
      chalk.yellow(result.metrics.tokens_used.toLocaleString())
    );
    console.log(
      chalk.white('Cost:'),
      chalk.green(`$${result.metrics.cost_usd.toFixed(4)}`)
    );
    console.log(
      chalk.white('Latency:'),
      chalk.blue(`${result.metrics.latency_ms}ms`)
    );
    console.log(chalk.dim('─'.repeat(50)));
    console.log();
  }

  /**
   * Test all prompts in config
   */
  async testAll(input: string, model?: string): Promise<PromptTestResult[]> {
    const results: PromptTestResult[] = [];

    for (const prompt of this.config.prompts) {
      const result = await this.testPrompt(prompt.id, input, model);
      results.push(result);
    }

    return results;
  }

  /**
   * Run test cases from config
   */
  async runTestCases(promptId?: string): Promise<PromptTestResult[]> {
    if (!this.config.test_cases || this.config.test_cases.length === 0) {
      throw new Error('No test cases defined in config');
    }

    const results: PromptTestResult[] = [];
    const promptsToTest = promptId
      ? this.config.prompts.filter((p) => p.id === promptId)
      : this.config.prompts;

    console.log(
      chalk.bold.cyan(
        `\n🧪 Running ${this.config.test_cases.length} test cases...\n`
      )
    );

    for (const prompt of promptsToTest) {
      console.log(chalk.bold(`\nTesting prompt: ${prompt.id}\n`));

      for (const testCase of this.config.test_cases) {
        const result = await this.testPrompt(
          prompt.id,
          testCase.input,
          this.config.defaults?.model
        );
        results.push(result);
      }
    }

    return results;
  }
}
