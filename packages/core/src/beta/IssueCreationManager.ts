/**
 * Issue Creation Manager
 * Automatically creates GitHub issues from beta feedback
 */

import {
  BetaFeedback,
  FeedbackType,
  FeedbackSeverity,
  GitHubIssue,
  GitHubClient,
  IssueCreationOptions,
  IssueCreationStats,
} from './types'

export class IssueCreationManager {
  private issues: Map<string, GitHubIssue> = new Map()
  private feedbackIndex: Map<string, string> = new Map()
  private githubClient: GitHubClient
  private options: IssueCreationOptions

  constructor(githubClient: GitHubClient, options?: IssueCreationOptions) {
    this.githubClient = githubClient
    this.options = {
      autoCreate: false,
      autoCreateTypes: [FeedbackType.BUG],
      autoCreateSeverities: [FeedbackSeverity.CRITICAL, FeedbackSeverity.HIGH],
      ...options,
    }
  }

  /**
   * Create GitHub issue from feedback
   */
  async createIssueFromFeedback(feedback: BetaFeedback): Promise<GitHubIssue> {
    if (this.feedbackIndex.has(feedback.id)) {
      throw new Error('Issue already created for this feedback')
    }

    const title = this.generateIssueTitle(feedback)
    const body = this.generateIssueBody(feedback)
    const labels = this.generateLabels(feedback)

    const githubIssue = await this.githubClient.createIssue({
      title,
      body,
      labels,
    })

    const issue: GitHubIssue = {
      number: githubIssue.number,
      feedbackId: feedback.id,
      url: githubIssue.html_url,
      type: feedback.type,
      severity: feedback.severity,
      createdAt: Date.now(),
    }

    this.issues.set(String(issue.number), issue)
    this.feedbackIndex.set(feedback.id, String(issue.number))

    return issue
  }

  /**
   * Get issue by feedback ID
   */
  async getIssueByFeedbackId(feedbackId: string): Promise<GitHubIssue | undefined> {
    const issueNumber = this.feedbackIndex.get(feedbackId)
    if (!issueNumber) return undefined
    return this.issues.get(issueNumber)
  }

  /**
   * List all created issues
   */
  async listCreatedIssues(): Promise<GitHubIssue[]> {
    return Array.from(this.issues.values())
  }

  /**
   * Get issue creation statistics
   */
  async getIssueCreationStats(): Promise<IssueCreationStats> {
    const issues = Array.from(this.issues.values())

    const byType: Record<FeedbackType, number> = {
      [FeedbackType.GENERAL]: 0,
      [FeedbackType.BUG]: 0,
      [FeedbackType.FEATURE_REQUEST]: 0,
      [FeedbackType.IMPROVEMENT]: 0,
    }

    const bySeverity: Partial<Record<FeedbackSeverity, number>> = {}

    issues.forEach(issue => {
      byType[issue.type] = (byType[issue.type] || 0) + 1
      if (issue.severity) {
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1
      }
    })

    return {
      total: issues.length,
      byType,
      bySeverity,
    }
  }

  /**
   * Check if feedback should auto-create an issue
   */
  async shouldAutoCreate(feedback: BetaFeedback): Promise<boolean> {
    if (!this.options.autoCreate) return false

    const typeMatches = this.options.autoCreateTypes?.includes(feedback.type)
    if (!typeMatches) return false

    if (feedback.severity) {
      const severityMatches = this.options.autoCreateSeverities?.includes(feedback.severity)
      return severityMatches || false
    }

    return true
  }

  /**
   * Close manager and cleanup resources
   */
  async close(): Promise<void> {
    this.issues.clear()
    this.feedbackIndex.clear()
  }

  /**
   * Generate issue title from feedback
   */
  private generateIssueTitle(feedback: BetaFeedback): string {
    const prefix = feedback.type === FeedbackType.BUG ? '[BETA BUG]' : '[BETA FEATURE]'
    const message = feedback.message.substring(0, 100)
    return `${prefix} ${message}`
  }

  /**
   * Generate issue body from feedback
   */
  private generateIssueBody(feedback: BetaFeedback): string {
    let body = `## Beta Feedback\n\n`
    body += `**Feedback ID:** ${feedback.id}\n`
    body += `**User ID:** ${feedback.userId}\n`
    body += `**Type:** ${feedback.type}\n`

    if (feedback.severity) {
      body += `**Severity:** ${feedback.severity}\n`
    }

    if (feedback.rating) {
      body += `**Rating:** ${feedback.rating}/5\n`
    }

    body += `\n## Description\n\n${feedback.message}\n`

    if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
      body += `\n## Metadata\n\n`
      body += '```json\n'
      body += JSON.stringify(feedback.metadata, null, 2)
      body += '\n```\n'
    }

    body += `\n---\n`
    body += `*This issue was automatically created from beta feedback.*\n`

    return body
  }

  /**
   * Generate labels for GitHub issue
   */
  private generateLabels(feedback: BetaFeedback): string[] {
    const labels = ['beta-feedback']

    if (feedback.type === FeedbackType.BUG) {
      labels.push('bug')
    } else if (feedback.type === FeedbackType.FEATURE_REQUEST) {
      labels.push('enhancement')
    } else if (feedback.type === FeedbackType.IMPROVEMENT) {
      labels.push('enhancement')
    }

    if (feedback.severity) {
      labels.push(`severity:${feedback.severity}`)
    }

    return labels
  }
}
