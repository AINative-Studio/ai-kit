/**
 * Transcription service tests
 * Built by AINative
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranscriptionService } from '../transcription';
import type {
  TranscriptionOptions,
  Transcription,
  TimestampedTranscription,
  SpeakerSegments,
  TranscriptSegment
} from '../types';

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let mockAudioBlob: Blob;

  beforeEach(() => {
    service = new TranscriptionService({
      apiKey: 'test-api-key'
    });
    mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/mp3' });
  });

  describe('transcribe', () => {
    it('should transcribe audio blob to text', async () => {
      const result = await service.transcribe(mockAudioBlob);

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('duration');
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('should use specified language option', async () => {
      const options: TranscriptionOptions = {
        language: 'en'
      };

      const result = await service.transcribe(mockAudioBlob, options);

      expect(result.language).toBe('en');
    });

    it('should use specified model', async () => {
      const options: TranscriptionOptions = {
        model: 'whisper-1'
      };

      const result = await service.transcribe(mockAudioBlob, options);

      expect(result).toHaveProperty('text');
    });

    it('should apply temperature setting', async () => {
      const options: TranscriptionOptions = {
        temperature: 0.2
      };

      const result = await service.transcribe(mockAudioBlob, options);

      expect(result).toHaveProperty('text');
    });

    it('should handle empty audio blob', async () => {
      const emptyBlob = new Blob([''], { type: 'audio/mp3' });

      await expect(
        service.transcribe(emptyBlob)
      ).rejects.toThrow();
    });

    it('should throw error for invalid API key', async () => {
      const invalidService = new TranscriptionService({
        apiKey: ''
      });

      await expect(
        invalidService.transcribe(mockAudioBlob)
      ).rejects.toThrow();
    });

    it('should include duration in response', async () => {
      const result = await service.transcribe(mockAudioBlob);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('transcribeWithTimestamps', () => {
    it('should return transcription with timestamp segments', async () => {
      const result = await service.transcribeWithTimestamps(mockAudioBlob);

      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('duration');
      expect(Array.isArray(result.segments)).toBe(true);
    });

    it('should include start and end times for each segment', async () => {
      const result = await service.transcribeWithTimestamps(mockAudioBlob);

      if (result.segments.length > 0) {
        const segment = result.segments[0];
        expect(segment).toHaveProperty('text');
        expect(segment).toHaveProperty('start');
        expect(segment).toHaveProperty('end');
        expect(segment.start).toBeGreaterThanOrEqual(0);
        expect(segment.end).toBeGreaterThan(segment.start);
      }
    });

    it('should order segments chronologically', async () => {
      const result = await service.transcribeWithTimestamps(mockAudioBlob);

      for (let i = 1; i < result.segments.length; i++) {
        expect(result.segments[i].start).toBeGreaterThanOrEqual(
          result.segments[i - 1].end
        );
      }
    });

    it('should combine segment texts to full text', async () => {
      const result = await service.transcribeWithTimestamps(mockAudioBlob);

      const combinedText = result.segments.map(s => s.text).join(' ').trim();
      expect(result.text.replace(/\s+/g, ' ')).toContain(
        combinedText.replace(/\s+/g, ' ').substring(0, 50)
      );
    });
  });

  describe('identifySpeakers', () => {
    it('should identify speaker segments', async () => {
      const result = await service.identifySpeakers(mockAudioBlob);

      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('speakers');
      expect(result).toHaveProperty('totalDuration');
      expect(Array.isArray(result.segments)).toBe(true);
      expect(Array.isArray(result.speakers)).toBe(true);
    });

    it('should assign speakers to segments', async () => {
      const result = await service.identifySpeakers(mockAudioBlob);

      if (result.segments.length > 0) {
        const segment = result.segments[0];
        expect(segment).toHaveProperty('speaker');
        expect(typeof segment.speaker).toBe('string');
      }
    });

    it('should list unique speakers', async () => {
      const result = await service.identifySpeakers(mockAudioBlob);

      const uniqueSpeakers = new Set(result.speakers);
      expect(uniqueSpeakers.size).toBe(result.speakers.length);
    });

    it('should calculate total duration', async () => {
      const result = await service.identifySpeakers(mockAudioBlob);

      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
      expect(typeof result.totalDuration).toBe('number');
    });

    it('should handle single speaker audio', async () => {
      const result = await service.identifySpeakers(mockAudioBlob);

      expect(result.speakers.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain segment chronological order', async () => {
      const result = await service.identifySpeakers(mockAudioBlob);

      for (let i = 1; i < result.segments.length; i++) {
        expect(result.segments[i].start).toBeGreaterThanOrEqual(
          result.segments[i - 1].end
        );
      }
    });
  });

  describe('configuration', () => {
    it('should allow custom API endpoint', () => {
      const customService = new TranscriptionService({
        apiKey: 'test-key',
        endpoint: 'https://custom.api.com'
      });

      expect(customService).toBeInstanceOf(TranscriptionService);
    });

    it('should validate required API key', () => {
      expect(() => {
        new TranscriptionService({ apiKey: '' });
      }).toThrow();
    });

    it('should use default model when not specified', async () => {
      const result = await service.transcribe(mockAudioBlob);

      expect(result).toHaveProperty('text');
    });
  });

  describe('error handling', () => {
    it('should handle API rate limit errors', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(null, { status: 429 })
      );

      await expect(
        service.transcribe(mockAudioBlob)
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        service.transcribe(mockAudioBlob)
      ).rejects.toThrow();
    });

    it('should handle invalid audio format', async () => {
      const invalidBlob = new Blob(['fake'], { type: 'text/plain' });

      await expect(
        service.transcribe(invalidBlob)
      ).rejects.toThrow();
    });

    it('should handle file size exceeding limit', async () => {
      const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)], {
        type: 'audio/mp3'
      });

      await expect(
        service.transcribe(largeBlob)
      ).rejects.toThrow();
    });
  });
});
