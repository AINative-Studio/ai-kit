import { describe, it, expect } from 'vitest'
import { formatDuration, getStatusColor, getStatusBg } from '@/utils/helpers'

describe('helpers', () => {
  describe('formatDuration', () => {
    it('formats milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms')
    })

    it('formats seconds', () => {
      expect(formatDuration(5000)).toBe('5.0s')
    })

    it('formats minutes', () => {
      expect(formatDuration(120000)).toBe('2.0m')
    })
  })

  describe('getStatusColor', () => {
    it('returns correct color for running status', () => {
      expect(getStatusColor('running')).toBe('text-blue-500')
    })

    it('returns correct color for success status', () => {
      expect(getStatusColor('success')).toBe('text-green-500')
    })

    it('returns default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('text-gray-500')
    })
  })

  describe('getStatusBg', () => {
    it('returns correct background for running status', () => {
      expect(getStatusBg('running')).toBe('bg-blue-500/10')
    })

    it('returns correct background for error status', () => {
      expect(getStatusBg('error')).toBe('bg-red-500/10')
    })
  })
})
