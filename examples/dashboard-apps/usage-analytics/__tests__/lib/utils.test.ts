import { describe, it, expect } from 'vitest'
import { cn, formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500')
      expect(result).toBe('text-red-500 bg-blue-500')
    })

    it('handles conditional classes', () => {
      const result = cn('base-class', false && 'hidden', true && 'visible')
      expect(result).toBe('base-class visible')
    })

    it('resolves tailwind conflicts', () => {
      const result = cn('p-4', 'p-6')
      expect(result).toBe('p-6')
    })
  })

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('handles small numbers', () => {
      expect(formatNumber(42)).toBe('42')
    })

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency with dollar sign', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('rounds to two decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00')
    })
  })

  describe('formatPercentage', () => {
    it('formats decimal as percentage', () => {
      expect(formatPercentage(0.125)).toBe('12.5%')
    })

    it('handles zero', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('handles 100%', () => {
      expect(formatPercentage(1)).toBe('100.0%')
    })
  })
})
