import { inject, Injectable } from '@angular/core';
import { env, InferenceSession } from 'onnxruntime-web';
import { ConfigService } from '../config/config-service';
import { EventService } from '../event/event-service';
import { InferenceModels } from './model-service.type';

@Injectable()
export class ModelService {
  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);
  private readonly _event = inject(EventService);

  /**
   * Inference session
   */
  private _inferenceSession: Record<InferenceModels, InferenceSession | undefined> = {
    melspectrogram: undefined,
    embedding: undefined,
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
    return this._inferenceSession['embedding']!;
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
   * Initialize
   *
   * @returns true if inference is loaded
   */
  async init() {
    // Set wasm path
    env.wasm.wasmPaths = this._config.onnx.runtimePath ?? '/ort/';

    try {
      // Create sessions
      const sessions = await Promise.all(
        Object.values(this._config.onnx.model).map((path) =>
          InferenceSession.create(path, { executionProviders: ['wasm'] }),
        ),
      );

      // Save sessions
      Object.keys(this._config.onnx.model).forEach((name, index) => {
        this._inferenceSession[name as InferenceModels] = sessions[index];
      });
    } catch (error) {
      this._event.exception.next(error as Error);
      this._event.exception.next(
        new Error(`${ModelService.name}: Unable to create inference session. Stopping.`),
      );

      return false;
    }

    return true;
  }
}
