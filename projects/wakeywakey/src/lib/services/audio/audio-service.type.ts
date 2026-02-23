export interface AudioConfig {
  /**
   * Audio gain
   */
  gain: number;

  /**
   * Voice activity detection threshold
   *
   * Default: 0.5
   */
  vadThreshold?: number;

  /**
   * Silence duration
   *
   * Default: 1000ms
   */
  silenceDuration?: number;

  /**
   * Use RNN to suppress noise
   */
  noiseSuppression?: {
    /**
     * Enable noise suppression
     */
    enable?: boolean;

    /**
     * RNNoise worklet js
     *
     * Default: [basePath]/worklets/workletProcessor.js
     */
    worklet?: string;

    /**
     * RNNoise wasm file
     *
     * Default: [basePath]/wasm/rnnoise.wasm
     */
    rnnoise?: string;

    /**
     * RNNoise simd wasm file
     *
     * Default: [basePath]/wasm/rnnoise_simd.wasm
     */
    rnnoise_simd?: string;
  };

  /**
   * Paths
   */
  sound?: {
    /**
     * Enable sound
     *
     * Default: true
     */
    enable?: boolean;

    /**
     * Path of sound to be played when wake word is detected
     *
     * Default: [basePath]/sounds/up.mp3
     */
    up?: string;

    /**
     * Path of sound to be played when system is done recording and silence is detected
     *
     * Default: [basePath]/sounds/down.mp3
     */
    down?: string;
  };
}
