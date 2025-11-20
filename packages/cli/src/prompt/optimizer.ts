/**
 * AI-powered prompt optimizer
 */

import chalk from 'chalk';
import { PromptTester } from './tester.js';
import {
  PromptConfig,
  OptimizationResult,
  OptimizationSuggestion,
  PromptTestResult,
} from './types.js';

export class PromptOptimizer {
  private tester: PromptTester;
  private originalPrompt: string;

  constructor(config: PromptConfig) {
    this.tester = new PromptTester(config);
    this.originalPrompt = config.prompts[0].content;
  }

  /**
   * Analyze and optimize prompt
   */
  async optimize(autoTest: boolean = false): Promise<OptimizationResult> {
    console.log(chalk.bold.cyan('\n🔧 Analyzing prompt for optimization...\n'));

    const suggestions = await this.analyzePrompt(this.originalPrompt);

    // Display suggestions
    this.displaySuggestions(suggestions);

    // Apply suggestions
    const optimizedPrompt = this.applyOptimizations(
      this.originalPrompt,
      suggestions
    );

    const result: OptimizationResult = {
      original_prompt: this.originalPrompt,
      optimized_prompt,
      suggestions,
    };

    // Auto-test if requested
    if (autoTest) {
      console.log(chalk.bold.cyan('\n🧪 Testing optimization...\n'));
      const metrics = await this.testOptimization(
        this.originalPrompt,
        optimizedPrompt
      );
      result.improvement_metrics = metrics;
    }

    return result;
  }

  /**
   * Analyze prompt for issues
   */
  private async analyzePrompt(
    prompt: string
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for structural issues
    suggestions.push(...this.checkStructure(prompt));

    // Check for clarity issues
    suggestions.push(...this.checkClarity(prompt));

    // Check for efficiency issues
    suggestions.push(...this.checkEfficiency(prompt));

    // Check for best practices
    suggestions.push(...this.checkBestPractices(prompt));

    // Use AI to get additional suggestions
    if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      const aiSuggestions = await this.getAISuggestions(prompt);
      suggestions.push(...aiSuggestions);
    }

