export const VAD_HANGOVER_FRAMES = 12;

export interface OnnxConfig {
  model: {
    /**
     * Mel Spectrogram model (.onnx)
     *
     * Default: [basePath]/models/melspectrogram.onnx
     */
    melspectrogram?: string;

    /**
     * Embedding model (.onnx)
     *
     * Default: [basePath]/models/embedding_model.onnx
     */
    embedding_model?: string;

    /**
     * Silero VAD (.onnx)
     *
     * Default: [basePath]/models/silero_vad_v4.onnx
     */
    silero_vad?: string;

    /**
     * Wake word model (.onnx)
     */
    wakeword: string;
  };

  /**
   * Path that contains onnx wasm runtime files
   *
   * Default: [basePath]/wasm
   */
  runtimePath?: string;

  /**
   * Wake word inference threshold
   *
   * Default: 0.5
   */
  wakewordInferenceThreshold?: number;
}

export type InferenceModels = keyof OnnxConfig['model'];

export interface VadState {
  buffer: Float32Array[];
  hangoverCounter: number;
  isActive: boolean;
  emitFinal?: Float32Array[]; // Used to pass the completed chunk forward
}
