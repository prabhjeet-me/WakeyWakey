import { inject, Injectable } from '@angular/core';
import { Config, CONFIG } from './config-service.type';

@Injectable()
export class ConfigService {
  private readonly _config = inject<Config>(CONFIG);

  /**
   * Audio config
   */
  get audio() {
    return this._config.audio;
  }

  /**
   * Onnx config
   */
  get onnx() {
    return this._config.onnx;
  }

  /**
   * Throttle time
   */
  get throttleTime() {
    return this._config.throttleTime;
  }
}
