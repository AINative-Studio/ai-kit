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
      const inputVal = input[i];
      if (inputVal === undefined) continue;

      const signal = Math.abs(inputVal);
      const noise = this.noiseProfile[i] ?? 0;

      // Spectral subtraction
      if (signal > noise + this.threshold) {
        // Signal is significantly above noise floor
        output[i] = inputVal;
      } else {
        // Signal is in noise range, reduce it
        const reduction = 1 - (this.threshold / (signal + 0.0001));
        output[i] = inputVal * Math.max(0, reduction);
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
      const inputVal = input[i];
      if (inputVal === undefined) continue;

      const magnitude = Math.abs(inputVal);

      if (this.frameCount < this.LEARNING_FRAMES) {
        // Initial learning: average the noise
        const currentProfile = this.noiseProfile[i] ?? 0;
        this.noiseProfile[i] =
          (currentProfile * this.frameCount + magnitude) /
          (this.frameCount + 1);
      } else {
        // Continuous adaptation: exponential moving average
        const currentProfile = this.noiseProfile[i] ?? 0;
        this.noiseProfile[i] =
          currentProfile * (1 - alpha) + magnitude * alpha;
      }
    }
  }
}
