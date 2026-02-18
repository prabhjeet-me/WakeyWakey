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
   * Inference config
   */
  get inference() {
    return this._config.inference;
  }
}
