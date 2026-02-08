import { NoiseProcessor } from './noise-processor';
import type { AudioRecordingOptions } from './types';

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseProcessor: NoiseProcessor | null = null;
  private chunks: Blob[] = [];
  private recording = false;
  private paused = false;
  private noiseCancellationEnabled = false;
  private beforeUnloadHandler: (() => void) | null = null;

  async startRecording(options: AudioRecordingOptions = {}): Promise<MediaStream> {
    if (this.recording) {
      throw new Error('Already recording');
    }

    const {
      microphone = true,
      systemAudio: _systemAudio = false, // Reserved for future system audio capture
      noiseCancellation = true,
      echoCancellation = true,
      sampleRate = 44100,
    } = options;

    // Build audio constraints
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation,
      noiseSuppression: noiseCancellation,
      sampleRate,
    };

    // Get user media stream
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: microphone ? audioConstraints : false,
    });

    // Setup audio context for level monitoring and processing
    this.audioContext = new AudioContext({ sampleRate });
    const source = this.audioContext.createMediaStreamSource(this.stream);

    // Setup analyser for level monitoring
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    // Setup noise processing if enabled
    if (noiseCancellation) {
      this.noiseProcessor = new NoiseProcessor();
      this.noiseCancellationEnabled = true;
    }

    // Setup MediaRecorder
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Setup beforeunload handler to cleanup on page unload
    this.beforeUnloadHandler = () => {
      this.cleanup();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.recording = true;
    this.paused = false;

    return this.stream;
  }

  async stopRecording(): Promise<Blob> {
    if (!this.recording) {
      throw new Error('Not recording');
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        throw new Error('MediaRecorder not initialized');
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.stream?.getTracks().forEach(track => track.stop());
    });
  }

  pauseRecording(): void {
    if (!this.recording) {
      throw new Error('Not recording');
    }

    if (this.paused) {
      throw new Error('Already paused');
    }

    this.mediaRecorder?.pause();
    this.paused = true;
  }

  resumeRecording(): void {
    if (!this.paused) {
      throw new Error('Not paused');
    }

    this.mediaRecorder?.resume();
    this.paused = false;
  }

  getAudioLevel(): number {
    if (!this.analyser) {
      return 0;
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArray.length;

    // Normalize to 0-1 range
    return average / 255;
  }

  enableNoiseCancellation(): void {
    if (!this.noiseProcessor) {
      this.noiseProcessor = new NoiseProcessor();
    }
    this.noiseCancellationEnabled = true;
  }

  disableNoiseCancellation(): void {
    this.noiseCancellationEnabled = false;
  }

  isNoiseCancellationEnabled(): boolean {
    return this.noiseCancellationEnabled;
  }

  isRecording(): boolean {
    return this.recording;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private cleanup(): void {
    this.recording = false;
    this.paused = false;
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;

    // Remove beforeunload event listener
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }
}
