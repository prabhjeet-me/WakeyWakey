import { inject, Injectable, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import { ConfigService } from '../../config/config-service';
import { EventService } from '../../event/event-service';
import { PlatformService } from '../../platform/platform-service';

@Injectable()
export class SpeakerService implements OnDestroy {
  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);
  private readonly _platform = inject(PlatformService);
  private readonly _event = inject(EventService);

  private readonly _subs = new SubSink();

  private _upSound!: HTMLAudioElement;
  private _downSound!: HTMLAudioElement;

  constructor() {
    // Audio is only available in browser context
    if (this._platform.isBrowser) {
      this._upSound = new Audio(this._config.audio.path?.upSound);
      this._downSound = new Audio(this._config.audio.path?.downSound);

      this._upSound.preload = this._downSound.preload = 'auto';

      this._loadSubscriptions();
    }
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
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

  /**
   * Load subscriptions
   */
  private _loadSubscriptions() {
    this._subs.sink = this._event.wakeword.subscribe(() => {
      this.playUp();
    });

    // If default, on silence, play down
    if (this._config.mode == 'DEFAULT')
      this._subs.sink = this._event.silence.subscribe(() => {
        this.playDown();
      });
  }
}
