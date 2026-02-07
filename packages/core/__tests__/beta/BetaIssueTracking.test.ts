/**
 * Tests for Beta Issue Tracking API
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BetaIssueTracker } from '../../src/beta/BetaIssueTracker'
import { IssueCreateRequest, IssuePriority, IssueStatus, IssueType } from '../../src/beta/types'

describe('BetaIssueTracker', () => {
  let tracker: BetaIssueTracker

  beforeEach(() => {
    tracker = new BetaIssueTracker()
  })

  afterEach(async () => {
    await tracker.close()
  })

  describe('createIssue', () => {
    it('should create a new issue from feedback', async () => {
      const request: IssueCreateRequest = {
        feedbackId: 'feedback-123',
        title: 'Critical API Bug',
        description: 'API returns 500 error on signup',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      }

      const issue = await tracker.createIssue(request)

      expect(issue.id).toBeDefined()
      expect(issue.feedbackId).toBe('feedback-123')
      expect(issue.title).toBe('Critical API Bug')
      expect(issue.type).toBe(IssueType.BUG)
      expect(issue.priority).toBe(IssuePriority.CRITICAL)
      expect(issue.status).toBe(IssueStatus.OPEN)
      expect(issue.createdAt).toBeDefined()
    })

    it('should validate required fields', async () => {
      const request = {
        feedbackId: 'feedback-123',
      } as IssueCreateRequest

      await expect(
        tracker.createIssue(request)
      ).rejects.toThrow('Missing required fields')
    })

    it('should generate unique issue IDs', async () => {
      const issues = await Promise.all([
        tracker.createIssue({
          feedbackId: 'feedback-1',
          title: 'Issue 1',
          description: 'Description 1',
          type: IssueType.BUG,
          priority: IssuePriority.HIGH,
        }),
        tracker.createIssue({
          feedbackId: 'feedback-2',
          title: 'Issue 2',
          description: 'Description 2',
          type: IssueType.FEATURE,
          priority: IssuePriority.MEDIUM,
        }),
      ])

      expect(issues[0].id).not.toBe(issues[1].id)
    })

    it('should allow optional assignee', async () => {
      const request: IssueCreateRequest = {
        feedbackId: 'feedback-123',
        title: 'Bug to fix',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
        assignee: 'developer@example.com',
      }

      const issue = await tracker.createIssue(request)

      expect(issue.assignee).toBe('developer@example.com')
    })
  })

  describe('getIssueById', () => {
    it('should retrieve an issue by ID', async () => {
      const created = await tracker.createIssue({
        feedbackId: 'feedback-123',
        title: 'Test Issue',
        description: 'Test',
        type: IssueType.BUG,
        priority: IssuePriority.MEDIUM,
      })

      const issue = await tracker.getIssueById(created.id)

      expect(issue).toBeDefined()
      expect(issue?.title).toBe('Test Issue')
    })

    it('should return undefined for non-existent issue', async () => {
      const issue = await tracker.getIssueById('non-existent-id')
      expect(issue).toBeUndefined()
    })
  })

  describe('updateIssueStatus', () => {
    it('should update issue status to IN_PROGRESS', async () => {
      const issue = await tracker.createIssue({
        feedbackId: 'feedback-123',
        title: 'Bug',
        description: 'Fix this',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      const updated = await tracker.updateIssueStatus(issue.id, IssueStatus.IN_PROGRESS)

      expect(updated.status).toBe(IssueStatus.IN_PROGRESS)
    })

    it('should update issue status to RESOLVED and set resolvedAt', async () => {
      const issue = await tracker.createIssue({
        feedbackId: 'feedback-123',
        title: 'Bug',
        description: 'Fix this',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      const updated = await tracker.updateIssueStatus(issue.id, IssueStatus.RESOLVED)

      expect(updated.status).toBe(IssueStatus.RESOLVED)
      expect(updated.resolvedAt).toBeDefined()
    })

    it('should throw error for non-existent issue', async () => {
      await expect(
        tracker.updateIssueStatus('non-existent-id', IssueStatus.RESOLVED)
      ).rejects.toThrow('Issue not found')
    })
  })

  describe('assignIssue', () => {
    it('should assign issue to developer', async () => {
      const issue = await tracker.createIssue({
        feedbackId: 'feedback-123',
        title: 'Bug',
        description: 'Fix this',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      const updated = await tracker.assignIssue(issue.id, 'dev@example.com')

      expect(updated.assignee).toBe('dev@example.com')
    })

    it('should throw error for non-existent issue', async () => {
      await expect(
        tracker.assignIssue('non-existent-id', 'dev@example.com')
      ).rejects.toThrow('Issue not found')
    })
  })

  describe('listIssues', () => {
    it('should list all issues', async () => {
      await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Issue 1',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Issue 2',
        description: 'Description',
        type: IssueType.FEATURE,
        priority: IssuePriority.MEDIUM,
      })

      const issues = await tracker.listIssues()

      expect(issues.length).toBe(2)
    })

    it('should filter issues by status', async () => {
      const issue1 = await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Issue 1',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Issue 2',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.MEDIUM,
      })

      await tracker.updateIssueStatus(issue1.id, IssueStatus.RESOLVED)

      const openIssues = await tracker.listIssues({ status: IssueStatus.OPEN })
      const resolvedIssues = await tracker.listIssues({ status: IssueStatus.RESOLVED })

      expect(openIssues.length).toBe(1)
      expect(resolvedIssues.length).toBe(1)
      expect(resolvedIssues[0].id).toBe(issue1.id)
    })

    it('should filter issues by priority', async () => {
      await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Critical Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Low Priority',
        description: 'Description',
        type: IssueType.IMPROVEMENT,
        priority: IssuePriority.LOW,
      })

      const critical = await tracker.listIssues({ priority: IssuePriority.CRITICAL })

      expect(critical.length).toBe(1)
      expect(critical[0].priority).toBe(IssuePriority.CRITICAL)
    })

    it('should filter issues by type', async () => {
      await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Feature',
        description: 'Description',
        type: IssueType.FEATURE,
        priority: IssuePriority.MEDIUM,
      })

      const bugs = await tracker.listIssues({ type: IssueType.BUG })
      const features = await tracker.listIssues({ type: IssueType.FEATURE })

      expect(bugs.length).toBe(1)
      expect(features.length).toBe(1)
    })

    it('should sort issues by priority (high to low)', async () => {
      await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Low Priority',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.LOW,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Critical',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-3',
        title: 'High',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      const issues = await tracker.listIssues({ sortByPriority: true })

      expect(issues[0].priority).toBe(IssuePriority.CRITICAL)
      expect(issues[1].priority).toBe(IssuePriority.HIGH)
      expect(issues[2].priority).toBe(IssuePriority.LOW)
    })
  })

  describe('getCriticalIssues', () => {
    it('should retrieve all critical priority issues', async () => {
      await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Critical Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Low Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.LOW,
      })

      const critical = await tracker.getCriticalIssues()

      expect(critical.length).toBe(1)
      expect(critical[0].priority).toBe(IssuePriority.CRITICAL)
    })

    it('should only return unresolved critical issues', async () => {
      const issue = await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Critical Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Another Critical',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      })

      await tracker.updateIssueStatus(issue.id, IssueStatus.RESOLVED)

      const critical = await tracker.getCriticalIssues()

      expect(critical.length).toBe(1)
    })
  })

  describe('getIssueStats', () => {
    it('should return issue statistics', async () => {
      const issue1 = await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
      })

      await tracker.createIssue({
        feedbackId: 'feedback-2',
        title: 'Feature',
        description: 'Description',
        type: IssueType.FEATURE,
        priority: IssuePriority.MEDIUM,
      })

      await tracker.updateIssueStatus(issue1.id, IssueStatus.RESOLVED)

      const stats = await tracker.getIssueStats()

      expect(stats.total).toBe(2)
      expect(stats.byType[IssueType.BUG]).toBe(1)
      expect(stats.byType[IssueType.FEATURE]).toBe(1)
      expect(stats.byPriority[IssuePriority.CRITICAL]).toBe(1)
      expect(stats.byPriority[IssuePriority.MEDIUM]).toBe(1)
      expect(stats.open).toBe(1)
      expect(stats.inProgress).toBe(0)
      expect(stats.resolved).toBe(1)
      expect(stats.criticalOpen).toBe(0)
    })
  })

  describe('addComment', () => {
    it('should add comment to issue', async () => {
      const issue = await tracker.createIssue({
        feedbackId: 'feedback-1',
        title: 'Bug',
        description: 'Description',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
      })

      const updated = await tracker.addComment(issue.id, {
        author: 'dev@example.com',
        content: 'Working on this',
      })

      expect(updated.comments).toBeDefined()
      expect(updated.comments?.length).toBe(1)
      expect(updated.comments?.[0].content).toBe('Working on this')
      expect(updated.comments?.[0].author).toBe('dev@example.com')
      expect(updated.comments?.[0].createdAt).toBeDefined()
    })

    it('should throw error for non-existent issue', async () => {
      await expect(
        tracker.addComment('non-existent-id', {
          author: 'dev@example.com',
          content: 'Comment',
        })
      ).rejects.toThrow('Issue not found')
    })
  })
})
