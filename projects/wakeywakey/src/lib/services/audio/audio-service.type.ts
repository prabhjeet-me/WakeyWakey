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
  noiseSuppression?: boolean;

  /**
   * Paths
   */
  path?: {
    /**
     * Path of sound to be played when wake word is detected
     */
    upSound?: string;

    /**
     * Path of sound to be played when system is done recording and silence is detected
     */
    downSound?: string;
  };
}
