import { inject, Injectable, OnDestroy } from '@angular/core';
import { throttleTime } from 'rxjs';
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
    if (this._config.audio.sound?.enable === false) return;

    // Audio is only available in browser context
    if (this._platform.isBrowser) {
      this._upSound = new Audio(
        this._config.audio.sound?.up ?? `${this._config.basePath}/sounds/up.mp3`,
      );
      this._downSound = new Audio(
        this._config.audio.sound?.down ?? `${this._config.basePath}/sounds/down.mp3`,
      );

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
    if (this._config.audio.sound?.enable === false) return;

    this._upSound.play();
  }

  /**
   * Play off sound
   */
  playDown() {
    if (this._config.audio.sound?.enable === false) return;

    this._downSound.play();
  }

  /**
   * Load subscriptions
   */
  private _loadSubscriptions() {
    this._subs.sink = this._event.wakeword
      .pipe(throttleTime(this._config.throttleTime))
      .subscribe(() => {
        this.playUp();
      });

    // If default, on silence, play down
    this._subs.sink = this._event.silence.subscribe((ev) => {
      if (!ev.interimResponse) this.playDown();
    });
  }
}
