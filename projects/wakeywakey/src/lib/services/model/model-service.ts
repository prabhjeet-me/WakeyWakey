import { Injectable } from '@angular/core';
import { InferenceSession } from 'onnxruntime-web';
import { InferenceModels } from './model-service.type';

@Injectable()
export class ModelService {
  /**
   * Inference session
   */
  private _inferenceSession: Record<InferenceModels, InferenceSession | undefined> = {
    melspectrogram: undefined,
    embedding_model: undefined,
    silero_vad: undefined,
    wakeword: undefined,
  };

  /**
   * Get melspectrogram inference session
   */
  get melSpectrogram() {
    return this._inferenceSession['melspectrogram']!;
  }

  /**
   * Get embedding inference session
   */
  get embedding() {
    return this._inferenceSession['embedding_model']!;
  }

  /**
   * Get Silero VAD inference session
   */
  get sileroVAD() {
    return this._inferenceSession['silero_vad']!;
  }

  /**
   * Get wakeword inference session
   */
  get wakeword() {
    return this._inferenceSession['wakeword']!;
  }

  /**
   * Set session instance
   */
  set session(sessions: Record<InferenceModels, InferenceSession | undefined>) {
    this._inferenceSession = sessions;
  }
}
