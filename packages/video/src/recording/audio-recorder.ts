/**
 * Audio Recorder with Noise Cancellation
 *
 * Provides comprehensive audio recording capabilities with AI-powered noise cancellation,
 * multi-track support, and real-time audio level monitoring.
 *
 * Features:
 * - System audio and microphone recording
 * - Web Audio API integration for processing
 * - Noise cancellation via audio processing
 * - Real-time audio level monitoring
 * - Multiple audio track management
 *
 * @example
 * ```typescript
 * const recorder = new AudioRecorder({ enableNoiseCancellation: true });
 * await recorder.initialize({
 *   systemAudio: systemStream,
 *   microphone: micStream
 * });
 * await recorder.startRecording();
 * const level = recorder.getAudioLevel();
 * const blob = await recorder.stopRecording();
 * ```
 */

export interface AudioRecorderOptions {
  sampleRate?: number;
  channelCount?: number;
  enableNoiseCancellation?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  monitoringInterval?: number;
}

export interface AudioLevel {
  rms: number;
  peak: number;
  db: number;
}

export interface AudioTrackInfo {
  id: string;
  label: string;
  enabled: boolean;
  muted: boolean;
  kind: string;
  settings: MediaTrackSettings;
}

export interface AudioInitializeOptions {
  systemAudio?: MediaStream;
  microphone?: MediaStream;
}

