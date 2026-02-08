export interface NoiseProcessorOptions {
  threshold?: number;
}

export class NoiseProcessor {
  private threshold: number;
  private noiseProfile: Float32Array;
  private frameCount: number;
  private readonly LEARNING_FRAMES = 10;

  constructor(options: NoiseProcessorOptions = {}) {
    this.threshold = Math.max(0, Math.min(1, options.threshold ?? 0.2));
    this.noiseProfile = new Float32Array(0);
    this.frameCount = 0;
  }

  process(input: Float32Array): Float32Array {
    if (input.length === 0) {
      return new Float32Array(0);
    }

    // Initialize noise profile on first call
    if (this.noiseProfile.length === 0) {
      this.noiseProfile = new Float32Array(input.length);
    }

    // Learn noise profile during initial frames
    if (this.frameCount < this.LEARNING_FRAMES) {
      this.updateNoiseProfile(input);
      this.frameCount++;
      return input; // Pass through during learning
    }

    // Apply noise reduction
    const output = new Float32Array(input.length);

    for (let i = 0; i < input.length; i++) {
      const signal = Math.abs(input[i]);
      const noise = this.noiseProfile[i];

      // Spectral subtraction
      if (signal > noise + this.threshold) {
        // Signal is significantly above noise floor
        output[i] = input[i];
      } else {
        // Signal is in noise range, reduce it
        const reduction = 1 - (this.threshold / (signal + 0.0001));
        output[i] = input[i] * Math.max(0, reduction);
      }
    }

    // Continuously update noise profile with current frame
    this.updateNoiseProfile(input, 0.01);

    return output;
  }

  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }

  getThreshold(): number {
    return this.threshold;
  }

  reset(): void {
    this.noiseProfile = new Float32Array(0);
    this.frameCount = 0;
  }

  private updateNoiseProfile(input: Float32Array, alpha: number = 1.0): void {
    for (let i = 0; i < input.length; i++) {
      const magnitude = Math.abs(input[i]);

      if (this.frameCount < this.LEARNING_FRAMES) {
        // Initial learning: average the noise
        this.noiseProfile[i] =
          (this.noiseProfile[i] * this.frameCount + magnitude) /
          (this.frameCount + 1);
      } else {
        // Continuous adaptation: exponential moving average
        this.noiseProfile[i] =
          this.noiseProfile[i] * (1 - alpha) + magnitude * alpha;
      }
    }
  }
}
