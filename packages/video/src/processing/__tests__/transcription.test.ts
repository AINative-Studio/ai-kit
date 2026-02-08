import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transcribeAudio, TranscriptionOptions, formatSegments, extractSpeakers, estimateTranscriptionCost } from '../transcription'
import OpenAI from 'openai'

vi.mock('openai', () => {
  const mockCreate = vi.fn()
  return {
    default: vi.fn(() => ({
      audio: {
        transcriptions: {
          create: mockCreate,
        },
      },
    })),
    mockCreate,
  }
})

describe('Whisper Transcription', () => {
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    const OpenAIModule = vi.mocked(OpenAI)
    const instance = new OpenAIModule()
    mockCreate = instance.audio.transcriptions.create as ReturnType<typeof vi.fn>
  })

  describe('transcribeAudio', () => {
    it('should successfully transcribe audio with basic options', async () => {
      const mockResponse = {
        text: 'Hello, this is a test transcription.',
      }

      mockCreate.mockResolvedValue(mockResponse)

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      const options: TranscriptionOptions = {
        apiKey: 'test-api-key',
      }

      const result = await transcribeAudio(audioFile, options)

      expect(result.text).toBe('Hello, this is a test transcription.')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          file: audioFile,
          model: 'whisper-1',
        })
      )
    })

    it('should include timestamps when requested', async () => {
      const mockResponse = {
        text: 'Hello world',
        segments: [
          { id: 0, start: 0.0, end: 1.5, text: 'Hello' },
          { id: 1, start: 1.5, end: 2.5, text: 'world' },
        ],
      }

      mockCreate.mockResolvedValue(mockResponse)

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      const options: TranscriptionOptions = {
        apiKey: 'test-api-key',
        timestamp_granularities: ['segment'],
        response_format: 'verbose_json',
      }

      const result = await transcribeAudio(audioFile, options)

      expect(result.segments).toBeDefined()
      expect(result.segments).toHaveLength(2)
      expect(result.segments?.[0].start).toBe(0.0)
    })

    it('should support language parameter', async () => {
      mockCreate.mockResolvedValue({ text: 'Bonjour le monde' })

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      await transcribeAudio(audioFile, { apiKey: 'test-api-key', language: 'fr' })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ language: 'fr' }))
    })

    it('should support temperature parameter', async () => {
      mockCreate.mockResolvedValue({ text: 'Test' })

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      await transcribeAudio(audioFile, { apiKey: 'test-api-key', temperature: 0.2 })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.2 }))
    })

    it('should support prompt for context', async () => {
      mockCreate.mockResolvedValue({ text: 'Dr. Smith discussed AI research.' })

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      await transcribeAudio(audioFile, { apiKey: 'test-api-key', prompt: 'Dr. Smith, AI' })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'Dr. Smith, AI' }))
    })

    it('should handle word-level timestamps', async () => {
      const mockResponse = {
        text: 'Hello world',
        words: [
          { word: 'Hello', start: 0.0, end: 0.8 },
          { word: 'world', start: 1.0, end: 1.5 },
        ],
      }

      mockCreate.mockResolvedValue(mockResponse)

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      const result = await transcribeAudio(audioFile, {
        apiKey: 'test-api-key',
        timestamp_granularities: ['word'],
        response_format: 'verbose_json',
      })

      expect(result.words).toBeDefined()
      expect(result.words).toHaveLength(2)
    })

    it('should throw error when API key is missing', async () => {
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })

      await expect(transcribeAudio(audioFile, { apiKey: '' })).rejects.toThrow(
        'OpenAI API key is required'
      )
    })

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'))

      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })

      await expect(transcribeAudio(audioFile, { apiKey: 'test-api-key' })).rejects.toThrow(
        'API rate limit exceeded'
      )
    })
  })

  describe('Utility functions', () => {
    it('should format segments correctly', () => {
      const segments = [
        { id: 0, start: 0.0, end: 2.5, text: 'Hello' },
        { id: 1, start: 2.5, end: 5.0, text: 'world' },
      ]

      const formatted = formatSegments(segments)
      expect(formatted).toContain('[00:00.0 - 00:02.5] Hello')
      expect(formatted).toContain('[00:02.5 - 00:05.0] world')
    })

    it('should extract speakers from text', () => {
      const text = 'Speaker 1: Hello there. Speaker 2: Hi, how are you?'
      const speakers = extractSpeakers(text)

      expect(speakers).toHaveLength(2)
      expect(speakers[0]).toEqual({ speaker: 'Speaker 1', text: 'Hello there.' })
    })

    it('should estimate transcription cost', () => {
      const cost = estimateTranscriptionCost(300) // 5 minutes
      expect(cost).toBe(0.03)
    })
  })
})
