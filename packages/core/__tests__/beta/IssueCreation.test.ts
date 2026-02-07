/**
 * Tests for Issue Auto-Creation from Beta Feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { IssueCreationManager } from '../../src/beta/IssueCreationManager'
import { BetaFeedback, FeedbackType, FeedbackSeverity } from '../../src/beta/types'

describe('IssueCreationManager', () => {
  let manager: IssueCreationManager
  let mockGitHubClient: any

  beforeEach(() => {
    mockGitHubClient = {
      createIssue: vi.fn(),
      addLabels: vi.fn(),
      addComment: vi.fn(),
    }
    manager = new IssueCreationManager(mockGitHubClient)
  })

  afterEach(async () => {
    await manager.close()
  })

  describe('createIssueFromFeedback', () => {
    it('should create GitHub issue from bug feedback', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-123',
        userId: 'user-456',
        type: FeedbackType.BUG,
        message: 'API endpoint returns 500 error when submitting feedback',
        severity: FeedbackSeverity.HIGH,
        status: 'pending',
        createdAt: Date.now(),
        metadata: {
          endpoint: '/api/beta/feedback',
          errorCode: 500,
        },
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 112,
        html_url: 'https://github.com/repo/issues/112',
      })

      const issue = await manager.createIssueFromFeedback(feedback)

      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('API endpoint returns 500 error'),
          body: expect.stringContaining('feedback-123'),
          labels: expect.arrayContaining(['bug', 'beta-feedback']),
        })
      )

      expect(issue.number).toBe(112)
      expect(issue.feedbackId).toBe('feedback-123')
    })

    it('should create GitHub issue from feature request', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-789',
        userId: 'user-101',
        type: FeedbackType.FEATURE_REQUEST,
        message: 'Add dark mode support',
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 113,
        html_url: 'https://github.com/repo/issues/113',
      })

      const issue = await manager.createIssueFromFeedback(feedback)

      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Add dark mode support'),
          labels: expect.arrayContaining(['enhancement', 'beta-feedback']),
        })
      )

      expect(issue.number).toBe(113)
    })

    it('should add severity labels for critical bugs', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-critical',
        userId: 'user-999',
        type: FeedbackType.BUG,
        message: 'Data loss in production',
        severity: FeedbackSeverity.CRITICAL,
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 114,
        html_url: 'https://github.com/repo/issues/114',
      })

      await manager.createIssueFromFeedback(feedback)

      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: expect.arrayContaining(['bug', 'beta-feedback', 'severity:critical']),
        })
      )
    })

    it('should include metadata in issue body', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-metadata',
        userId: 'user-meta',
        type: FeedbackType.BUG,
        message: 'Error with metadata',
        severity: FeedbackSeverity.MEDIUM,
        status: 'pending',
        createdAt: Date.now(),
        metadata: {
          browser: 'Chrome 120',
          os: 'macOS 14',
          version: '1.0.0',
        },
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 115,
        html_url: 'https://github.com/repo/issues/115',
      })

      await manager.createIssueFromFeedback(feedback)

      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringMatching(/Chrome 120/),
        })
      )
    })

    it('should prevent duplicate issue creation for same feedback', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-duplicate',
        userId: 'user-dup',
        type: FeedbackType.BUG,
        message: 'Duplicate issue test',
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 116,
        html_url: 'https://github.com/repo/issues/116',
      })

      await manager.createIssueFromFeedback(feedback)

      await expect(
        manager.createIssueFromFeedback(feedback)
      ).rejects.toThrow('Issue already created for this feedback')
    })

    it('should handle GitHub API errors gracefully', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-error',
        userId: 'user-err',
        type: FeedbackType.BUG,
        message: 'Test error handling',
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue.mockRejectedValue(
        new Error('GitHub API rate limit exceeded')
      )

      await expect(
        manager.createIssueFromFeedback(feedback)
      ).rejects.toThrow('GitHub API rate limit exceeded')
    })
  })

  describe('getIssueByFeedbackId', () => {
    it('should retrieve created issue by feedback ID', async () => {
      const feedback: BetaFeedback = {
        id: 'feedback-retrieve',
        userId: 'user-ret',
        type: FeedbackType.BUG,
        message: 'Retrieve test',
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 117,
        html_url: 'https://github.com/repo/issues/117',
      })

      await manager.createIssueFromFeedback(feedback)
      const issue = await manager.getIssueByFeedbackId('feedback-retrieve')

      expect(issue).toBeDefined()
      expect(issue?.number).toBe(117)
    })

    it('should return undefined for non-existent feedback', async () => {
      const issue = await manager.getIssueByFeedbackId('non-existent')
      expect(issue).toBeUndefined()
    })
  })

  describe('listCreatedIssues', () => {
    it('should list all created issues', async () => {
      const feedback1: BetaFeedback = {
        id: 'feedback-list-1',
        userId: 'user-1',
        type: FeedbackType.BUG,
        message: 'Issue 1',
        status: 'pending',
        createdAt: Date.now(),
      }

      const feedback2: BetaFeedback = {
        id: 'feedback-list-2',
        userId: 'user-2',
        type: FeedbackType.FEATURE_REQUEST,
        message: 'Issue 2',
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue
        .mockResolvedValueOnce({
          number: 118,
          html_url: 'https://github.com/repo/issues/118',
        })
        .mockResolvedValueOnce({
          number: 119,
          html_url: 'https://github.com/repo/issues/119',
        })

      await manager.createIssueFromFeedback(feedback1)
      await manager.createIssueFromFeedback(feedback2)

      const issues = await manager.listCreatedIssues()

      expect(issues).toHaveLength(2)
      expect(issues[0].number).toBe(118)
      expect(issues[1].number).toBe(119)
    })
  })

  describe('getIssueCreationStats', () => {
    it('should return issue creation statistics', async () => {
      const feedbacks: BetaFeedback[] = [
        {
          id: 'fb-1',
          userId: 'u-1',
          type: FeedbackType.BUG,
          message: 'Bug 1',
          severity: FeedbackSeverity.CRITICAL,
          status: 'pending',
          createdAt: Date.now(),
        },
        {
          id: 'fb-2',
          userId: 'u-2',
          type: FeedbackType.BUG,
          message: 'Bug 2',
          severity: FeedbackSeverity.HIGH,
          status: 'pending',
          createdAt: Date.now(),
        },
        {
          id: 'fb-3',
          userId: 'u-3',
          type: FeedbackType.FEATURE_REQUEST,
          message: 'Feature 1',
          status: 'pending',
          createdAt: Date.now(),
        },
      ]

      mockGitHubClient.createIssue
        .mockResolvedValueOnce({ number: 120, html_url: 'url1' })
        .mockResolvedValueOnce({ number: 121, html_url: 'url2' })
        .mockResolvedValueOnce({ number: 122, html_url: 'url3' })

      for (const fb of feedbacks) {
        await manager.createIssueFromFeedback(fb)
      }

      const stats = await manager.getIssueCreationStats()

      expect(stats.total).toBe(3)
      expect(stats.byType[FeedbackType.BUG]).toBe(2)
      expect(stats.byType[FeedbackType.FEATURE_REQUEST]).toBe(1)
      expect(stats.bySeverity[FeedbackSeverity.CRITICAL]).toBe(1)
      expect(stats.bySeverity[FeedbackSeverity.HIGH]).toBe(1)
    })
  })

  describe('auto-creation configuration', () => {
    it('should auto-create issues for critical bugs when enabled', async () => {
      const autoManager = new IssueCreationManager(mockGitHubClient, {
        autoCreate: true,
        autoCreateTypes: [FeedbackType.BUG],
        autoCreateSeverities: [FeedbackSeverity.CRITICAL, FeedbackSeverity.HIGH],
      })

      const feedback: BetaFeedback = {
        id: 'fb-auto',
        userId: 'u-auto',
        type: FeedbackType.BUG,
        message: 'Auto-created bug',
        severity: FeedbackSeverity.CRITICAL,
        status: 'pending',
        createdAt: Date.now(),
      }

      mockGitHubClient.createIssue.mockResolvedValue({
        number: 123,
        html_url: 'url',
      })

      const shouldCreate = await autoManager.shouldAutoCreate(feedback)
      expect(shouldCreate).toBe(true)

      await autoManager.close()
    })

    it('should not auto-create issues for low severity bugs', async () => {
      const autoManager = new IssueCreationManager(mockGitHubClient, {
        autoCreate: true,
        autoCreateTypes: [FeedbackType.BUG],
        autoCreateSeverities: [FeedbackSeverity.CRITICAL, FeedbackSeverity.HIGH],
      })

      const feedback: BetaFeedback = {
        id: 'fb-low',
        userId: 'u-low',
        type: FeedbackType.BUG,
        message: 'Low severity bug',
        severity: FeedbackSeverity.LOW,
        status: 'pending',
        createdAt: Date.now(),
      }

      const shouldCreate = await autoManager.shouldAutoCreate(feedback)
      expect(shouldCreate).toBe(false)

      await autoManager.close()
    })
  })
})
