/**
 * Microphone processor data
 */
export interface MicrophoneProcessorData {
  /**
   * Audio sample
   */
  sample: Float32Array;

  /**
   * RMS value  of sample
   */
  rms: number;

  /**
   * Decibel of sample
   */
  db: number;

  /**
   * Normalized decibel (0-1)
   */
  dbNormalized: number;
}