    return suggestions;
  }

  /**
   * Check prompt structure
   */
  private checkStructure(prompt: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for role definition
    if (!prompt.match(/you are|your role|act as/i)) {
      suggestions.push({
        type: 'structure',
        severity: 'medium',
        message: 'Add clear role definition',
        before: prompt.slice(0, 100),
        after: 'You are an expert assistant. ' + prompt.slice(0, 100),
        impact: 'Improves response consistency and quality',
      });
    }

    // Check for task definition
    if (!prompt.match(/task|goal|objective/i)) {
      suggestions.push({
        type: 'structure',
        severity: 'high',
        message: 'Add explicit task definition',
        before: prompt,
        after:
          prompt +
          '\n\nYour task is to: [Define specific task here]',
        impact: 'Clarifies expected output',
      });
    }

    // Check for output format
    if (!prompt.match(/format|structure|output/i)) {
      suggestions.push({
        type: 'structure',
        severity: 'medium',
        message: 'Specify output format',
        before: prompt,
        after: prompt + '\n\nProvide your response in the following format:\n[Define format]',
        impact: 'Ensures consistent output formatting',
      });
    }

    return suggestions;
  }

  /**
   * Check prompt clarity
   */
  private checkClarity(prompt: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for ambiguous words
    const ambiguousWords = ['things', 'stuff', 'some', 'various', 'etc'];
    for (const word of ambiguousWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(prompt)) {
        suggestions.push({
          type: 'clarity',
          severity: 'low',
          message: `Replace ambiguous word: "${word}"`,
          before: prompt.match(regex)?.[0] || word,
          after: '[specific term]',
          impact: 'Increases precision',
        });
      }
    }

    // Check for complex sentences (>30 words)
    const sentences = prompt.split(/[.!?]+/);
    for (const sentence of sentences) {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 30) {
        suggestions.push({
          type: 'clarity',
          severity: 'medium',
          message: 'Break down complex sentence',
          before: sentence.trim().slice(0, 100),
          after: '[Split into 2-3 shorter sentences]',
          impact: 'Improves comprehension',
        });
      }
    }

    return suggestions;
  }

  /**
   * Check prompt efficiency
   */
  private checkEfficiency(prompt: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for redundancy
    const words = prompt.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      if (word.length > 4) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    for (const [word, count] of wordCounts) {
      if (count > 3) {
        suggestions.push({
          type: 'efficiency',
          severity: 'low',
          message: `Word "${word}" repeated ${count} times`,
          before: word,
          after: '[Use synonyms or restructure]',
          impact: 'Reduces token usage',
        });
      }
    }

    // Check for excessive length
    const tokenEstimate = Math.ceil(prompt.length / 4);
    if (tokenEstimate > 500) {
      suggestions.push({
        type: 'efficiency',
        severity: 'high',
        message: 'Prompt is too long',
        before: `~${tokenEstimate} tokens`,
        after: '[Condense to < 500 tokens]',
        impact: 'Significantly reduces cost',
      });
    }

    return suggestions;
  }

  /**
   * Check best practices
   */
  private checkBestPractices(prompt: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for examples
    if (!prompt.match(/example|for instance|such as/i)) {
      suggestions.push({
        type: 'best_practice',
        severity: 'medium',
        message: 'Add examples for clarity',
        before: prompt,
        after: prompt + '\n\nExample:\n[Add relevant example]',
        impact: 'Improves output quality through few-shot learning',
      });
    }

    // Check for constraints
    if (!prompt.match(/do not|avoid|must not/i)) {
      suggestions.push({
        type: 'best_practice',
        severity: 'low',
        message: 'Consider adding constraints',
        before: prompt,
        after: prompt + '\n\nConstraints:\n- [Add relevant constraints]',
        impact: 'Prevents unwanted behaviors',
      });
    }

    return suggestions;
  }

  /**
   * Get AI-powered suggestions
   */
  private async getAISuggestions(
    prompt: string
  ): Promise<OptimizationSuggestion[]> {
    try {
      const optimizationPrompt = `Analyze this prompt and suggest improvements:

${prompt}

Provide 3-5 specific, actionable suggestions to improve this prompt. Focus on:
1. Clarity and precision
2. Structure and organization
3. Token efficiency
4. Best practices

Format each suggestion as:
TYPE | SEVERITY | MESSAGE | IMPACT

Example:
clarity | medium | Replace "things" with specific terms | Increases precision`;

      // Create a temporary config for optimization
      const config = {
        name: 'optimizer',
        version: '1.0',
        prompts: [
          {
            id: 'optimize',
            content: optimizationPrompt,
          },
        ],
      };

      const tester = new PromptTester(config);
      const result = await tester.testPrompt('optimize', '', 'gpt-3.5-turbo');

      // Parse AI response
      return this.parseAISuggestions(result.output);
    } catch (error) {
      // Return empty array if AI suggestions fail
      console.log(chalk.dim('Note: AI-powered suggestions unavailable'));
      return [];
    }
  }

  /**
   * Parse AI suggestions
   */
  private parseAISuggestions(output: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length === 4) {
        suggestions.push({
          type: parts[0] as any,
          severity: parts[1] as any,
          message: parts[2],
          before: '',
          after: '',
          impact: parts[3],
        });
      }
    }

    return suggestions;
  }

  /**
   * Display suggestions
   */
  private displaySuggestions(suggestions: OptimizationSuggestion[]): void {
    if (suggestions.length === 0) {
      console.log(chalk.green('✅ No optimization suggestions found!\n'));
      return;
    }

    console.log(
      chalk.bold.yellow(`Found ${suggestions.length} optimization suggestions:\n`)
    );

    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      const severityColor =
        s.severity === 'high'
          ? chalk.red
          : s.severity === 'medium'
          ? chalk.yellow
          : chalk.blue;

      console.log(
        `${i + 1}. ${severityColor(`[${s.severity.toUpperCase()}]`)} ${s.type}: ${
          s.message
        }`
      );
      if (s.impact) {
        console.log(chalk.dim(`   Impact: ${s.impact}`));
      }
      console.log();
    }
  }

  /**
   * Apply optimizations
   */
  private applyOptimizations(
    prompt: string,
    suggestions: OptimizationSuggestion[]
  ): string {
    let optimized = prompt;

    // Apply high priority suggestions automatically
    const highPriority = suggestions.filter((s) => s.severity === 'high');

    for (const suggestion of highPriority) {
      if (suggestion.before && suggestion.after) {
        optimized = optimized.replace(suggestion.before, suggestion.after);
      }
    }

    return optimized;
  }

  /**
   * Test optimization by comparing original vs optimized
   */
  private async testOptimization(
    original: string,
    optimized: string
  ): Promise<{
    estimated_token_reduction: number;
    estimated_cost_reduction: number;
    clarity_improvement: number;
  }> {
    const originalTokens = Math.ceil(original.length / 4);
    const optimizedTokens = Math.ceil(optimized.length / 4);
    const tokenReduction = originalTokens - optimizedTokens;

    const costReduction = (tokenReduction / 1000) * 0.001; // Estimate

    // Calculate clarity score based on various factors
    const clarityScore = this.calculateClarityScore(optimized) -
                         this.calculateClarityScore(original);

    console.log(chalk.bold.green('\n✅ Optimization Results:\n'));
    console.log(
      chalk.white('Token Reduction:'),
      chalk.yellow(`${tokenReduction} tokens (${((tokenReduction / originalTokens) * 100).toFixed(1)}%)`)
    );
    console.log(
      chalk.white('Cost Reduction:'),
      chalk.green(`$${costReduction.toFixed(4)}`)
    );
    console.log(
      chalk.white('Clarity Improvement:'),
      chalk.blue(`${clarityScore > 0 ? '+' : ''}${clarityScore.toFixed(1)} points`)
    );
    console.log();

    return {
      estimated_token_reduction: tokenReduction,
      estimated_cost_reduction: costReduction,
      clarity_improvement: clarityScore,
    };
  }

  /**
   * Calculate clarity score (0-100)
   */
  private calculateClarityScore(prompt: string): number {
    let score = 50; // Base score

    // Bonus for structure
    if (prompt.match(/you are|your role/i)) score += 10;
    if (prompt.match(/task|goal|objective/i)) score += 10;
    if (prompt.match(/format|structure|output/i)) score += 10;
    if (prompt.match(/example|for instance/i)) score += 10;

    // Penalty for ambiguity
    const ambiguousWords = ['things', 'stuff', 'some', 'various', 'etc'];
    for (const word of ambiguousWords) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(prompt)) score -= 2;
    }

    // Penalty for complex sentences
    const sentences = prompt.split(/[.!?]+/);
    for (const sentence of sentences) {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 30) score -= 3;
    }

    return Math.max(0, Math.min(100, score));
  }
}
