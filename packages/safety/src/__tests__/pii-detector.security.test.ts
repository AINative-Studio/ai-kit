/**
 * Security Tests for PII Detector
 *
 * Tests for:
 * - PII detection accuracy
 * - False positives prevention
 * - Regex injection prevention
 * - Performance (DoS prevention)
 * - Edge cases and boundary conditions
 *
 * Refs #67
 */

import { PatternPriority } from "../pii-types"
import { describe, it, expect } from 'vitest'
import { PIIDetector } from '../PIIDetector'
import { PIIType, Region } from '../types'

describe('PII Detector Security Tests', () => {
  describe('Detection Accuracy', () => {
    it('should detect email addresses', () => {
      const detector = new PIIDetector()
      const result = detector.detect('Contact me at user@example.com for details')

      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].type).toBe(PIIType.EMAIL)
      expect(result.matches[0].value).toBe('user@example.com')
      expect(result.matches[0].confidence).toBeGreaterThanOrEqual(0.95)
    })

    it('should detect US phone numbers', () => {
      const detector = new PIIDetector({ regions: [Region.US] })
      const result = detector.detect('Call me at (555) 123-4567')

      expect(result.matches.length).toBeGreaterThan(0)
      const phoneMatch = result.matches.find(m => m.type === PIIType.PHONE)
      expect(phoneMatch).toBeDefined()
      expect(phoneMatch?.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should detect credit card numbers with Luhn validation', () => {
      const detector = new PIIDetector({ validate: true })
      // Valid Visa test card: 4532015112830366
      const result = detector.detect('Card number: 4532015112830366')

      expect(result.matches.length).toBeGreaterThan(0)
      const cardMatch = result.matches.find(m => m.type === PIIType.CREDIT_CARD)
      expect(cardMatch).toBeDefined()
      expect(cardMatch?.metadata?.validated).toBe(true)
    })

    it('should detect Social Security Numbers', () => {
      const detector = new PIIDetector({ regions: [Region.US], validate: true })
      const result = detector.detect('SSN: 123-45-6789')

      expect(result.matches.length).toBeGreaterThan(0)
      const ssnMatch = result.matches.find(m => m.type === PIIType.SSN)
      expect(ssnMatch).toBeDefined()
    })

    it('should detect IP addresses', () => {
      const detector = new PIIDetector()
      const result = detector.detect('Server IP: 192.168.1.1')

      expect(result.matches.length).toBeGreaterThan(0)
      const ipMatch = result.matches.find(m => m.type === PIIType.IP_ADDRESS)
      expect(ipMatch).toBeDefined()
      expect(ipMatch?.value).toBe('192.168.1.1')
    })
  })

  describe('False Positives Prevention', () => {
    it('should not detect invalid credit card numbers', () => {
      const detector = new PIIDetector({ validate: true })
      // Invalid Luhn checksum
      const result = detector.detect('Card: 1234567890123456')

      const cardMatch = result.matches.find(m => m.type === PIIType.CREDIT_CARD)
      expect(cardMatch).toBeUndefined()
    })

    it('should not detect invalid SSNs', () => {
      const detector = new PIIDetector({ regions: [Region.US], validate: true })
      // Invalid SSN (area 000 is invalid)
      const result = detector.detect('SSN: 000-12-3456')

      const ssnMatch = result.matches.find(m => m.type === PIIType.SSN)
      expect(ssnMatch).toBeUndefined()
    })

    it('should not detect common false positive patterns', () => {
      const detector = new PIIDetector()
      const result = detector.detect('Version 1.2.3.4 released on 01/02/2024')

      // Should not detect version number as IP
      // Date might be detected as DOB, which is acceptable
      const ipMatches = result.matches.filter(m => m.type === PIIType.IP_ADDRESS)
      expect(ipMatches).toHaveLength(0)
    })
  })

  describe('ReDoS (Regular Expression Denial of Service) Prevention', () => {
    it('should handle extremely long input without hanging', () => {
      const detector = new PIIDetector()
      const longText = 'a'.repeat(100000) // 100KB of text
      const startTime = Date.now()

      const result = detector.detect(longText)

      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(result.matches).toHaveLength(0)
    })

    it('should handle text with many potential false matches efficiently', () => {
      const detector = new PIIDetector()
      // Text with many @ symbols that might look like emails
      const text = Array(1000).fill('user@').join(' ')
      const startTime = Date.now()

      const result = detector.detect(text)

      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(3000)
    })

    it('should handle malicious regex input patterns', () => {
      const detector = new PIIDetector()
      // Patterns that might cause regex backtracking
      const maliciousPatterns = [
        'a'.repeat(100) + '!',
        '(' + 'a'.repeat(100) + ')*',
        'x'.repeat(100) + '@example.com',
      ]

      for (const pattern of maliciousPatterns) {
        const startTime = Date.now()
        const _result = detector.detect(pattern)
        const executionTime = Date.now() - startTime

        expect(executionTime).toBeLessThan(1000)
      }
    })
  })

  describe('Custom Pattern Security', () => {
    it('should validate custom pattern before registration', () => {
      const detector = new PIIDetector()

      expect(() => {
        detector.registerCustomPattern({
          id: 'invalid-pattern',
          name: 'Invalid',
          pattern: /(?:a+)+b/, // Catastrophic backtracking pattern
          priority: PatternPriority.LOW,
          enabled: true,
        })
      }).toThrow()
    })

    it('should reject custom patterns with invalid IDs', () => {
      const detector = new PIIDetector()

      expect(() => {
        detector.registerCustomPattern({
          id: 'invalid id with spaces',
          name: 'Invalid',
          pattern: /test/g,
          priority: PatternPriority.LOW,
          enabled: true,
        })
      }).toThrow()
    })

    it('should safely handle custom patterns with special characters', () => {
      const detector = new PIIDetector()

      detector.registerCustomPattern({
        id: 'safe-pattern',
        name: 'Safe Pattern',
        pattern: /\[REDACTED\]/g,
        priority: PatternPriority.LOW,
        enabled: true,
      })

      const result = detector.detectWithCustomPatterns('Text with [REDACTED] content')
      expect(result.matches.length).toBeGreaterThan(0)
    })
  })

  describe('Redaction Security', () => {
    it('should redact PII completely', () => {
      const detector = new PIIDetector({ redact: true })
      const result = detector.detect('Email: user@example.com')

      expect(result.redactedText).toBeDefined()
      expect(result.redactedText).not.toContain('user@example.com')
      expect(result.redactedText).toContain('*'.repeat('user@example.com'.length))
    })

    it('should not leak PII in partial redaction', () => {
      const detector = new PIIDetector({
        redact: true,
        redactionChar: 'X',
      })
      const result = detector.detect('SSN: 123-45-6789')

      expect(result.redactedText).toBeDefined()
      expect(result.redactedText).not.toContain('123-45-6789')
      expect(result.redactedText).toContain('X')
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty input', () => {
      const detector = new PIIDetector()
      const result = detector.detect('')

      expect(result.matches).toHaveLength(0)
      expect(result.summary.hasPII).toBe(false)
    })

    it('should handle null-like strings', () => {
      const detector = new PIIDetector()
      const result = detector.detect('null undefined NaN')

      expect(result.matches).toHaveLength(0)
    })

    it('should handle special characters and unicode', () => {
      const detector = new PIIDetector()
      const result = detector.detect('Email: user@example.com 😀 测试')

      const emailMatch = result.matches.find(m => m.type === PIIType.EMAIL)
      expect(emailMatch).toBeDefined()
    })

    it('should handle overlapping matches correctly', () => {
      const detector = new PIIDetector()
      const result = detector.detect('Contact: user@example.com or user@example.com')

      // Should detect both emails
      const emailMatches = result.matches.filter(m => m.type === PIIType.EMAIL)
      expect(emailMatches.length).toBeGreaterThan(0)
    })

    it('should handle multiple PII types in one text', () => {
      const detector = new PIIDetector()
      const text = 'Contact: user@example.com, Phone: (555) 123-4567, IP: 192.168.1.1'
      const result = detector.detect(text)

      expect(result.matches.length).toBeGreaterThanOrEqual(3)
      expect(result.summary.totalMatches).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Configuration Security', () => {
    it('should respect confidence threshold', () => {
      const detector = new PIIDetector({ minConfidence: 0.95 })
      const result = detector.detect('Might be a name: John Smith')

      // Name detection has lower confidence, should be filtered
      const nameMatches = result.matches.filter(m => m.type === PIIType.NAME)
      expect(nameMatches.every(m => m.confidence >= 0.95)).toBe(true)
    })

    it('should respect enabled types configuration', () => {
      const detector = new PIIDetector({
        enabledTypes: [PIIType.EMAIL],
      })
      const result = detector.detect('Email: user@example.com Phone: (555) 123-4567')

      expect(result.matches.every(m => m.type === PIIType.EMAIL)).toBe(true)
      expect(result.matches.some(m => m.type === PIIType.PHONE)).toBe(false)
    })

    it('should respect region configuration', () => {
      const detector = new PIIDetector({ regions: [Region.US] })
      const config = detector.getConfig()

      expect(config.regions).toContain(Region.US)
    })
  })

  describe('Performance and Resource Limits', () => {
    it('should handle batch detection efficiently', () => {
      const detector = new PIIDetector()
      const texts = Array(100).fill('Email: user@example.com')
      const startTime = Date.now()

      texts.forEach(text => detector.detect(text))

      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(5000) // 100 detections in under 5 seconds
    })

    it('should not consume excessive memory', () => {
      const detector = new PIIDetector()
      const initialMemory = process.memoryUsage().heapUsed

      // Process 1000 texts
      for (let i = 0; i < 1000; i++) {
        detector.detect('Test text with email@example.com and phone (555) 123-4567')
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // MB

      // Should not increase memory by more than 50MB
      expect(memoryIncrease).toBeLessThan(50)
    })
  })
})
