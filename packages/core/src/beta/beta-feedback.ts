import type {
  BetaFeedback,
  BetaFeedbackResult,
  BetaFeedbackFilter,
  BetaFeedbackStats,
} from './types';

export class BetaFeedbackManager {
  private feedbackItems: BetaFeedbackResult[];

  constructor() {
    this.feedbackItems = [];
  }

  async submitFeedback(feedback: BetaFeedback): Promise<BetaFeedbackResult> {
    // Validate email
    if (!this.isValidEmail(feedback.email)) {
      throw new Error('Invalid email format');
    }

    // Validate rating
    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Create feedback result
    const result: BetaFeedbackResult = {
      success: true,
      id: this.generateId(),
      email: feedback.email,
      rating: feedback.rating,
      comment: feedback.comment,
      category: feedback.category,
      attachments: feedback.attachments,
      createdAt: new Date(),
    };

    this.feedbackItems.push(result);

    return result;
  }

  async getFeedback(filter: BetaFeedbackFilter = {}): Promise<BetaFeedbackResult[]> {
    let results = [...this.feedbackItems];

    // Filter by email
    if (filter.email) {
      results = results.filter(item => item.email === filter.email);
    }

    // Filter by category
    if (filter.category) {
      results = results.filter(item => item.category === filter.category);
    }

    // Filter by minimum rating
    if (filter.minRating !== undefined) {
      results = results.filter(item => item.rating >= filter.minRating);
    }

    return results;
  }

  async getStats(): Promise<BetaFeedbackStats> {
    const total = this.feedbackItems.length;

    if (total === 0) {
      return {
        total: 0,
        averageRating: 0,
        byCategory: {},
      };
    }

    // Calculate average rating
    const totalRating = this.feedbackItems.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / total;

    // Count by category
    const byCategory: Record<string, number> = {};
    for (const item of this.feedbackItems) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    }

    return {
      total,
      averageRating,
      byCategory,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
