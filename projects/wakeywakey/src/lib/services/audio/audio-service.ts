import { Injectable, inject } from '@angular/core';
import { ConfigService } from '../config/config-service';
import { EventService } from '../event/event-service';
import { MicrophoneService } from './microphone-service/microphone-service';
import { VadService } from './vad-service/vad-service';
import { DEFAULT_VAD_THRESHOLD } from './vad-service/vad-service.const';

@Injectable()
export class AudioService {
  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);
  private readonly _event = inject(EventService);
  private readonly _mic = inject(MicrophoneService);
  private readonly _vad = inject(VadService);

  /**
   * Initialize audio
   */
  async init() {
    const data = await this._mic.data;

    // Init VAD
    this._vad.init();

    // Fire ready event
    this._event.ready.next();

    data.subscribe(async (data) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;

      // Fire a speech event
      this._event.speech.next({
        ...data,
        vadScore: await this._vad.score(data.sample),
        get hasVoiceActivity() {
          return this.vadScore > (that._config.audio.vadThreshold || DEFAULT_VAD_THRESHOLD);
        },
      });
    });
  }
}
