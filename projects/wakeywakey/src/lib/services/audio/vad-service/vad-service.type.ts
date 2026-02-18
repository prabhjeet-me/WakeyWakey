import { TypedTensor } from 'onnxruntime-web';

/**
 * VAD LSTM state
 */
export interface VADState {
  /**
   * Hidden state
   */
  hidden: TypedTensor<'float32'>;

  /**
   * Cell state
   */
  cell: TypedTensor<'float32'>;
}

/**
 * Session input metadata
 */
export interface InputMetadata {
  shape: (number | string)[];
}
