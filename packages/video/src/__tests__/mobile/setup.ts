/**
 * Mobile Test Setup
 *
 * Setup required mocks for mobile testing environment
 */

import { beforeAll } from 'vitest'

beforeAll(() => {
  // Mock AudioContext for mobile tests
  if (!global.AudioContext) {
    global.AudioContext = class AudioContext {
      sampleRate = 44100

      createMediaStreamSource() {
        return {
          connect: () => {},
          disconnect: () => {},
        } as any
      }

      createAnalyser() {
        return {
          fftSize: 256,
          frequencyBinCount: 128,
          connect: () => {},
          disconnect: () => {},
          getByteFrequencyData: (array: Uint8Array) => {
            // Fill with mock data
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 128)
            }
          },
        } as any
      }

      close() {
        return Promise.resolve()
      }
    } as any
  }
})
