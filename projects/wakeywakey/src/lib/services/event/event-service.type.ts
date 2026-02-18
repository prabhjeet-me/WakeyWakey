import { MicrophoneProcessorData } from '../audio/microphone-service/microphone-service.type';

/**
 * Speech event emitter
 */
export interface SpeechEvent extends MicrophoneProcessorData {
  /**
   * VAD score of input
   */
  vadScore: number;

  /**
   * Has voice activity
   */
  get hasVoiceActivity(): boolean;
}

/**
 * Wake work detected event
 */
export interface WakeWordEvent extends SpeechEvent {
  /**
   * Inference score
   */
  inferenceScore: number;

  /**
   * Chunk on wake word detected
   */
  chunk: Float32Array[];
}
