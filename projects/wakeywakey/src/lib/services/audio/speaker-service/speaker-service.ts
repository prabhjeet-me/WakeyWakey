import { inject, Injectable } from '@angular/core';
import { ConfigService } from '../../config/config-service';
import { PlatformService } from '../../platform/platform-service';

@Injectable()
export class SpeakerService {
  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);
  private readonly _platform = inject(PlatformService);

  private _upSound!: HTMLAudioElement;
  private _downSound!: HTMLAudioElement;

  constructor() {
    // Audio is only available in browser context
    if (this._platform.isBrowser) {
      this._upSound = new Audio(this._config.audio.path?.upSound);
      this._downSound = new Audio(this._config.audio.path?.downSound);

      this._upSound.preload = this._downSound.preload = 'auto';
    }
  }

  /**
   * Play on sound
   */
  playUp() {
    this._upSound.play();
  }

  /**
   * Play off sound
   */
  playDown() {
    this._downSound.play();
  }
}
