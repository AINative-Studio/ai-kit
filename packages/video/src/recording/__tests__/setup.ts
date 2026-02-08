import { beforeAll } from 'vitest';

beforeAll(() => {
  // Mock MediaStream
  global.MediaStream = class MediaStream {
    id = 'mock-stream';
    active = true;

    getTracks() {
      return [];
    }

    getAudioTracks() {
      return [];
    }

    getVideoTracks() {
      return [];
    }

    addTrack() {}
    removeTrack() {}

    addEventListener() {}
    removeEventListener() {}
  } as any;

  // Mock MediaRecorder
  global.MediaRecorder = class MediaRecorder {
    state = 'inactive';
    ondataavailable: ((event: any) => void) | null = null;
    onstop: (() => void) | null = null;

    constructor(public stream: MediaStream, public options?: any) {}

    start(timeslice?: number) {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      setTimeout(() => this.onstop?.(), 0);
    }

    pause() {
      this.state = 'paused';
    }

    resume() {
      this.state = 'recording';
    }

    requestData() {}

    static isTypeSupported(type: string) {
      return true;
    }
  } as any;

  // Mock AudioContext
  global.AudioContext = class AudioContext {
    sampleRate = 44100;

    createMediaStreamSource() {
      return {
        connect: () => {},
        disconnect: () => {},
      } as any;
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
            array[i] = Math.floor(Math.random() * 128);
          }
        },
      } as any;
    }

    close() {
      return Promise.resolve();
    }
  } as any;
});
