/**
 * NoiseProcessor - Advanced noise cancellation using spectral subtraction
 * Built by AINative
 */

export class NoiseProcessor {
  private audioContext: AudioContext;
  private noiseThreshold = 0.1;
  private noiseProfile: Float32Array | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // FFT parameters for spectral analysis
  private readonly fftSize = 2048;
  private readonly smoothingFactor = 0.8;
  private readonly overSubtractionFactor = 1.5;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.setupProcessingChain();
  }

  /**
   * Setup the audio processing chain
   */
  private setupProcessingChain(): void {
    // Create gain node for amplitude control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // Create high-pass filter to remove low-frequency noise
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.value = 80; // Remove rumble below 80Hz
    this.filterNode.Q.value = 0.7;

    // Create compressor for dynamic range control
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = -50;
    this.compressorNode.knee.value = 40;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0;
    this.compressorNode.release.value = 0.25;

    // Create script processor for spectral subtraction
    this.scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.scriptNode.onaudioprocess = this.processAudio.bind(this);
  }

  /**
   * Connect the noise processor to audio source and destination
   */
  connect(source: MediaStreamAudioSourceNode, destination: AudioNode): void {
    this.sourceNode = source;

    // Connect processing chain
    source.connect(this.filterNode!);
    this.filterNode!.connect(this.scriptNode!);
    this.scriptNode!.connect(this.gainNode!);
    this.gainNode!.connect(this.compressorNode!);
    this.compressorNode!.connect(destination);
  }

  /**
   * Disconnect the noise processor
   */
  disconnect(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
    }
    if (this.scriptNode) {
      this.scriptNode.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.compressorNode) {
      this.compressorNode.disconnect();
    }
  }

  /**
   * Set noise gate threshold (0-1)
   */
  setNoiseThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.noiseThreshold = threshold;
  }

  /**
   * Get current noise threshold
   */
  getNoiseThreshold(): number {
    return this.noiseThreshold;
  }

  /**
   * Learn noise profile from a sample of silence
   */
  learnNoiseProfile(silenceBuffer: Float32Array): void {
    if (silenceBuffer.length === 0) {
      return;
    }

    // Compute FFT of silence to get noise spectrum
    const fftData = this.computeFFT(silenceBuffer);

    // Store as noise profile
    this.noiseProfile = new Float32Array(fftData);

    // Apply smoothing to noise profile
    for (let i = 1; i < this.noiseProfile.length - 1; i++) {
      this.noiseProfile[i] = (
        this.noiseProfile[i - 1] * 0.25 +
        this.noiseProfile[i] * 0.5 +
        this.noiseProfile[i + 1] * 0.25
      );
    }
  }

  /**
   * Clear the learned noise profile
   */
  clearNoiseProfile(): void {
    this.noiseProfile = null;
  }

  /**
   * Check if noise profile exists
   */
  hasNoiseProfile(): boolean {
    return this.noiseProfile !== null;
  }

  /**
   * Process audio with spectral subtraction
   */
  processSpectralSubtraction(inputBuffer: Float32Array): Float32Array {
    if (inputBuffer.length === 0) {
      return new Float32Array(0);
    }

    // Apply noise gate first
    const gatedBuffer = this.applyNoiseGate(inputBuffer);

    // If we have a noise profile, apply spectral subtraction
    if (this.noiseProfile) {
      return this.applySpectralSubtraction(gatedBuffer);
    }

    return gatedBuffer;
  }

  /**
   * Apply noise gate to suppress low-level signals
   */
  private applyNoiseGate(buffer: Float32Array): Float32Array {
    const output = new Float32Array(buffer.length);
    const blockSize = 512;

    for (let i = 0; i < buffer.length; i += blockSize) {
      const blockEnd = Math.min(i + blockSize, buffer.length);
      const block = buffer.slice(i, blockEnd);

      // Calculate RMS level of block
      const rms = this.calculateRMS(block);

      // Apply gate
      const gain = rms > this.noiseThreshold ? 1.0 : 0.0;

      // Apply with smoothing
      for (let j = 0; j < block.length; j++) {
        output[i + j] = block[j] * gain;
      }
    }

    return output;
  }

  /**
   * Apply spectral subtraction algorithm
   */
  private applySpectralSubtraction(buffer: Float32Array): Float32Array {
    // Compute FFT of input
    const magnitude = this.computeFFT(buffer);
    const phase = this.computePhase(buffer);

    // Subtract noise spectrum
    const cleanMagnitude = new Float32Array(magnitude.length);
    for (let i = 0; i < magnitude.length; i++) {
      const noiseEstimate = this.noiseProfile
        ? this.noiseProfile[i] * this.overSubtractionFactor
        : 0;

      // Spectral subtraction with floor
      cleanMagnitude[i] = Math.max(
        magnitude[i] - noiseEstimate,
        magnitude[i] * 0.1 // Floor to prevent musical noise
      );
    }

    // Reconstruct signal from magnitude and phase
    const output = this.inverseFFT(cleanMagnitude, phase);

    return output;
  }

  /**
   * Compute FFT magnitude spectrum
   */
  private computeFFT(buffer: Float32Array): Float32Array {
    const fftSize = Math.min(this.fftSize, buffer.length);
    const magnitude = new Float32Array(fftSize / 2);

    // Simple DFT for magnitude calculation
    for (let k = 0; k < magnitude.length; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < fftSize; n++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        const sample = n < buffer.length ? buffer[n] : 0;
        real += sample * Math.cos(angle);
        imag -= sample * Math.sin(angle);
      }

      magnitude[k] = Math.sqrt(real * real + imag * imag) / fftSize;
    }

    return magnitude;
  }

  /**
   * Compute phase spectrum
   */
  private computePhase(buffer: Float32Array): Float32Array {
    const fftSize = Math.min(this.fftSize, buffer.length);
    const phase = new Float32Array(fftSize / 2);

    // Simple DFT for phase calculation
    for (let k = 0; k < phase.length; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < fftSize; n++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        const sample = n < buffer.length ? buffer[n] : 0;
        real += sample * Math.cos(angle);
        imag -= sample * Math.sin(angle);
      }

      phase[k] = Math.atan2(imag, real);
    }

    return phase;
  }

  /**
   * Inverse FFT to reconstruct time-domain signal
   */
  private inverseFFT(magnitude: Float32Array, phase: Float32Array): Float32Array {
    const fftSize = magnitude.length * 2;
    const output = new Float32Array(fftSize);

    // Inverse DFT
    for (let n = 0; n < fftSize; n++) {
      let sample = 0;

      for (let k = 0; k < magnitude.length; k++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        const real = magnitude[k] * Math.cos(phase[k]);
        const imag = magnitude[k] * Math.sin(phase[k]);

        sample += real * Math.cos(angle) - imag * Math.sin(angle);
      }

      output[n] = sample / magnitude.length;
    }

    return output;
  }

  /**
   * Calculate RMS level of buffer
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Process audio in real-time
   */
  private processAudio(event: AudioProcessingEvent): void {
    const inputBuffer = event.inputBuffer.getChannelData(0);
    const outputBuffer = event.outputBuffer.getChannelData(0);

    // Apply spectral subtraction
    const processed = this.processSpectralSubtraction(inputBuffer);

    // Copy to output
    for (let i = 0; i < outputBuffer.length; i++) {
      outputBuffer[i] = i < processed.length ? processed[i] : 0;
    }
  }
}
