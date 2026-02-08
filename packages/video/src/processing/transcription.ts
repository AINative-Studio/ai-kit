import OpenAI from 'openai'
import type { TranscriptionCreateParams } from 'openai/resources/audio/transcriptions'

/**
 * Timestamp granularity options for Whisper transcription
 */
export type TimestampGranularity = 'word' | 'segment'

/**
 * Response format options for Whisper transcription
 */
export type ResponseFormat = 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'

/**
 * Transcription segment with timing information
 */
export interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
}

/**
 * Word-level timestamp information
 */
export interface TranscriptionWord {
  word: string
  start: number
  end: number
}

/**
 * Options for Whisper audio transcription
 */
export interface TranscriptionOptions {
  /**
   * OpenAI API key for authentication
   */
  apiKey: string

  /**
   * The language of the input audio in ISO-639-1 format (e.g., 'en', 'fr', 'es').
   * Providing this can improve accuracy and latency.
   */
  language?: string

  /**
   * Optional text to guide the model's style or continue a previous audio segment.
   * The prompt should match the audio language and can be used for:
   * - Maintaining consistent terminology (e.g., "Dr. Smith, AI, NLP")
   * - Speaker identification hints (e.g., "Speaker 1, Speaker 2")
   * - Ensuring proper punctuation and formatting
   */
  prompt?: string

  /**
   * The format of the transcript output.
   * - 'json': Returns basic JSON with text only
   * - 'text': Returns plain text
   * - 'srt': Returns SRT subtitle format
   * - 'verbose_json': Returns detailed JSON with timestamps and metadata
   * - 'vtt': Returns WebVTT subtitle format
   */
  response_format?: ResponseFormat

  /**
   * The sampling temperature, between 0 and 1.
   * Higher values like 0.8 will make the output more random,
   * while lower values like 0.2 will make it more focused and deterministic.
   */
  temperature?: number

  /**
   * The timestamp granularities to populate for this transcription.
   * Can include 'word' and/or 'segment' level timestamps.
   * Note: There is no additional latency for segment timestamps, but word timestamps
   * incur latency.
   */
  timestamp_granularities?: TimestampGranularity[]

  /**
   * The ID of the model to use. Only 'whisper-1' is currently available.
   */
  model?: string
}

/**
 * Result of audio transcription
 */
export interface TranscriptionResult {
  /**
   * The transcribed text
   */
  text: string

  /**
   * The language of the transcription (only available with verbose_json)
   */
  language?: string

  /**
   * Duration of the audio in seconds (only available with verbose_json)
   */
  duration?: number

  /**
   * Segment-level timestamps (only available when timestamp_granularities includes 'segment')
   */
  segments?: TranscriptionSegment[]

  /**
   * Word-level timestamps (only available when timestamp_granularities includes 'word')
   */
  words?: TranscriptionWord[]
}

/**
 * Transcribe audio using OpenAI's Whisper API
 *
 * @param audioFile - The audio file to transcribe (File or Blob)
 * @param options - Transcription options including API key and Whisper parameters
 * @returns Promise resolving to the transcription result
 *
 * @throws {Error} When API key is missing or API call fails
 */
export async function transcribeAudio(
  audioFile: File | Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  // Validate API key
  if (!options.apiKey || options.apiKey.trim() === '') {
    throw new Error('OpenAI API key is required')
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: options.apiKey,
  })

  try {
    // Build transcription parameters
    const params: TranscriptionCreateParams = {
      file: audioFile as File,
      model: options.model || 'whisper-1',
    }

    // Add optional parameters
    if (options.language) {
      params.language = options.language
    }

    if (options.prompt) {
      params.prompt = options.prompt
    }

    if (options.response_format) {
      params.response_format = options.response_format
    }

    if (options.temperature !== undefined) {
      params.temperature = options.temperature
    }

    if (options.timestamp_granularities && options.timestamp_granularities.length > 0) {
      params.timestamp_granularities = options.timestamp_granularities
    }

    // Call Whisper API
    const response = await openai.audio.transcriptions.create(params)

    // Parse and return result based on response type
    if (typeof response === 'string') {
      // For text, srt, vtt formats
      return { text: response }
    }

    // For json and verbose_json formats
    const result: TranscriptionResult = {
      text: (response as any).text,
    }

    // Add optional fields if present (from verbose_json)
    if ('language' in response) {
      result.language = (response as any).language
    }

    if ('duration' in response) {
      result.duration = (response as any).duration
    }

    if ('segments' in response) {
      result.segments = (response as any).segments
    }

    if ('words' in response) {
      result.words = (response as any).words
    }

    return result
  } catch (error) {
    // Re-throw with original error message
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to transcribe audio: Unknown error')
  }
}

/**
 * Utility function to format transcription segments into a readable format
 *
 * @param segments - Array of transcription segments with timestamps
 * @returns Formatted string with timestamps
 */
export function formatSegments(segments?: TranscriptionSegment[]): string {
  if (!segments || segments.length === 0) {
    return ''
  }

  return segments
    .map((segment) => {
      const start = formatTimestamp(segment.start)
      const end = formatTimestamp(segment.end)
      return `[${start} - ${end}] ${segment.text.trim()}`
    })
    .join('\n')
}

/**
 * Format seconds into MM:SS.s format
 *
 * @param seconds - Time in seconds
 * @returns Formatted timestamp string
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`
}

/**
 * Utility function to extract speaker-labeled text from transcription
 * Note: Whisper doesn't natively support speaker diarization, but you can
 * guide it using prompts like "Speaker 1, Speaker 2" to encourage labeling.
 *
 * @param text - Transcribed text potentially containing speaker labels
 * @returns Array of speaker segments
 */
export function extractSpeakers(text: string): Array<{ speaker: string; text: string }> {
  const speakerPattern = /(Speaker \d+|[A-Z][a-z]+ [A-Z][a-z]+):\s*([^.!?]+[.!?])/g
  const matches = [...text.matchAll(speakerPattern)]

  return matches.map((match) => ({
    speaker: match[1].trim(),
    text: match[2].trim(),
  }))
}

/**
 * Estimate the cost of transcribing audio based on duration
 * Whisper pricing: $0.006 per minute
 *
 * @param durationSeconds - Duration of audio in seconds
 * @returns Estimated cost in USD
 */
export function estimateTranscriptionCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  const costPerMinute = 0.006
  return minutes * costPerMinute
}
