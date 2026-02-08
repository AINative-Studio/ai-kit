/**
 * Codec Support Detection Utilities
 *
 * Built by AINative
 */

import type { CodecSupport } from '../types';

/**
 * List of codec MIME types to check in order of preference
 */
const CODEC_PRIORITY = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8',
  'video/webm;codecs=h264,opus',
  'video/webm;codecs=h264',
  'video/webm',
  'video/mp4;codecs=h264,aac',
  'video/mp4;codecs=h264',
  'video/mp4',
];

/**
 * Check if a specific MIME type is supported by MediaRecorder
 */
export function isCodecSupported(mimeType: string): boolean {
  if (typeof MediaRecorder === 'undefined') {
    return false;
  }

  try {
    return MediaRecorder.isTypeSupported(mimeType);
  } catch {
    return false;
  }
}

/**
 * Get all supported codecs from the priority list
 */
export function getSupportedCodecs(): string[] {
  if (typeof MediaRecorder === 'undefined') {
    return [];
  }

  return CODEC_PRIORITY.filter(isCodecSupported);
}

/**
 * Get the best supported codec based on priority
 */
export function getBestCodec(): CodecSupport {
  const availableCodecs = getSupportedCodecs();

  if (availableCodecs.length === 0) {
    return {
      mimeType: '',
      supported: false,
      availableCodecs: [],
    };
  }

  return {
    mimeType: availableCodecs[0],
    supported: true,
    availableCodecs,
  };
}

/**
 * Check if MediaRecorder API is available
 */
export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getDisplayMedia !== 'undefined'
  );
}

/**
 * Get codec file extension from MIME type
 */
export function getCodecExtension(mimeType: string): string {
  if (mimeType.startsWith('video/webm')) {
    return 'webm';
  }
  if (mimeType.startsWith('video/mp4')) {
    return 'mp4';
  }
  if (mimeType.startsWith('video/x-matroska')) {
    return 'mkv';
  }
  return 'webm'; // default
}
