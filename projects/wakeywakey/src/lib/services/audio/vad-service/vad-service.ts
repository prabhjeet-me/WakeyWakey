import { Injectable, inject } from '@angular/core';
import { Tensor, TypedTensor } from 'onnxruntime-web';
import { EventService } from '../../event/event-service';
import { StoreService } from '../../store/store-service';
import { SAMPLE_RATE } from '../microphone-service/microphone-service.constant';
import { InputMetadata, VADState } from './vad-service.type';

@Injectable()
export class VadService {
  /**
   * Dependencies
   */
  private readonly _event = inject(EventService);
  private readonly _store = inject(StoreService);

  /**
   * VAD Shape
   */
  private _shape: number[] = [];

  /**
   * VAD LSTM hidden & cell state
   */
  private _state: VADState | null = null;

  /**
   * Get session
   */
  private get _session() {
    return this._store.inferenceSession('silero_vad')!;
  }

  /**
   * Initialize
   */
  init() {
    this._shape = this._getShape();

    this._state = {
      hidden: new Tensor('float32', new Float32Array(128).fill(0), this._shape),
      cell: new Tensor('float32', new Float32Array(128).fill(0), this._shape),
    };
  }

  /**
   * Get VAD score
   *
   * @param chunk
   * @returns
   */
  async score(sample: Float32Array): Promise<number> {
    if (!this._state) throw new Error(`${VadService.name}: Undefined LSTM state.`);

    try {
      const tensor = new Tensor('float32', sample, [1, sample.length]);
      const sampleRate = new Tensor('int64', [BigInt(SAMPLE_RATE)], []);

      // run inference
      const response = await this._session.run({
        input: tensor,
        sr: sampleRate,
        h: this._state.hidden,
        c: this._state.cell,
      });

      // Update memory
      this._state.hidden = response['hn'] as TypedTensor<'float32'>;
      this._state.cell = response['cn'] as TypedTensor<'float32'>;

      return response['output'].data[0] as number;
    } catch (error) {
      this._event.exception.next(error as Error);
      return 0;
    }
  }

  /**
   * Get shape of vad session
   *
   * Ex: [2, 1, 64]
   */
  private _getShape() {
    const { shape } = (this._session.inputMetadata.find((e) => e.name === 'h') ||
      {}) as InputMetadata;

    const vadState = [];

    if (shape) {
      for (const sh of shape) {
        if (typeof sh === 'string') vadState.push(1);
        else vadState.push(sh);
      }

      return vadState;
    }

    throw new Error(`${VadService.name}: Unable to identify shape of the session.`);
  }
}