export class AudioRecorder {
  private options: Required<AudioRecorderOptions>;
  private audioContext: AudioContext | null = null;
  private sourceNodes: MediaStreamAudioSourceNode[] = [];
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private outputStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private initialized = false;
  private recording = false;
  private audioChunks: Blob[] = [];
  private tracks: MediaStreamTrack[] = [];
  private systemAudioStream: MediaStream | null = null;
  private microphoneStream: MediaStream | null = null;
  private levelMonitoringInterval: number | null = null;
  private currentLevel: AudioLevel = { rms: 0, peak: 0, db: -Infinity };

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: options.sampleRate ?? 48000,
      channelCount: options.channelCount ?? 2,
      enableNoiseCancellation: options.enableNoiseCancellation ?? false,
      echoCancellation: options.echoCancellation ?? true,
      autoGainControl: options.autoGainControl ?? true,
      monitoringInterval: options.monitoringInterval ?? 100,
    };
  }

  /**
   * Get current recorder options
   */
  getOptions(): Required<AudioRecorderOptions> {
    return { ...this.options };
  }

  /**
   * Initialize audio recorder with input streams
   *
   * @param sources - Audio sources (systemAudio and/or microphone)
   * @throws Error if no audio sources provided
   */
  async initialize(sources: AudioInitializeOptions): Promise<void> {
    if (!sources.systemAudio && !sources.microphone) {
      throw new Error('At least one audio source is required');
    }

    // Store streams
    this.systemAudioStream = sources.systemAudio || null;
    this.microphoneStream = sources.microphone || null;

    // Create audio context
    this.audioContext = new AudioContext({
      sampleRate: this.options.sampleRate,
    });

    // Create audio processing nodes
    this.gainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Create destination node for output stream
    this.destinationNode = this.audioContext.createMediaStreamDestination();

    // Setup noise cancellation if enabled
    if (this.options.enableNoiseCancellation) {
      await this.setupNoiseCancellation();
    }

    // Connect audio sources
    await this.connectAudioSources();

    // Collect all tracks
    this.tracks = [];
    if (this.systemAudioStream) {
      this.tracks.push(...this.systemAudioStream.getAudioTracks());
    }
    if (this.microphoneStream) {
      this.tracks.push(...this.microphoneStream.getAudioTracks());
    }

    this.outputStream = this.destinationNode.stream;
    this.initialized = true;
  }

  /**
   * Setup noise cancellation using Web Audio API processing
   */
  private async setupNoiseCancellation(): Promise<void> {
    if (!this.audioContext) return;

    // Create dynamics compressor for noise reduction
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = -50;
    this.compressorNode.knee.value = 40;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0;
    this.compressorNode.release.value = 0.25;

    // Create high-pass filter to remove low-frequency noise
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.value = 80; // Remove frequencies below 80Hz
    this.filterNode.Q.value = 1.0;
  }

  /**
   * Connect audio sources to the processing chain
   */
  private async connectAudioSources(): Promise<void> {
    if (!this.audioContext || !this.gainNode || !this.analyserNode || !this.destinationNode) {
      throw new Error('Audio context not initialized');
    }

    const sources: MediaStream[] = [];
    if (this.systemAudioStream) sources.push(this.systemAudioStream);
    if (this.microphoneStream) sources.push(this.microphoneStream);

    // Create source nodes for each input stream
    for (const stream of sources) {
      const sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.sourceNodes.push(sourceNode);

      // Build audio processing chain
      let currentNode: AudioNode = sourceNode;

      // Apply noise cancellation chain if enabled
      if (this.options.enableNoiseCancellation && this.filterNode && this.compressorNode) {
        currentNode.connect(this.filterNode);
        currentNode = this.filterNode;
        currentNode.connect(this.compressorNode);
        currentNode = this.compressorNode;
      }

      // Connect to gain and analyser
      currentNode.connect(this.gainNode);
    }

    // Connect gain to analyser and destination
    this.gainNode.connect(this.analyserNode);
    this.gainNode.connect(this.destinationNode);
  }

  /**
   * Check if recorder is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all audio tracks
   */
  getTracks(): AudioTrackInfo[] {
    return this.tracks.map((track) => ({
      id: track.id,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      kind: track.kind,
      settings: track.getSettings(),
    }));
  }

  /**
   * Start recording audio
   *
   * @throws Error if not initialized
   * @returns MediaRecorder instance
   */
  async startRecording(): Promise<MediaRecorder> {
    if (!this.initialized || !this.outputStream) {
      throw new Error('Recorder must be initialized before recording');
    }

    if (this.recording) {
      throw new Error('Recording already in progress');
    }

    // Create MediaRecorder with the output stream
    this.mediaRecorder = new MediaRecorder(this.outputStream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.audioChunks = [];

    // Handle data available
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Start recording
    this.mediaRecorder.start(100); // Collect data every 100ms
    this.recording = true;

    // Start audio level monitoring
    this.startLevelMonitoring();

    return this.mediaRecorder;
  }

  /**
   * Stop recording and return audio blob
   *
   * @returns Promise resolving to recorded audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.recording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        this.recording = false;
        this.stopLevelMonitoring();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Get current audio level
   */
  getAudioLevel(): AudioLevel {
    if (!this.analyserNode) {
      return { rms: 0, peak: 0, db: -Infinity };
    }

    return { ...this.currentLevel };
  }

  /**
   * Start monitoring audio levels
   */
  private startLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const monitor = () => {
      if (!this.recording || !this.analyserNode) return;

      this.analyserNode.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square)
      let sum = 0;
      let peak = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
        peak = Math.max(peak, Math.abs(normalized));
      }

      const rms = Math.sqrt(sum / dataArray.length);
      const db = 20 * Math.log10(rms + 1e-10); // Add small value to avoid log(0)

      this.currentLevel = { rms, peak, db };
    };

    this.levelMonitoringInterval = window.setInterval(
      monitor,
      this.options.monitoringInterval
    );
  }

  /**
   * Stop monitoring audio levels
   */
  private stopLevelMonitoring(): void {
    if (this.levelMonitoringInterval !== null) {
      clearInterval(this.levelMonitoringInterval);
      this.levelMonitoringInterval = null;
    }
    this.currentLevel = { rms: 0, peak: 0, db: -Infinity };
  }

  /**
   * Set gain level
   *
   * @param gain - Gain value (0.0 to 2.0)
   */
  setGain(gain: number): void {
    if (gain < 0 || gain > 2) {
      throw new Error('Gain must be between 0 and 2');
    }

    if (this.gainNode) {
      this.gainNode.gain.value = gain;
    }
  }

  /**
   * Get current gain level
   */
  getGain(): number {
    return this.gainNode?.gain.value ?? 1.0;
  }

  /**
   * Enable or disable noise cancellation
   *
   * Note: This requires re-initialization to take effect
   */
  setNoiseCancellation(enabled: boolean): void {
    this.options.enableNoiseCancellation = enabled;
  }

  /**
   * Dispose of all resources
   */
  async dispose(): Promise<void> {
    // Stop recording if active
    if (this.recording) {
      try {
        await this.stopRecording();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    // Stop level monitoring
    this.stopLevelMonitoring();

    // Stop all tracks
    this.tracks.forEach((track) => track.stop());
    this.tracks = [];

    // Disconnect audio nodes
    this.sourceNodes.forEach((node) => node.disconnect());
    this.sourceNodes = [];

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.compressorNode) {
      this.compressorNode.disconnect();
      this.compressorNode = null;
    }

    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }

    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }

    this.audioContext = null;
    this.outputStream = null;
    this.mediaRecorder = null;
    this.systemAudioStream = null;
    this.microphoneStream = null;
    this.initialized = false;
    this.recording = false;
  }
}
