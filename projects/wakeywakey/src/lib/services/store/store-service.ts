import { inject, Injectable } from '@angular/core';
import { InferenceSession } from 'onnxruntime-web';
import { EventService } from '../event/event-service';
import { InferenceModels } from '../inference/inference-service.type';

@Injectable()
export class StoreService {
  /**
   * Dependencies
   */
  private readonly _event = inject(EventService);

  /**
   * Inference session
   */
  private _inferenceSession: Record<InferenceModels, InferenceSession | undefined> = {
    melspectrogram: undefined,
    embedding_model: undefined,
    silero_vad: undefined,
    wakeword_model: undefined,
  };

  /**
   * Set inference session
   *
   * @param model mel name
   * @param session session instance
   */
  saveInferenceSession(model: InferenceModels, session: InferenceSession) {
    this._inferenceSession[model] = session;
  }

  /**
   * Get inference session
   *
   * @param model model name
   * @returns inference session
   */
  inferenceSession(model: InferenceModels) {
    if (!this._inferenceSession[model]) {
      const error = new Error(`"${model}" inference session not found!`);

      this._event.exception.next(error);
      throw error;
    }

    return this._inferenceSession[model];
  }
}
