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
   * Emit mic sound to speakers
   */
  loopBackToSpeakers?: boolean;

  /**
   * Silence duration
   *
   * Default: 1000ms
   */
  silenceDuration?: number;

  /**
   * Wait (in ms) before considering user has started speaking
   */
  speechThresholdTime?: number;

  /**
   * Use RNN to suppress noise
   */
  noiseSuppression?: {
    /**
     * Enable RNN based noise suppression
     */
    rnnBased?: boolean;

    /**
     * Native noise suppression
     */
    nativeNoiseSuppression?: boolean;

    /**
     * Native echo cancellation
     */
    nativeEchoCancellation?: boolean;

    /**
     * Native auto gain control
     */
    autoGainControl?: boolean;

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
     * Overall volume (0-1)
     */
    masterVolume?: number;

    /**
     * Path of sound to be played when wake word is detected
     *
     * Default: [basePath]/sounds/up.mp3
     */
    up?: string;

    /**
     * Up volume (0-1)
     *
     * Default: masterVolume (if defined) else 0.5
     */
    upVolume?: number;

    /**
     * Path of sound to be played when
     * 1. DEFAULT | PTT: system is done recording and silence is detected
     * 2. VOICE_CHAT: user clicks on orb to stop listening
     *
     * Default: [basePath]/sounds/down.mp3
     */
    down?: string;

    /**
     * Down volume (0-1)
     *
     * Default: masterVolume (if defined) else 0.5
     */
    downVolume?: number;

    /**
     * Path of sound to be played when system is done recording and silence is detected (in case of VOICE_CHAT)
     *
     * Default: [basePath]/sounds/ping.mp3
     */
    ping?: string;

    /**
     * Ping volume (0-1)
     *
     * Default: masterVolume (if defined) else 0.1
     */
    pingVolume?: number;
  };
}
